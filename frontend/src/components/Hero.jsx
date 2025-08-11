import { useState, useEffect } from 'react';
import { Link, Copy, Check, Zap, BarChart3, Shield, Globe } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import styles from './Hero.module.css';

const Hero = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { isLoading, setIsLoading, addShortenedUrl, socket, setShortenedUrls } = useApp();

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (socket) {
      // Listen for the url_created event
      const handleUrlCreated = (data) => {
        console.log('Received url_created in Hero component:', data);
        setShortenedUrls(prev => [...prev, data]);
        setIsLoading(false);
      };

      // Listen for processing acknowledgment
      const handleProcessingUrl = (data) => {
        console.log('URL is being processed:', data.originalUrl);
        // Keep loading state but update the processing message in the UI
        document.getElementById('processing-message')?.setAttribute('data-status', 'processing');
      };

      // Listen for errors
      const handleError = (error) => {
        console.error('Error from server:', error);
        setError(error.message || 'An error occurred while shortening the URL');
        setIsLoading(false);
      };

      socket.on('url_created', handleUrlCreated);
      socket.on('processing_url', handleProcessingUrl);
      socket.on('error', handleError);

      // Clean up the event listeners
      return () => {
        socket.off('url_created', handleUrlCreated);
        socket.off('processing_url', handleProcessingUrl);
        socket.off('error', handleError);
      };
    }
  }, [socket, setShortenedUrls]);
  
  // Add a safety timeout to reset loading state if server doesn't respond
  useEffect(() => {
    let timeoutId;
    
    if (isLoading) {
      // Check processing status when the timeout is created
      const processingStatus = document.getElementById('processing-message')?.getAttribute('data-status');
      // Use a shorter timeout for initial waiting state
      const timeoutDuration = processingStatus === 'processing' ? 30000 : 10000;
      
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setError('URL shortening is taking longer than expected. Please try again.');
      }, timeoutDuration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Ensure URL has http:// or https:// prefix
    let processedUrl = url.trim();
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'https://' + processedUrl;
      console.log('Added https:// prefix to URL:', processedUrl);
    }

    if (!validateUrl(processedUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    
    // Reset processing message status to waiting
    const processingMessage = document.getElementById('processing-message');
    if (processingMessage) {
      processingMessage.setAttribute('data-status', 'waiting');
    }

    try {
      if (socket && socket.connected) {
        // Use socket to emit the new URL event
        console.log('Emitting new_url event with:', { originalUrl: processedUrl });
        socket.emit('new_url', { originalUrl: processedUrl });
        setUrl('');
        // Note: setIsLoading(false) will be called when we receive the url_created event
      } else {
        console.log('Socket not connected, using REST API fallback');

        // Fallback to REST API if socket is not available
        try {
          console.log('Sending REST API request with:', { originalUrl: processedUrl });
          const response = await fetch('http://localhost:3002/api/shorten', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ originalUrl: processedUrl }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('REST API returned error:', errorData);
            throw new Error(errorData.error || 'Failed to shorten URL');
          }

          const data = await response.json();
          console.log('URL shortened via REST API:', data);
          
          if (!data || !data.shortUrl) {
            console.error('Invalid data received from API:', data);
            throw new Error('Invalid response from server');
          }
          
          // Use the context method to add the URL to state
          const result = await addShortenedUrl(processedUrl, data.shortUrl);
          if (!result.success) {
            console.error('Failed to save URL to state:', result.error);
            throw new Error(result.error || 'Failed to save shortened URL');
          }
          setUrl('');
        } catch (apiError) {
          console.error('REST API error:', apiError);
          throw apiError;
        } finally {
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred while shortening the URL');
      console.error('Error shortening URL:', err);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Shorten URLs instantly with our optimized infrastructure",
      stat: "< 100ms",
      color: "var(--accent-primary)"
    },
    {
      icon: Copy,
      title: "Easy to Copy",
      description: "One-click copy with smart link management",
      stat: "1 Click",
      color: "var(--accent-secondary)"
    },
    {
      icon: Check,
      title: "100% Reliable",
      description: "Enterprise-grade uptime with 99.9% availability",
      stat: "99.9%",
      color: "var(--success-color)"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track clicks, locations, and engagement metrics",
      stat: "Real-time",
      color: "var(--accent-tertiary)"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "SSL encryption and spam protection included",
      stat: "SSL",
      color: "#f59e0b"
    },
    {
      icon: Globe,
      title: "Global CDN",
      description: "Lightning-fast delivery worldwide",
      stat: "150+",
      color: "#8b5cf6"
    }
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              LINKS
              <span className={styles.accent}> ON DIET</span>
            </h1>
            <p className={styles.subtitle}>
            Make your links clear and bright to reach new heights with ease.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <Link className={styles.inputIcon} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your long URL here..."
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className={styles.spinner} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Shorten
                  </>
                )}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {isLoading && !error && <p id="processing-message" className={styles.processing} data-status="waiting">Your URL is being processed. This may take a moment...</p>}
          </form>

          <div className={styles.features}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className={styles.feature}
                  style={{ '--feature-color': feature.color }}
                >
                  <div className={styles.featureHeader}>
                    <div className={styles.featureIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.featureStat}>
                      {feature.stat}
                    </div>
                  </div>
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;