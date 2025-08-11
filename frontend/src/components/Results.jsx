import { useState } from 'react';
import { Copy, Check, ExternalLink, Trash2, BarChart3 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import styles from './Results.module.css';

const Results = () => {
  const { shortenedUrls, deleteShortenedUrl } = useApp();
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateUrl = (url, maxLength = 40) => {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  };

  if (shortenedUrls.length === 0) {
    return null;
  }

  return (
    <section className={styles.results}>
      <div className={styles.container}>
        <h2 className={styles.title}>Shortened Links</h2>
        <div className={styles.urlList}>
          {shortenedUrls.map((urlData, index) => (
            <div key={urlData._id || `url-${index}-${urlData.urlCode || urlData.shortUrl}`} className={styles.urlCard}>
              <div className={styles.urlInfo}>
                <div className={styles.urlRow}>
                  <span className={styles.label}>Original:</span>
                  <a
                    href={urlData.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.originalUrl}
                    title={urlData.originalUrl}
                  >
                    {truncateUrl(urlData.originalUrl)}
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className={styles.urlRow}>
                  <span className={styles.label}>Short:</span>
                  <div className={styles.shortUrlContainer}>
                    <a
                      href={urlData.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.shortUrl}
                    >
                      {urlData.shortUrl}
                    </a>
                    <button
                      onClick={() => copyToClipboard(urlData.shortUrl, urlData._id || `url-${index}-${urlData.urlCode || urlData.shortUrl}`)}
                      className={styles.copyBtn}
                      title="Copy to clipboard"
                    >
                      {copiedId === (urlData._id || urlData.id || index) ? (
                        <Check size={16} className={styles.checkIcon} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className={styles.urlMeta}>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <BarChart3 size={14} />
                    <span>{urlData.clicks} clicks</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.date}>
                      {formatDate(urlData.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteShortenedUrl(urlData._id || urlData.id || index)}
                  className={styles.deleteBtn}
                  title="Delete URL"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Results;