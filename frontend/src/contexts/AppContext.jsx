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
  const [connectionError, setConnectionError] = useState(null);

  // Get API URL with fallback
  const getApiUrl = () => {
    // Try to get from environment variable
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    
    // Fallback to local development URL
    console.warn('VITE_API_URL environment variable not set, using local development URL');
    return 'http://localhost:3002';
  };
  
  // Helper function to check if the API is available
  const checkApiHealth = async () => {
    try {
      const apiUrl = getApiUrl();
      // Use a GET request to check if the API is responding (using /api/urls instead of /api/health)
      const response = await axios.get(`${apiUrl}/api/urls`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('API health check successful');
        return true;
      }
      console.warn('API health check failed with status:', response.status);
      return false;
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  };
  
  // Fetch URLs from API on initial load
  useEffect(() => {
    const fetchUrls = async () => {
      try {
        setIsLoading(true);
        
        // First check if the API is available
        const isApiHealthy = await checkApiHealth();
        if (!isApiHealthy) {
          console.warn('API health check failed, using cached data');
          setConnectionError('The server is currently unavailable. Using cached data.');
          loadFromLocalStorage();
          return;
        }
        
        // If API is healthy, proceed with fetching URLs
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/api/urls`);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Fetched ${response.data.length} URLs from server:`, response.data);
          // Store URLs in localStorage for fallback persistence
          localStorage.setItem('shortenedUrls', JSON.stringify(response.data));
          setShortenedUrls(response.data);
          // Clear any previous connection errors
          if (connectionError) clearConnectionError();
        } else {
          console.error('Invalid data format received from API');
          // Try to load from localStorage if API returns invalid data
          loadFromLocalStorage();
          setConnectionError('Received invalid data from the server. Using cached data.');
        }
      } catch (error) {
        console.error('Error fetching URLs:', error);
        // Display more detailed error information
        const errorMessage = error.response ? 
          `Server error: ${error.response.status} ${error.response.statusText}` : 
          error.message || 'Network error';
        console.warn(`API connection failed: ${errorMessage}. Using cached data.`);
        // Set connection error state for UI notification
        setConnectionError(`Unable to connect to the server. Using cached data. (${errorMessage})`);
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
  }, []); // Empty dependency array to ensure this only runs once

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      // First check if the API is available
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        console.warn('API health check failed, skipping socket connection');
        setConnectionError('The server is currently unavailable. Real-time updates disabled.');
        return;
      }
      
      const apiUrl = getApiUrl();
      console.log(`Initializing socket connection to ${apiUrl}`);
      const newSocket = io(apiUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000, // Increased timeout
        autoConnect: true,
        transports: ['websocket', 'polling'] // Try both transport methods
      });
      setSocket(newSocket);
    };
    
    // Only initialize socket if it doesn't exist yet
    if (!socket) {
      initializeSocket();
    }

    // Socket event handlers will be set up when socket is created
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket.id);
        // Request latest URLs from server upon successful connection
        socket.emit('get_urls');
        console.log('Requested URLs from server after connection');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        const apiUrl = getApiUrl();
        console.warn(`Failed to connect to Socket.IO server at ${apiUrl}. Using cached data.`);
        // Display a more user-friendly message in the console
        console.info('The application will continue to work with cached data and REST API fallback.');
        // Set connection error state for UI notification
        setConnectionError(`Real-time updates unavailable. Using cached data. (${error.message})`);
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

      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts with ID:`, socket.id);
        // Request latest URLs from server upon reconnection
        socket.emit('get_urls');
        console.log('Requested URLs from server after reconnection');
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // The disconnection was initiated by the server, try to reconnect
          console.log('Server initiated disconnect, attempting to reconnect...');
          socket.connect();
        }
      });

      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection');
        socket.disconnect();
      };
    }
    
    // Return empty cleanup function if no socket
    return () => {};
  }, []); // Empty dependency array to ensure this only runs once

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
        }).map(url => {
          // Fix shortUrl domain if it's using localhost
          if (url.shortUrl && url.shortUrl.includes('localhost')) {
            const apiUrl = getApiUrl();
            const renderDomain = apiUrl.replace(/\/api.*$|\/+$/, '');
            const fixedUrl = url.shortUrl.replace(/http:\/\/localhost:[0-9]+/, renderDomain);
            console.log(`Fixed URL domain: ${url.shortUrl} -> ${fixedUrl}`);
            return { ...url, shortUrl: fixedUrl };
          }
          return url;
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
      
      // Fix shortUrl domain if it's using localhost
      if (newUrl.shortUrl && newUrl.shortUrl.includes('localhost')) {
        const apiUrl = getApiUrl();
        const renderDomain = apiUrl.replace(/\/api.*$|\/+$/, '');
        newUrl.shortUrl = newUrl.shortUrl.replace(/http:\/\/localhost:[0-9]+/, renderDomain);
        console.log(`Fixed new URL domain: ${newUrl.shortUrl}`);
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
      
      // Check if API is healthy before proceeding
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        setConnectionError('The server is currently unavailable. Unable to shorten URL.');
        setIsLoading(false);
        return { success: false, error: 'Server unavailable' };
      }
      
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
          const apiUrl = getApiUrl();
          const response = await axios.post(`${apiUrl}/api/shorten`, { originalUrl: processedUrl });
          
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
          
          // Fix shortUrl domain if it's using localhost
          if (newUrl.shortUrl && newUrl.shortUrl.includes('localhost')) {
            const apiUrl = getApiUrl();
            const renderDomain = apiUrl.replace(/\/api.*$|\/+$/, '');
            newUrl.shortUrl = newUrl.shortUrl.replace(/http:\/\/localhost:[0-9]+/, renderDomain);
            console.log(`Fixed REST API URL domain: ${newUrl.shortUrl}`);
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
      // Check if API is healthy before proceeding
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        setConnectionError('The server is currently unavailable. Unable to delete URL.');
        return { success: false, error: 'Server unavailable' };
      }
      
      // Use socket if available
      if (socket && socket.connected) {
        socket.emit('delete_url', { id });
        // Socket will handle the state update via the url_deleted event
      } else {
        // Fallback to REST API
        const apiUrl = getApiUrl();
        await axios.delete(`${apiUrl}/api/urls/${id}`);
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

  // Function to clear connection error
  const clearConnectionError = () => setConnectionError(null);

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
      socket,
      connectionError,
      clearConnectionError,
      getApiUrl
    }}>
      {children}
    </AppContext.Provider>
  );
};