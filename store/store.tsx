import React, { useState, useMemo } from 'react';
import { storeApps } from './apps';
import './Store.css';

interface StoreProps {
  installedApps: string[];
  onInstall: (appId: string, file: string, name: string, icon: string) => void;
  onUninstall: (appId: string) => void;
}

const Store: React.FC<StoreProps> = ({ installedApps, onInstall, onUninstall }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(storeApps.map((app) => app.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredApps = useMemo(() => {
    return storeApps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleInstall = (app: typeof storeApps[0]) => {
    if (!installedApps.includes(app.id)) {
      onInstall(app.id, app.file, app.name, app.icon);
    }
  };

  const handleUninstall = (appId: string) => {
    onUninstall(appId);
    setSelectedApp(null);
  };

  const selectedAppData = storeApps.find((app) => app.id === selectedApp);

  return (
    <div className="store-container">
      {/* Header */}
      <div className="store-header">
        <h1 className="store-title">Store</h1>
        <div className="store-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="store-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div className="store-grid">
        {filteredApps.map((app) => {
          const isInstalled = installedApps.includes(app.id);
          return (
            <div
              key={app.id}
              className={`app-card ${isInstalled ? 'installed' : ''}`}
              onClick={() => setSelectedApp(app.id)}
            >
              <div className="app-card-icon-wrapper">
                <img src={app.icon} alt={app.name} className="app-card-icon" />
                {isInstalled && (
                  <div className="installed-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="app-card-info">
                <h3 className="app-card-name">{app.name}</h3>
                <p className="app-card-category">{app.category}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="store-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 8l6 6M14 8l-6 6" />
          </svg>
          <p>No apps found</p>
          <span>Try a different search or category</span>
        </div>
      )}

      {/* App Detail Modal */}
      {selectedAppData && (
        <div className="store-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedApp(null)}>
              ×
            </button>
            <div className="modal-header">
              <img
                src={selectedAppData.icon}
                alt={selectedAppData.name}
                className="modal-icon"
              />
              <div className="modal-header-info">
                <h2>{selectedAppData.name}</h2>
                <p className="modal-meta">
                  {selectedAppData.category} • {selectedAppData.author} • v{selectedAppData.version}
                </p>
              </div>
            </div>
            <p className="modal-description">{selectedAppData.description}</p>
            <div className="modal-actions">
              {installedApps.includes(selectedAppData.id) ? (
                <>
                  <button className="btn btn-open" onClick={() => setSelectedApp(null)}>
                    Open
                  </button>
                  <button
                    className="btn btn-uninstall"
                    onClick={() => handleUninstall(selectedAppData.id)}
                  >
                    Uninstall
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-install"
                  onClick={() => handleInstall(selectedAppData)}
                >
                  Install
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
