// ================================================
// NOTIFICATIONS.JS - FIXED VERSION
// Advanced notification system with sound & badges
// ================================================

console.log('✅ Notifications module loading...');

const Notifications = {
  container: null,
  notifications: [],
  settings: {
    enabled: true,
    sound: true,
    position: 'top-right',
    duration: 5000
  },

  // ==========================================
  // INITIALIZE (FIXED)
  // ==========================================
  
  init() {
    console.log('🔧 Initializing notifications...');

    // Create notification container
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }

    // Load settings
    this.loadSettings();

    console.log('✅ Notifications initialized');
  },

  // ==========================================
  // SHOW NOTIFICATION (FIXED)
  // ==========================================
  
  show(options) {
    // Initialize if not already done
    if (!this.container) {
      this.init();
    }

    const config = {
      title: options.title || 'Notification',
      message: options.message || '',
      type: options.type || 'info', // info, success, warning, error
      icon: options.icon || this.getDefaultIcon(options.type),
      duration: options.duration !== undefined ? options.duration : this.settings.duration,
      dismissible: options.dismissible !== false,
      onClick: options.onClick || null,
      actions: options.actions || []
    };

    // Create notification element
    const notification = this.createNotification(config);

    // Add to container
    this.container.appendChild(notification);

    // Store reference
    this.notifications.push({
      element: notification,
      config: config,
      timestamp: Date.now()
    });

    // Play sound if enabled
    if (this.settings.sound && config.type !== 'info') {
      this.playSound(config.type);
    }

    // Auto dismiss
    if (config.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification);
      }, config.duration);
    }

    // Request browser notification permission if available
    if (options.browser && 'Notification' in window) {
      this.showBrowserNotification(config);
    }

    return notification;
  },

  // ==========================================
  // CREATE NOTIFICATION ELEMENT (FIXED)
  // ==========================================
  
  createNotification(config) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${config.type}`;
    
    const colors = {
      info: { bg: '#3b82f6', border: '#2563eb' },
      success: { bg: '#22c55e', border: '#16a34a' },
      warning: { bg: '#f59e0b', border: '#d97706' },
      error: { bg: '#ef4444', border: '#dc2626' }
    };

    const color = colors[config.type] || colors.info;

    notification.style.cssText = `
      background: linear-gradient(135deg, ${color.bg}, ${color.border});
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      min-width: 320px;
      max-width: 400px;
      color: white;
      font-family: 'Inter', sans-serif;
      pointer-events: all;
      animation: notificationSlideIn 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    // Progress bar
    if (config.duration > 0) {
      const progress = document.createElement('div');
      progress.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        width: 100%;
        animation: notificationProgress ${config.duration}ms linear;
      `;
      notification.appendChild(progress);
    }

    // Content wrapper
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 14px;
    `;

    // Icon
    if (config.icon) {
      const icon = document.createElement('div');
      icon.style.cssText = `
        font-size: 2rem;
        flex-shrink: 0;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
      `;
      icon.textContent = config.icon;
      content.appendChild(icon);
    }

    // Text container
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1; min-width: 0;';

    // Title
    if (config.title) {
      const title = document.createElement('div');
      title.style.cssText = `
        font-size: 1rem;
        font-weight: 700;
        margin-bottom: 4px;
        color: white;
      `;
      title.textContent = config.title;
      textContainer.appendChild(title);
    }

    // Message
    if (config.message) {
      const message = document.createElement('div');
      message.style.cssText = `
        font-size: 0.9rem;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.9);
      `;
      message.textContent = config.message;
      textContainer.appendChild(message);
    }

    content.appendChild(textContainer);

    // Close button
    if (config.dismissible) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.5rem;
        color: white;
        transition: all 0.2s;
        line-height: 1;
        padding: 0;
      `;

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(notification);
      });

      notification.appendChild(closeBtn);
    }

    notification.appendChild(content);

    // Click handler
    if (config.onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', () => {
        config.onClick();
        this.dismiss(notification);
      });
    }

    // Actions
    if (config.actions && config.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-top: 12px;
        padding-left: ${config.icon ? '62px' : '0'};
      `;

      config.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.textContent = action.label;
        btn.style.cssText = `
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        `;

        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(255, 255, 255, 0.3)';
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'rgba(255, 255, 255, 0.2)';
        });

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (action.onClick) {
            action.onClick();
          }
          this.dismiss(notification);
        });

        actionsContainer.appendChild(btn);
      });

      notification.appendChild(actionsContainer);
    }

    return notification;
  },

  // ==========================================
  // DISMISS NOTIFICATION (FIXED)
  // ==========================================
  
  dismiss(notification) {
    if (!notification || !notification.parentNode) {
      return;
    }

    notification.style.animation = 'notificationSlideOut 0.3s ease';

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      // Remove from notifications array
      this.notifications = this.notifications.filter(n => n.element !== notification);
    }, 300);
  },

  // ==========================================
  // SHORTCUT METHODS
  // ==========================================
  
  info(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'info',
      ...options
    });
  },

  success(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'success',
      ...options
    });
  },

  warning(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'warning',
      ...options
    });
  },

  error(title, message, options = {}) {
    return this.show({
      title,
      message,
      type: 'error',
      ...options
    });
  },

  // ==========================================
  // DEFAULT ICONS
  // ==========================================
  
  getDefaultIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  },

  // ==========================================
  // SOUND EFFECTS
  // ==========================================
  
  playSound(type) {
    if (!this.settings.sound) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different types
      const frequencies = {
        success: 800,
        warning: 600,
        error: 400
      };

      oscillator.frequency.value = frequencies[type] || 700;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  },

  // ==========================================
  // BROWSER NOTIFICATIONS
  // ==========================================
  
  async showBrowserNotification(config) {
    if (!('Notification' in window)) {
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      try {
        new Notification(config.title, {
          body: config.message,
          icon: '/icon.png', // Add your app icon path
          badge: '/badge.png' // Add your badge icon path
        });
      } catch (error) {
        console.warn('Browser notification failed:', error);
      }
    }
  },

  // ==========================================
  // SETTINGS
  // ==========================================
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Could not load notification settings:', error);
    }
  },

  saveSettings() {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Could not save notification settings:', error);
    }
  },

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  },

  // ==========================================
  // CLEAR ALL
  // ==========================================
  
  clearAll() {
    this.notifications.forEach(n => {
      this.dismiss(n.element);
    });
    this.notifications = [];
  }
};

// ==========================================
// ADD CSS ANIMATIONS
// ==========================================

if (!document.getElementById('notification-animations')) {
  const style = document.createElement('style');
  style.id = 'notification-animations';
  style.textContent = `
    @keyframes notificationSlideIn {
      from {
        transform: translateX(120%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes notificationSlideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(120%);
        opacity: 0;
      }
    }

    @keyframes notificationProgress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    @media (max-width: 768px) {
      #notification-container {
        top: 10px !important;
        right: 10px !important;
        left: 10px !important;
        max-width: none !important;
      }

      .notification {
        min-width: auto !important;
        max-width: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
  });
} else {
  Notifications.init();
}

console.log('✅ Notifications module loaded successfully');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Notifications;
}
