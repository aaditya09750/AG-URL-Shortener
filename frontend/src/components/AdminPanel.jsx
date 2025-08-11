import { useState } from 'react';
import { BarChart3, Users, Link, TrendingUp, X, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import styles from './AdminPanel.module.css';

const AdminPanel = () => {
  const { showAdmin, setShowAdmin, shortenedUrls, deleteShortenedUrl } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  if (!showAdmin) return null;

  const totalUrls = shortenedUrls.length;
  const totalClicks = shortenedUrls.reduce((sum, url) => sum + url.clicks, 0);
  const avgClicks = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'urls', label: 'URLs', icon: Link },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateUrl = (url, maxLength = 50) => {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Admin Panel</h2>
          <button
            onClick={() => setShowAdmin(false)}
            className={styles.closeBtn}
            aria-label="Close admin panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Link size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{totalUrls}</h3>
                    <p className={styles.statLabel}>Total URLs</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Eye size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{totalClicks}</h3>
                    <p className={styles.statLabel}>Total Clicks</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <TrendingUp size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{avgClicks}</h3>
                    <p className={styles.statLabel}>Avg Clicks</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Users size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>1,234</h3>
                    <p className={styles.statLabel}>Active Users</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'urls' && (
            <div className={styles.urlsTab}>
              {shortenedUrls.length === 0 ? (
                <div className={styles.emptyState}>
                  <Link size={48} />
                  <h3>No URLs yet</h3>
                  <p>Shortened URLs will appear here</p>
                </div>
              ) : (
                <div className={styles.urlTable}>
                  <div className={styles.tableHeader}>
                    <span>Original URL</span>
                    <span>Short URL</span>
                    <span>Clicks</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>
                  {shortenedUrls.map((url, index) => (
                    <div key={url._id || `admin-url-${index}-${url.urlCode || url.shortUrl}`} className={styles.tableRow}>
                      <span className={styles.originalUrl} title={url.originalUrl}>
                        {truncateUrl(url.originalUrl)}
                      </span>
                      <span className={styles.shortUrl}>{url.shortUrl}</span>
                      <span className={styles.clicks}>{url.clicks}</span>
                      <span className={styles.date}>{formatDate(url.createdAt)}</span>
                      <button
                        onClick={() => deleteShortenedUrl(url._id)}
                        className={styles.deleteBtn}
                        title="Delete URL"
                        disabled={!url._id}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className={styles.analytics}>
              <div className={styles.chartPlaceholder}>
                <BarChart3 size={48} />
                <h3>Analytics Dashboard</h3>
                <p>Detailed analytics and charts would be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;