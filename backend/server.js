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

// Initialize database connection flag
let isMongoConnected = false;
console.log('Initializing MongoDB connection...');

// Connect to MongoDB
const connectWithRetry = () => {
  console.log('Attempting to connect to MongoDB...');
  mongoose.connect('mongodb://localhost:27017/url-shortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    family: 4,
    maxPoolSize: 10,
    bufferCommands: false
  })
  .then(() => {
    console.log('Connected to MongoDB');
    isMongoConnected = true;
    
    // Set up socket handlers after MongoDB connection
    setupSocketHandlers();
    
    // Create a test URL if it doesn't exist
    Url.findOne({ urlCode: 'test123' })
      .then(existingUrl => {
        if (!existingUrl) {
          const testUrl = new Url({
            originalUrl: 'https://example.com',
            shortUrl: 'http://localhost:3002/test123',
            urlCode: 'test123',
            clicks: 0
          });
          testUrl.save()
            .then(() => console.log('Test URL created successfully'))
            .catch(err => console.error('Error creating test URL:', err));
        } else {
          console.log('Test URL already exists');
        }
      })
      .catch(err => {
        console.error('Error checking for test URL:', err);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

// Initialize MongoDB connection
connectWithRetry();

// URL cache to improve performance
const urlCache = new Map();

// Cache for URL codes to improve redirect performance
const redirectCache = new Map();

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  }
});


// Socket.io connection handler
const setupSocketHandlers = () => {
  io.on('connection', (socket) => {
    console.log('New client connected with ID:', socket.id);
  
  // Send all URLs to the client upon connection
  const sendAllUrls = async () => {
    try {
      if (!isMongoConnected) {
        console.log('MongoDB not connected, sending empty array');
        socket.emit('urls', []);
        return;
      }
      
      const urls = await Url.find().sort({ createdAt: -1 }).lean();
      socket.emit('urls', urls || []);
    } catch (err) {
      console.error('Error fetching URLs:', err);
      socket.emit('urls', []);
    }
  };
  
  // Send URLs immediately on connection
  sendAllUrls();
  
  // Listen for explicit request to get all URLs (used on reconnection)
  socket.on('get_urls', async () => {
    console.log('Client requested all URLs');
    await sendAllUrls();
  });

  // Listen for new URL creation
  socket.on('new_url', async (data) => {
    try {
      console.log('Received new_url event with data:', data);
      const { originalUrl } = data;
      
      if (!originalUrl) {
        socket.emit('error', { message: 'URL is required' });
        return;
      }
      
      console.log('Creating short URL for:', originalUrl);
      
      // Send immediate acknowledgment to client that request is being processed
      socket.emit('processing_url', { originalUrl });
      
      const url = await createShortUrl(originalUrl);
      
      if (!url) {
        throw new Error('Failed to create short URL');
      }
      
      console.log('Created short URL:', url);
      
      // Always emit the url_created event to the requesting client
      socket.emit('url_created', url);
      
      // Only broadcast to other clients if it's a new URL
      if (!url.isExisting) {
        console.log('Broadcasting url_created event to other clients');
        socket.broadcast.emit('url_created', url);
      } else {
        console.log('URL already exists, not broadcasting to other clients');
      }
    } catch (error) {
      console.error('Error in new_url event:', error);
      socket.emit('error', { message: error.message || 'Failed to create short URL' });
    }
  });

  // Listen for URL deletion
  socket.on('delete_url', async (data) => {
    try {
      const { id } = data;
      
      if (!id) {
        socket.emit('error', { message: 'URL ID is required' });
        return;
      }
      
      if (!isMongoConnected) {
        socket.emit('error', { message: 'Database not connected' });
        return;
      }
      
      // Delete from MongoDB
      const deletedUrl = await Url.findByIdAndDelete(id);
      
      if (!deletedUrl) {
        socket.emit('error', { message: 'URL not found' });
        return;
      }
      
      // Remove from cache if present
      for (const [key, value] of urlCache.entries()) {
        if (value._id.toString() === id) {
          urlCache.delete(key);
          break;
        }
      }
      
      // Remove from redirect cache
      redirectCache.delete(deletedUrl.urlCode);
      
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

    // Check if URL already exists in MongoDB
    console.log('Checking if URL exists in database:', normalizedUrl);
    const existingUrl = await Url.findOne({ originalUrl: normalizedUrl }).lean();
    
    if (existingUrl) {
      console.log('URL found in database:', existingUrl._id);
      // Add to cache for future requests
      urlCache.set(normalizedUrl, existingUrl);
      // Add isExisting flag to indicate this URL already exists
      return { ...existingUrl, isExisting: true };
    }
    
    // Generate a unique short code
    let urlCode;
    let attempts = 0;
    do {
      urlCode = shortid.generate();
      const codeExists = await Url.findOne({ urlCode });
      if (!codeExists) break;
      attempts++;
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new Error('Could not generate unique URL code');
    }
    
    const shortUrl = `http://localhost:3002/${urlCode}`;
    console.log('Generated new short URL:', shortUrl, 'for original URL:', normalizedUrl);
    
    // Create new URL in MongoDB
    const newUrl = new Url({
      originalUrl: normalizedUrl,
      shortUrl,
      urlCode,
      clicks: 0
    });
    
    const savedUrl = await newUrl.save();
    console.log('New URL saved to MongoDB with ID:', savedUrl._id);
    
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
    // Check if MongoDB is connected
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
    
    if (!isMongoConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Validate URL format
    let testUrl = url;
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = 'https://' + testUrl;
    }
    
    try {
      new URL(testUrl);
    } catch (err) {
      console.error('/api/shorten: Invalid URL:', url);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('/api/shorten: Creating short URL for:', url);
    const shortUrl = await createShortUrl(url);
    
    if (!shortUrl) {
      console.error('/api/shorten: Failed to create short URL');
      throw new Error('Failed to create short URL');
    }
    
    console.log('/api/shorten: Short URL created:', shortUrl);
    
    // Remove isExisting flag before sending response
    const { isExisting, ...urlData } = shortUrl;
    
    console.log('/api/shorten: URL saved to MongoDB with ID:', shortUrl._id);
    res.json(urlData);
  } catch (error) {
    console.error('Error in /api/shorten:', error);
    res.status(500).json({ error: error.message || 'Failed to create short URL' });
  }
});

// Get all URLs
app.get('/api/urls', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const urls = await Url.find().sort({ createdAt: -1 }).lean();
    res.json(urls || []);
  } catch (error) {
    console.error('Error in /api/urls:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Delete a URL
app.delete('/api/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isMongoConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const deletedUrl = await Url.findByIdAndDelete(id);
    
    if (!deletedUrl) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    // Remove from cache if present
    for (const [key, value] of urlCache.entries()) {
      if (value._id.toString() === id) {
        urlCache.delete(key);
        break;
      }
    }
    
    // Remove from redirect cache if present
    redirectCache.delete(deletedUrl.urlCode);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/urls/:id:', error);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
});

// Redirect to original URL
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!isMongoConnected) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    // Check cache first for better performance
    let url;
    if (redirectCache.has(code)) {
      url = redirectCache.get(code);
      console.log('Redirect URL found in cache');
    } else {
      // Find URL in MongoDB
      url = await Url.findOne({ urlCode: code });
      
      if (url) {
        // Add to cache for future requests
        redirectCache.set(code, url);
      }
    }
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Increment click count
    url.clicks += 1;
    
    // Update cache with new click count
    redirectCache.set(code, url);
    
    // Save to MongoDB
    await url.save();
    
    // Emit click event to all connected clients
    io.emit('url_clicked', { id: url._id, clicks: url.clicks });
    
    // Redirect to original URL
    res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error in /:code redirect:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket handlers will be set up after MongoDB connection in connectWithRetry()

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB connection configured`);
  console.log(`API is available at http://localhost:${PORT}`);
  console.log(`Frontend should connect to http://localhost:${PORT}`);
});