// ================================================
// MAIN APPLICATION INITIALIZATION
// ================================================

// Global application state
const App = {
  version: '1.0.0',
  initialized: false,
  modules: {}
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Citizen Safety Platform v' + App.version);
  console.log('📅 Starting initialization...');
  
  initializeApp();
});

// Main initialization function
async function initializeApp() {
  try {
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
      showCompatibilityError();
      return;
    }

    console.log('✓ Browser compatible');

    // Initialize Storage
    if (typeof Storage !== 'undefined') {
      Storage.initialize();
      App.modules.storage = Storage;
      console.log('✓ Storage initialized');
    } else {
      console.warn('⚠️ Storage module not loaded');
    }

    // Initialize Profile Manager
    if (typeof ProfileManager !== 'undefined') {
      ProfileManager.initialize();
      App.modules.profileManager = ProfileManager;
      console.log('✓ Profile Manager initialized');
    } else {
      console.warn('⚠️ Profile Manager not loaded');
    }

    // Initialize Admin (if available)
    if (typeof Admin !== 'undefined' && Admin.init) {
      Admin.init();
      App.modules.admin = Admin;
      console.log('✓ Admin module initialized');
    }

    // Initialize Geolocation
    if (typeof Geolocation !== 'undefined') {
      App.modules.geolocation = Geolocation;
      console.log('✓ Geolocation module ready');
    }

    // Initialize Media
    if (typeof Media !== 'undefined') {
      App.modules.media = Media;
      console.log('✓ Media module ready');
    }

    // Initialize Report Modules
    if (typeof PoliceReport !== 'undefined') {
      App.modules.policeReport = PoliceReport;
      console.log('✓ Police reporting ready');
    }

    if (typeof MedicalReport !== 'undefined') {
      App.modules.medicalReport = MedicalReport;
      console.log('✓ Medical reporting ready');
    }

    if (typeof InfrastructureReport !== 'undefined') {
      App.modules.infrastructureReport = InfrastructureReport;
      console.log('✓ Infrastructure reporting ready');
    }

    // Initialize AI Analytics (if available)
    if (typeof AIAnalytics !== 'undefined') {
      App.modules.aiAnalytics = AIAnalytics;
      console.log('✓ AI Analytics ready');
    }

    // Initialize Heatmap (if available)
    if (typeof Heatmap !== 'undefined') {
      App.modules.heatmap = Heatmap;
      console.log('✓ Heatmap module ready');
    }

    // Initialize Notifications (if available)
    if (typeof Notifications !== 'undefined' && Notifications.init) {
      Notifications.init();
      App.modules.notifications = Notifications;
      console.log('✓ Notifications initialized');
    }

    // Initialize Voice (if available)
    if (typeof VoiceCommands !== 'undefined' && VoiceCommands.init) {
      VoiceCommands.init();
      App.modules.voice = VoiceCommands;
      console.log('✓ Voice commands ready');
    }

    // Initialize Resources (if available)
    if (typeof Resources !== 'undefined' && Resources.init) {
      Resources.init();
      App.modules.resources = Resources;
      console.log('✓ Resources module ready');
    }

    // Mark as initialized
    App.initialized = true;

    console.log('✅ Application initialized successfully');
    console.log('📊 Loaded modules:', Object.keys(App.modules).length);

    // Show success notification
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast('Platform ready', 'success');
    }

    // Run post-initialization tasks
    postInitialization();

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    showInitializationError(error);
  }
}

// Post-initialization tasks
function postInitialization() {
  try {
    // Check for service worker support (PWA)
    if ('serviceWorker' in navigator) {
      console.log('✓ Service Worker supported');
      // Uncomment to enable PWA
      // registerServiceWorker();
    }

    // Request notification permission (if needed)
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('📬 Notification permission not set');
    }

    // Check for geolocation permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        console.log('📍 Geolocation permission:', result.state);
      });
    }

    // Check for camera permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then(result => {
        console.log('📸 Camera permission:', result.state);
      });
    }

    // Log application state
    console.log('📦 Application State:', App);

  } catch (error) {
    console.warn('Post-initialization warning:', error);
  }
}

// Check browser compatibility
function checkBrowserCompatibility() {
  const required = {
    localStorage: typeof(Storage) !== 'undefined',
    fetch: typeof(fetch) !== 'undefined',
    promises: typeof(Promise) !== 'undefined',
    asyncAwait: true // ES2017+
  };

  const missing = [];
  for (const [feature, supported] of Object.entries(required)) {
    if (!supported) {
      missing.push(feature);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing features:', missing);
    return false;
  }

  return true;
}

// Show compatibility error
function showCompatibilityError() {
  const message = `
    <div style="text-align: center; padding: 40px; max-width: 500px; margin: 100px auto;">
      <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
      <h2 style="margin-bottom: 16px;">Browser Not Supported</h2>
      <p style="color: #64748b; margin-bottom: 24px;">
        Your browser doesn't support features required by this application.
        Please use a modern browser like Chrome, Firefox, Safari, or Edge.
      </p>
      <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
        <p style="color: #ef4444; font-size: 0.875rem;">
          <strong>Required:</strong> Modern browser (2020+)
        </p>
      </div>
    </div>
  `;

  document.body.innerHTML = message;
}

// Show initialization error
function showInitializationError(error) {
  const message = `
    <div style="text-align: center; padding: 40px; max-width: 500px; margin: 100px auto;">
      <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
      <h2 style="margin-bottom: 16px;">Initialization Failed</h2>
      <p style="color: #64748b; margin-bottom: 24px;">
        The application failed to start properly. Please refresh the page.
      </p>
      <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #ef4444; font-size: 0.875rem; font-family: monospace;">
          ${error.message || 'Unknown error'}
        </p>
      </div>
      <button onclick="location.reload()" style="padding: 12px 32px; background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 1rem;">
        🔄 Reload Page
      </button>
    </div>
  `;

  document.body.innerHTML = message;
}

// Register service worker (PWA support)
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('✓ Service Worker registered:', registration.scope);
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Don't show error toast for script load failures
  if (event.message && event.message.includes('Failed to fetch')) {
    return;
  }

  if (typeof Utils !== 'undefined' && Utils.showToast) {
    Utils.showToast('An error occurred. Please try again.', 'error');
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (typeof Utils !== 'undefined' && Utils.showToast) {
    Utils.showToast('An error occurred. Please try again.', 'error');
  }
});

// Make App available globally
window.App = App;

console.log('✅ Main.js loaded');
