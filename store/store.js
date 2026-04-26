import { storeApps } from './apps.js';

class Store {
  constructor(container, options = {}) {
    this.container = container;
    this.installedApps = options.installedApps || [];
    this.onInstall = options.onInstall || (() => {});
    this.onUninstall = options.onUninstall || (() => {});

    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.selectedApp = null;

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  getCategories() {
    const cats = new Set(storeApps.map(app => app.category));
    return ['All', ...Array.from(cats)];
  }

  getFilteredApps() {
    return storeApps.filter(app => {
      const matchesSearch =
        app.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory =
        this.selectedCategory === 'All' || app.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="store-container">
        <div class="store-header">
          <h1 class="store-title">Store</h1>
          <div class="store-search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search apps..."
              value="${this.searchQuery}"
              class="search-input"
              id="store-search-input"
            />
            ${this.searchQuery ? `<button class="search-clear" id="search-clear">×</button>` : ''}
          </div>
        </div>

        <div class="store-categories" id="store-categories">
          ${this.getCategories().map(cat => `
            <button
              class="category-pill ${this.selectedCategory === cat ? 'active' : ''}"
              data-category="${cat}"
            >${cat}</button>
          `).join('')}
        </div>

        <div class="store-grid" id="store-grid">
          ${this.renderAppGrid()}
        </div>

        ${this.getFilteredApps().length === 0 ? `
          <div class="store-empty">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 8l6 6M14 8l-6 6" />
            </svg>
            <p>No apps found</p>
            <span>Try a different search or category</span>
          </div>
        ` : ''}
      </div>
      <div id="store-modal-container"></div>
    `;

    this.attachEvents();
  }

  renderAppGrid() {
    const apps = this.getFilteredApps();
    return apps.map(app => {
      const isInstalled = this.installedApps.includes(app.id);
      return `
        <div
          class="app-card ${isInstalled ? 'installed' : ''}"
          data-app-id="${app.id}"
        >
          <div class="app-card-icon-wrapper">
            <img src="${app.icon}" alt="${app.name}" class="app-card-icon" />
            ${isInstalled ? `
              <div class="installed-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ` : ''}
          </div>
          <div class="app-card-info">
            <h3 class="app-card-name">${app.name}</h3>
            <p class="app-card-category">${app.category}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  renderModal() {
    const modalContainer = document.getElementById('store-modal-container');
    if (!this.selectedApp) {
      modalContainer.innerHTML = '';
      return;
    }

    const app = storeApps.find(a => a.id === this.selectedApp);
    if (!app) return;

    const isInstalled = this.installedApps.includes(app.id);

    modalContainer.innerHTML = `
      <div class="store-modal-overlay" id="modal-overlay">
        <div class="store-modal">
          <button class="modal-close" id="modal-close">×</button>
          <div class="modal-header">
            <img src="${app.icon}" alt="${app.name}" class="modal-icon" />
            <div class="modal-header-info">
              <h2>${app.name}</h2>
              <p class="modal-meta">${app.category} • ${app.author} • v${app.version}</p>
            </div>
          </div>
          <p class="modal-description">${app.description}</p>
          <div class="modal-actions">
            ${isInstalled ? `
              <button class="btn btn-open" id="modal-open">Open</button>
              <button class="btn btn-uninstall" id="modal-uninstall">Uninstall</button>
            ` : `
              <button class="btn btn-install" id="modal-install">Install</button>
            `}
          </div>
        </div>
      </div>
    `;

    // Modal events
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') {
        this.selectedApp = null;
        this.renderModal();
      }
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      this.selectedApp = null;
      this.renderModal();
    });

    if (document.getElementById('modal-install')) {
      document.getElementById('modal-install').addEventListener('click', () => {
        this.onInstall(app.id, app.file, app.name, app.icon);
        this.installedApps.push(app.id);
        this.render();
        this.selectedApp = null;
        this.renderModal();
      });
    }

    if (document.getElementById('modal-open')) {
      document.getElementById('modal-open').addEventListener('click', () => {
        this.selectedApp = null;
        this.renderModal();
        // Open the app - your WebOS handles this
      });
    }

    if (document.getElementById('modal-uninstall')) {
      document.getElementById('modal-uninstall').addEventListener('click', () => {
        this.onUninstall(app.id);
        this.installedApps = this.installedApps.filter(id => id !== app.id);
        this.render();
        this.selectedApp = null;
        this.renderModal();
      });
    }
  }

  attachEvents() {
    // Search input
    const searchInput = document.getElementById('store-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // Clear search
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Category pills
    document.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.category;
        this.render();
      });
    });

    // App cards
    document.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedApp = card.dataset.appId;
        this.renderModal();
      });
    });
  }
}

// Initialize
const app = document.getElementById('app');
if (app) {
  window.store = new Store(app, {
    installedApps: [], // your WebOS passes installed app IDs here
    onInstall: (id, file, name, icon) => {
      console.log('Install:', { id, file, name, icon });
      // Your WebOS adds the app here
    },
    onUninstall: (id) => {
      console.log('Uninstall:', id);
      // Your WebOS removes the app here
    },
  });
}

export default Store;
