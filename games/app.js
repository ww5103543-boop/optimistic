Lumin.init({
      container: '#games',
      theme: 'dark'
    });

    setTimeout(() => {
      const gamesContainer = document.querySelector('#games');
      const gameCards = gamesContainer.querySelectorAll('[data-game], .game-card, .lumin-game');
      if (gameCards.length > 0) {
        document.getElementById('game-count').textContent = 'Browse and play ' + gameCards.length.toLocaleString() + ' games';
      }
      
      const style = document.createElement('style');
      style.textContent = `
        .lumin-container, .lumin-grid, .lumin-game-list {
          background: transparent !important;
        }
        .lumin-game {
          background: rgba(0, 0, 0, 0.35) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 16px !important;
          transition: all 0.2s ease !important;
        }
        .lumin-game:hover {
          background: rgba(0, 0, 0, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-2px);
        }
        .lumin-game-title, .lumin-game-name {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        .lumin-game-description {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .lumin-search input, .lumin-filter input {
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: white !important;
        }
        .lumin-search input::placeholder, .lumin-filter input::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
        }
      `;
      document.head.appendChild(style);
    }, 3000);
