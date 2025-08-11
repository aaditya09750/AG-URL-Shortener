import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch URLs from API on initial load
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setIsLoading(true);
        // Always fetch from the server first to ensure we have the latest data from MongoDB
        const response = await axios.get('http://localhost:3002/api/urls');
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Fetched ${response.data.length} URLs from server:`, response.data);
          // Store URLs in localStorage for fallback persistence
          localStorage.setItem('shortenedUrls', JSON.stringify(response.data));
          setShortenedUrls(response.data);
        } else {
          console.error('Invalid data format received from API');
          // Try to load from localStorage if API returns invalid data
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error fetching URLs:', error);
        // Try to load from localStorage if API fails
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    const loadFromLocalStorage = () => {
      const cachedUrls = localStorage.getItem('shortenedUrls');
      if (cachedUrls) {
        try {
          const parsedUrls = JSON.parse(cachedUrls);
          if (Array.isArray(parsedUrls)) {
            setShortenedUrls(parsedUrls);
          }
        } catch (e) {
          console.error('Error parsing cached URLs:', e);
        }
      }
    };
    
    // Try to load from localStorage first for immediate display
    loadFromLocalStorage();
    
    // Then fetch from API to get the latest data
    fetchUrls();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection to http://localhost:3002');
    const newSocket = io('http://localhost:3002', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully with ID:', newSocket.id);
      // Request latest URLs from server upon successful connection
      newSocket.emit('get_urls');
      console.log('Requested URLs from server after connection');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      // Try to load from localStorage if socket connection fails
      const cachedUrls = localStorage.getItem('shortenedUrls');
      if (cachedUrls) {
        try {
          const parsedUrls = JSON.parse(cachedUrls);
          if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
            console.log('Loading URLs from localStorage after connection error');
            setShortenedUrls(parsedUrls);
          }
        } catch (e) {
          console.error('Error parsing cached URLs:', e);
        }
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts with ID:`, newSocket.id);
      // Request latest URLs from server upon reconnection
      newSocket.emit('get_urls');
      console.log('Requested URLs from server after reconnection');
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, try to reconnect
        console.log('Server initiated disconnect, attempting to reconnect...');
        newSocket.connect();
      }
    });

    // Clean up on unmount
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for initial URLs
    socket.on('urls', (urls) => {
      console.log(`Received ${urls ? urls.length : 0} initial URLs from socket:`, urls);
      
      // Validate the data received
      if (!urls) {
        console.error('Received null or undefined URLs from server');
        return;
      }
      
      if (!Array.isArray(urls)) {
        console.error('Received non-array URLs data from server:', typeof urls);
        return;
      }
      
      if (urls.length > 0) {
        // Validate each URL object has required fields
        const validUrls = urls.filter(url => {
          if (!url || !url.urlCode || !url.originalUrl || !url.shortUrl) {
            console.warn('Filtered out invalid URL object:', url);
            return false;
          }
          return true;
        });
        
        console.log(`Filtered ${urls.length - validUrls.length} invalid URLs, keeping ${validUrls.length}`);
        
        setShortenedUrls(validUrls);
        // Update localStorage
        localStorage.setItem('shortenedUrls', JSON.stringify(validUrls));
      } else {
        console.log('Received empty URLs array from server');
      }
    });

    // Listen for new URL creation
    socket.on('url_created', (newUrl) => {
      console.log('Received new URL from socket:', newUrl);
      setIsLoading(false); // Stop loading indicator when we get a response
      
      if (!newUrl) {
        console.error('Received null or undefined URL data from server');
        return;
      }
      
      if (!newUrl.urlCode || !newUrl.originalUrl || !newUrl.shortUrl) {
        console.error('Received invalid URL data from server:', newUrl);
        return;
      }
      
      // Check if URL already exists to prevent duplicates
      setShortenedUrls(prev => {
        // Ensure prev is an array
        if (!Array.isArray(prev)) {
          console.error('Previous URLs state is not an array:', prev);
          return [newUrl]; // Reset with just the new URL
        }
        
        const exists = prev.some(url => 
          (url._id && newUrl._id && url._id === newUrl._id) || 
          (url.urlCode && newUrl.urlCode && url.urlCode === newUrl.urlCode) ||
          (url.originalUrl && newUrl.originalUrl && url.originalUrl === newUrl.originalUrl)
        );
        
        let updatedUrls;
        if (exists) {
          console.log('URL already exists in state, updating...');
          // Update existing URL
          updatedUrls = prev.map(url => {
            if ((url._id && newUrl._id && url._id === newUrl._id) ||
                (url.id && newUrl.id && url.id === newUrl.id) ||
                (url.urlCode && newUrl.urlCode && url.urlCode === newUrl.urlCode) ||
                (url.originalUrl && newUrl.originalUrl && url.originalUrl === newUrl.originalUrl)) {
              return { ...url, ...newUrl };
            }
            return url;
          });
        } else {
          console.log('Adding new URL to state:', newUrl.shortUrl);
          // Add new URL
          updatedUrls = [newUrl, ...prev];
        }
        
        // Update localStorage
        localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
        return updatedUrls;
      });
    });

    // Listen for URL deletion
    socket.on('url_deleted', ({ id }) => {
      setShortenedUrls(prev => {
        const updatedUrls = prev.filter(url => url._id !== id);
        // Update localStorage
        localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
        return updatedUrls;
      });
    });

    // Listen for URL click updates
    socket.on('url_clicked', ({ id, clicks }) => {
      setShortenedUrls(prev => {
        const updatedUrls = prev.map(url => url._id === id ? { ...url, clicks } : url);
        // Update localStorage
        localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
        return updatedUrls;
      });
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('urls');
      socket.off('url_created');
      socket.off('url_deleted');
      socket.off('url_clicked');
      socket.off('error');
    };
  }, [socket]);

  const addShortenedUrl = async (originalUrl, shortUrl) => {
    try {
      // Ensure URL has http:// or https:// prefix
      let processedUrl = originalUrl;
      if (!/^https?:\/\//i.test(processedUrl)) {
        processedUrl = 'https://' + processedUrl;
        console.log('Added https:// prefix to URL in addShortenedUrl:', processedUrl);
      }
      
      // Check if URL already exists in current state
      const urlExists = shortenedUrls.some(url => 
        url.originalUrl === processedUrl
      );
      
      if (urlExists) {
        console.log('URL already exists, showing existing URL');
        // No need to add it again, just notify user (handled by UI)
        return { success: false, error: 'URL already exists' };
      }
      
      setIsLoading(true);
      
      // Emit the new URL event to the server via socket if available
      if (socket && socket.connected) {
        console.log('Emitting new_url event via socket:', { originalUrl: processedUrl });
        socket.emit('new_url', { originalUrl: processedUrl });
        // Socket will handle the state update via the url_created event
        return { success: true, pending: true };
      } else {
        // Fallback to REST API if socket is not available
        console.log('Socket not available, using REST API fallback');
        try {
          console.log('Sending REST API request with:', { originalUrl: processedUrl });
          const response = await axios.post('http://localhost:3002/api/shorten', { originalUrl: processedUrl });
          
          if (!response.data) {
            console.error('No data received from server');
            throw new Error('No data received from server');
          }
          
          const newUrl = response.data;
          console.log('Received URL data from API:', newUrl);
          
          if (!newUrl.shortUrl || !newUrl.urlCode) {
            console.error('Invalid URL data received:', newUrl);
            throw new Error('Invalid URL data received from server');
          }
          
          // Add the new URL to the state
          setShortenedUrls(prev => {
            // Check if URL already exists by ID, code, or original URL
            const exists = prev.some(url => 
              (url._id && newUrl._id && url._id === newUrl._id) || 
              (url.urlCode && newUrl.urlCode && url.urlCode === newUrl.urlCode) ||
              (url.originalUrl === newUrl.originalUrl)
            );
            
            let updatedUrls;
            if (exists) {
              // Update existing URL with new data
              updatedUrls = prev.map(url => {
                if ((url._id && newUrl._id && url._id === newUrl._id) || 
                    (url.urlCode && newUrl.urlCode && url.urlCode === newUrl.urlCode) ||
                    (url.originalUrl === newUrl.originalUrl)) {
                  return { ...url, ...newUrl };
                }
                return url;
              });
              console.log('Updated existing URL in state');
            } else {
              // Add new URL to the beginning of the array
              updatedUrls = [newUrl, ...prev];
              console.log('Added new URL to state');
            }
            
            // Update localStorage
            localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
            return updatedUrls;
          });
          
          return { success: true };
        } catch (apiError) {
          console.error('REST API error in addShortenedUrl:', apiError);
          throw apiError;
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error adding shortened URL:', error);
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to save URL' };
    } finally {
      // Only set loading to false if we're not using sockets
      // (socket handler will set loading to false when it receives a response)
      if (!socket || !socket.connected) {
        setIsLoading(false);
      }
    }
  };

  const deleteShortenedUrl = async (id) => {
    try {
      // Use socket if available
      if (socket && socket.connected) {
        socket.emit('delete_url', { id });
        // Socket will handle the state update via the url_deleted event
      } else {
        // Fallback to REST API
        await axios.delete(`http://localhost:3002/api/urls/${id}`);
        // Update state locally
        setShortenedUrls(prev => {
          const updatedUrls = prev.filter(url => url._id !== id);
          // Update localStorage
          localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
          return updatedUrls;
        });
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting URL:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AppContext.Provider value={{
      shortenedUrls,
      setShortenedUrls,
      isLoading,
      showAdmin,
      setIsLoading,
      setShowAdmin,
      addShortenedUrl,
      deleteShortenedUrl,
      socket
    }}>
      {children}
    </AppContext.Provider>
  );
};