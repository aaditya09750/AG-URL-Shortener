const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const shortid = require('shortid');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define URL Schema
const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  urlCode: {
    type: String,
    required: true,
    unique: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Url = mongoose.model('Url', urlSchema);

// Set up Socket.io

// Configure Mongoose connection pool
// Note: poolSize and bufferMaxEntries are deprecated in newer Mongoose versions
// Connection pooling and buffering are now handled in the connection options

// Connect to MongoDB with retry mechanism and improved error handling
const connectWithRetry = () => {
  console.log('Attempting to connect to MongoDB...');
  // mongoose.connect('mongodb://localhost:27017/url-shortner', { [ ...For local host connection ]
  mongoose.connect('mongodb+srv://aadityagunjal0975:pFHVow9cFqjBW7w3@cluster0.psityjt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    connectTimeoutMS: 30000, // Increase connection timeout to 30 seconds
    heartbeatFrequencyMS: 10000, // More frequent heartbeats
    family: 4, // Force IPv4 (can help with some connection issues)
    maxPoolSize: 10, // Replace deprecated poolSize option
    bufferCommands: false // Disable command buffering (replaces bufferMaxEntries)
  })
  .then(() => {
    console.log('Connected to MongoDB');
    isMongoConnected = true;
    
    // Set up socket handlers now that MongoDB is connected
    setupSocketHandlers();
    
    // Create a test URL to verify database is working
    const testUrl = new Url({
      originalUrl: 'https://example.com',
      shortUrl: 'https://urlshortenerapi-xrqh.onrender.com/test123',
      urlCode: 'test123',
      clicks: 0
    });
    
    // Check if test URL already exists with timeout handling
    Url.findOne({ urlCode: 'test123' })
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .then(existingUrl => {
        if (!existingUrl) {
          // Save test URL if it doesn't exist
          testUrl.save()
            .then(() => console.log('Test URL created successfully'))
            .catch(err => console.error('Error creating test URL:', err));
        } else {
          console.log('Test URL already exists');
        }
      })
      .catch(err => {
        console.error('Error checking for test URL:', err);
        // Continue server startup even if test URL check fails
        console.log('Continuing server startup despite test URL check failure');
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    
    // Check if the error is related to buffering timeout
    if (err.message && err.message.includes('buffering timed out')) {
      console.log('Detected buffering timeout error, clearing Mongoose connection buffers...');
      // Clear any pending operations in Mongoose
      mongoose.connection.db?.close();
      mongoose.connection.removeAllListeners();
    }
    
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket handlers after MongoDB connection
let isMongoConnected = false;

// Socket.io connection handler - will be set up after MongoDB connects
const setupSocketHandlers = () => {
  io.on('connection', (socket) => {
    console.log('New client connected with ID:', socket.id);
  
  // Send all URLs to the client upon connection with timeout handling
  const sendAllUrls = () => {
    Url.find().sort({ createdAt: -1 })
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .then(urls => {
        socket.emit('urls', urls);
      })
      .catch(err => {
        console.error('Error fetching URLs:', err);
        // Send empty array to prevent client from waiting indefinitely
        socket.emit('urls', []);
      });
  };
  
  // Send URLs immediately on connection
  sendAllUrls();
  
  // Listen for explicit request to get all URLs (used on reconnection)
  socket.on('get_urls', () => {
    console.log('Client requested all URLs');
    sendAllUrls();
  });

  // Listen for new URL creation
  socket.on('new_url', (data) => {
    try {
      console.log('Received new_url event with data:', data);
      const { originalUrl } = data;
      console.log('Creating short URL for:', originalUrl);
      
      // Send immediate acknowledgment to client that request is being processed
      socket.emit('processing_url', { originalUrl });
      
      try {
        // Process URL creation synchronously to ensure it's saved
        // Changed from async/await to synchronous to ensure URL is saved before emitting events
        createShortUrl(originalUrl)
          .then(url => {
            if (!url) {
              throw new Error('Failed to create short URL');
            }
            
            console.log('Created short URL:', url);
            
            // Verify the URL was saved to the database with timeout handling
            return Url.findById(url._id)
              .maxTimeMS(15000) // Set maximum execution time to 15 seconds
              .then(savedUrl => {
                if (!savedUrl) {
                  console.error('URL verification failed in socket handler');
                  // Continue with the operation instead of throwing error
                  console.log('Continuing despite verification failure in socket handler');
                  return url;
                }
                return url;
              })
              .catch(verifyError => {
                console.error('Error verifying URL in socket handler:', verifyError);
                // Continue with the operation instead of propagating error
                return url;
              });
          })
          .then(url => {
            // Always emit the url_created event to the requesting client
            // This ensures the client gets a response even for existing URLs
            socket.emit('url_created', url);
            
            // Only broadcast to other clients if it's a new URL
            if (!url.isExisting) {
              console.log('Broadcasting url_created event to other clients');
              socket.broadcast.emit('url_created', url);
            } else {
              console.log('URL already exists, not broadcasting to other clients');
            }
          })
          .catch(error => {
            console.error('Error creating short URL:', error);
            socket.emit('error', { message: error.message || 'Failed to create short URL' });
          });
      } catch (error) {
        console.error('Error in createShortUrl call:', error);
        socket.emit('error', { message: error.message || 'Failed to create short URL' });
      }
    } catch (error) {
      console.error('Error in new_url event:', error);
      socket.emit('error', { message: error.message || 'Server error processing URL' });
    }
  });

  // Listen for URL deletion
  socket.on('delete_url', async (data) => {
    try {
      const { id } = data;
      
      // Add timeout handling for delete operation
      await Url.findByIdAndDelete(id)
        .maxTimeMS(15000) // Set maximum execution time to 15 seconds
        .exec();
      
      // Add a small delay to prevent MongoDB operation buffering timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Remove from cache if present
      for (const [key, value] of urlCache.entries()) {
        if (value._id.toString() === id) {
          urlCache.delete(key);
          break;
        }
      }
      
      io.emit('url_deleted', { id }); // Broadcast to all clients
    } catch (error) {
      console.error('Error deleting URL:', error);
      socket.emit('error', { message: error.message || 'Failed to delete URL' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
};

// URL cache to improve performance
const urlCache = new Map();

// Helper function to create a short URL
async function createShortUrl(originalUrl) {
  try {
    // Normalize the URL to prevent duplicates with different protocols
    let normalizedUrl = originalUrl;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
      console.log('Normalized URL by adding https:// prefix:', normalizedUrl);
    }
    
    // Check cache first for better performance
    if (urlCache.has(normalizedUrl)) {
      console.log('URL found in cache');
      return { ...urlCache.get(normalizedUrl), isExisting: true };
    }

    // Check if URL already exists in the database with timeout handling
    console.log('Checking if URL exists in database:', normalizedUrl);
    const existingUrl = await Url.findOne({ originalUrl: normalizedUrl })
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .lean();
    
    // Add a small delay to prevent MongoDB operation buffering timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (existingUrl) {
      console.log('URL found in database:', existingUrl._id);
      // Add to cache for future requests
      urlCache.set(normalizedUrl, existingUrl);
      // Add isExisting flag to indicate this URL already exists
      return { ...existingUrl, isExisting: true };
    }
    
    // Generate a unique short code
    const urlCode = shortid.generate();
    // shortUrl: 'http://localhost:3002/test123', for local host
    // shortUrl: 'https://urlshortenerapi-xrqh.onrender.com/test123', for render deployment
    const shortUrl = `https://urlshortenerapi-xrqh.onrender.com/${urlCode}`;
    console.log('Generated new short URL:', shortUrl, 'for original URL:', normalizedUrl);
    
    // Create new URL document
    const newUrl = new Url({
      originalUrl: normalizedUrl,
      shortUrl,
      urlCode,
      clicks: 0
    });
    
    // Save to database and wait for it to complete to ensure persistence
    let savedUrl;
    try {
      console.log('Attempting to save URL to database...');
      savedUrl = await newUrl.save();
      console.log('New URL saved to database with ID:', savedUrl._id);
    } catch (saveError) {
      console.error('Error saving URL to database:', saveError);
      // Check if it was a duplicate key error (someone else might have created the same URL)
      if (saveError.code === 11000) {
        console.log('Encountered duplicate key error, checking if URL exists...');
        // Try to find the existing URL again with timeout handling
        const duplicateUrl = await Url.findOne({ originalUrl: normalizedUrl })
          .maxTimeMS(15000) // Set maximum execution time to 15 seconds
          .lean();
        
        // Add a small delay to prevent MongoDB operation buffering timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (duplicateUrl) {
          console.log('Found duplicate URL after save error:', duplicateUrl._id);
          urlCache.set(normalizedUrl, duplicateUrl);
          return { ...duplicateUrl, isExisting: true };
        }
        
        // Also check if the urlCode already exists (rare but possible collision) with timeout handling
        const duplicateCode = await Url.findOne({ urlCode })
          .maxTimeMS(15000) // Set maximum execution time to 15 seconds
          .lean();
        
        // Add a small delay to prevent MongoDB operation buffering timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        if (duplicateCode) {
          console.log('Found duplicate urlCode after save error:', duplicateCode._id);
          // Generate a new code and try again
          console.log('Generating new urlCode and retrying...');
          return createShortUrl(originalUrl); // Recursive call with same URL to get new code
        }
      }
      throw saveError;
    }
    
    // Verify the URL was saved with timeout handling
    console.log('Verifying URL was saved to database...');
    const verifiedUrl = await Url.findById(savedUrl._id)
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .exec();
    
    // Add a small delay to prevent MongoDB operation buffering timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!verifiedUrl) {
      console.error('URL verification failed - not found in database after save');
      // Continue without throwing error to prevent blocking the operation
      console.log('Continuing despite verification failure');
      // Use the saved URL object instead of verification
      return { ...savedUrl.toObject(), isExisting: false };
    }
    
    console.log('URL verified in database with ID:', verifiedUrl._id);
    
    // Convert to plain object and add to cache
    const savedUrlObj = savedUrl.toObject();
    urlCache.set(normalizedUrl, savedUrlObj);
    
    // Add isExisting flag set to false for new URLs
    return { ...savedUrlObj, isExisting: false };
  } catch (error) {
    console.error('Error creating short URL:', error);
    throw error;
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    // Check if MongoDB is connected using both the connection state and our flag
    if (mongoose.connection.readyState === 1 && isMongoConnected) {
      return res.status(200).json({ status: 'ok', message: 'API is healthy', mongoStatus: 'connected' });
    } else {
      return res.status(503).json({ status: 'error', message: 'Database connection issue', mongoStatus: mongoose.connection.readyState, isMongoConnected });
    }
  } catch (error) {
    console.error('Error in health check endpoint:', error);
    return res.status(500).json({ status: 'error', message: 'Server error during health check' });
  }
});

// Create a short URL
app.post('/api/shorten', async (req, res) => {
  try {
    // Accept either 'url' or 'originalUrl' parameter for compatibility
    const url = req.body.url || req.body.originalUrl;
    
    if (!url) {
      console.error('/api/shorten: URL is required');
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (err) {
      console.error('/api/shorten: Invalid URL:', url);
      return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
      console.log('/api/shorten: Creating short URL for:', url);
      const shortUrl = await createShortUrl(url);
      
      if (!shortUrl) {
        console.error('/api/shorten: Failed to create short URL');
        throw new Error('Failed to create short URL');
      }
      
      console.log('/api/shorten: Short URL created:', shortUrl);
      
      // Remove isExisting flag before sending response
      const { isExisting, ...urlData } = shortUrl;
      
      // Verify the URL was saved to the database with timeout handling
      try {
        const savedUrlCheck = await Url.findOne({ _id: shortUrl._id })
          .maxTimeMS(15000) // Set maximum execution time to 15 seconds
          .exec();
        
        // Add a small delay to prevent MongoDB operation buffering timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!savedUrlCheck) {
          console.error('/api/shorten: URL was not saved to the database:', shortUrl._id);
          // Continue with the operation instead of throwing error
          console.log('/api/shorten: Continuing despite verification failure');
        } else {
          console.log('/api/shorten: Verified URL was saved to database with ID:', savedUrlCheck._id);
        }
      } catch (verifyError) {
        console.error('/api/shorten: Error verifying URL:', verifyError);
        // Continue with the operation instead of propagating error
      }
      res.json(urlData);
    } catch (createError) {
      console.error('Error creating short URL:', createError);
      return res.status(500).json({ error: createError.message || 'Failed to create short URL' });
    }
  } catch (error) {
    console.error('Error in /api/shorten:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get all URLs with timeout handling
app.get('/api/urls', async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 })
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .exec();
    
    // Add a small delay to prevent MongoDB operation buffering timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json(urls || []);
  } catch (error) {
    console.error('Error in /api/urls:', error);
    // Return empty array instead of error to prevent client from breaking
    res.json([]);
  }
});

// Delete a URL with timeout handling
app.delete('/api/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await Url.findByIdAndDelete(id)
      .maxTimeMS(15000) // Set maximum execution time to 15 seconds
      .exec();
    
    // Add a small delay to prevent MongoDB operation buffering timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Remove from cache if present
    for (const [key, value] of urlCache.entries()) {
      if (value._id.toString() === id) {
        urlCache.delete(key);
        break;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/urls/:id:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cache for URL codes to improve redirect performance
const redirectCache = new Map();

// Redirect to original URL with timeout handling
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Check cache first for better performance
    let url;
    if (redirectCache.has(code)) {
      url = redirectCache.get(code);
      console.log('Redirect URL found in cache');
    } else {
      try {
        url = await Url.findOne({ urlCode: code })
          .maxTimeMS(15000) // Set maximum execution time to 15 seconds
          .exec();
        
        // Add a small delay to prevent MongoDB operation buffering timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (url) {
          // Add to cache for future requests
          redirectCache.set(code, url);
        }
      } catch (dbError) {
        console.error('Error finding URL for redirect:', dbError);
        // Return 404 if database operation fails
        return res.status(404).json({ error: 'URL not found or database error' });
      }
    }
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Increment click count
    url.clicks += 1;
    
    // Update cache with new click count
    if (redirectCache.has(code)) {
      redirectCache.set(code, url);
    }
    
    // Save to database with timeout handling - we'll use a promise but start the redirect immediately
    const savePromise = url.save({ maxTimeMS: 15000 }) // Set maximum execution time to 15 seconds
      .catch(saveError => {
        // Log error but don't block the redirect
        console.error('Error updating click count:', saveError);
      });
    
    // Redirect to original URL immediately
    res.redirect(url.originalUrl);
    
    // After redirect is sent, wait for save to complete and emit event
    try {
      await savePromise;
      // Emit click event to all connected clients after save
      io.emit('url_clicked', { id: url._id, clicks: url.clicks });
    } catch (err) {
      console.error('Error saving click count:', err);
    }
    
    return;
  } catch (error) {
    console.error('Error in /:code redirect:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB connection configured with increased timeouts and error handling`);
  console.log(`API is available at https://urlshortenerapi-xrqh.onrender.com`);
});