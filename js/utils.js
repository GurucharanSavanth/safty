// ================================================
// UTILITIES MODULE - COMPLETE & FIXED
// ================================================

const Utils = {
  
  // Show toast notification
  showToast(message, type = 'info') {
    try {
      // Remove existing toasts
      const existing = document.querySelectorAll('.toast-notification');
      existing.forEach(t => t.remove());

      // Create toast
      const toast = document.createElement('div');
      toast.className = `toast-notification toast-${type}`;
      
      const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
      `;

      toast.innerHTML = `
        <span style="font-size: 1.5rem;">${icons[type]}</span>
        <span>${message}</span>
      `;

      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(toast);

      // Auto remove after 3 seconds
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3000);

      console.log(`Toast (${type}):`, message);
    } catch (error) {
      console.error('Show toast error:', error);
    }
  },

  // Show loading overlay
  showLoading(message = 'Loading...') {
    try {
      // Remove existing loading
      this.hideLoading();

      const overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
      `;

      overlay.innerHTML = `
        <div style="text-align: center; background: rgba(30, 41, 59, 0.9); padding: 40px; border-radius: 20px; border: 2px solid rgba(51, 65, 85, 0.5);">
          <div class="spinner" style="width: 50px; height: 50px; border: 4px solid rgba(59, 130, 246, 0.3); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
          <p style="color: #f1f5f9; font-weight: 600; font-size: 1.1rem;">${message}</p>
        </div>
      `;

      // Add spin animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(overlay);
    } catch (error) {
      console.error('Show loading error:', error);
    }
  },

  // Hide loading overlay
  hideLoading() {
    try {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.remove();
    } catch (error) {
      console.error('Hide loading error:', error);
    }
  },

  // Create dynamic modal
  createModal(title, content, buttons = []) {
    try {
      // Remove existing modal
      this.closeModal('dynamicModal');

      const modal = document.createElement('div');
      modal.id = 'dynamicModal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        overflow-y: auto;
      `;

      const panel = document.createElement('div');
      panel.className = 'modal-panel';
      panel.style.cssText = `
        background: #1e293b;
        border: 2px solid #334155;
        border-radius: 20px;
        padding: 32px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      `;

      panel.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 class="modal-title" style="font-size: 1.5rem; font-weight: 700; color: #f1f5f9;">${title}</h2>
          <button class="close-btn" style="background: rgba(239, 68, 68, 0.2); border: none; color: #ef4444; font-size: 1.5rem; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: all 0.3s;" onclick="Utils.closeModal('dynamicModal')">&times;</button>
        </div>
        <div class="modal-body" style="color: #cbd5e1; margin-bottom: 24px;">
          ${content}
        </div>
        <div class="modal-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${buttons.map(btn => `
            <button 
              class="btn btn-${btn.type || 'secondary'}" 
              onclick="${btn.action}"
              style="padding: 10px 20px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s; ${
                btn.type === 'primary' ? 'background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white;' :
                btn.type === 'danger' ? 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;' :
                'background: rgba(51, 65, 85, 0.8); color: #cbd5e1; border: 2px solid rgba(71, 85, 105, 0.5);'
              }"
            >
              ${btn.label}
            </button>
          `).join('')}
        </div>
      `;

      modal.appendChild(panel);
      document.body.appendChild(modal);

      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal('dynamicModal');
        }
      });

      return modal;
    } catch (error) {
      console.error('Create modal error:', error);
      return null;
    }
  },

  // Close modal
  closeModal(modalId) {
    try {
      const modal = document.getElementById(modalId);
      if (modal) modal.remove();
    } catch (error) {
      console.error('Close modal error:', error);
    }
  },

  // Format date
  formatDate(date) {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      
      return {
        full: d.toLocaleString(),
        date: d.toLocaleDateString(),
        time: d.toLocaleTimeString(),
        iso: d.toISOString()
      };
    } catch (error) {
      console.error('Format date error:', error);
      return { full: 'Error', date: 'Error', time: 'Error', iso: '' };
    }
  },

  // Generate unique ID
  generateId(prefix = 'ID') {
    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return `${prefix}-${timestamp}-${random}`;
    } catch (error) {
      console.error('Generate ID error:', error);
      return `${prefix}-${Date.now()}`;
    }
  },

  // Validate email
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Validate phone
  validatePhone(phone) {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  // Copy to clipboard
  copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('Copied to clipboard', 'success');
        });
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showToast('Copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      this.showToast('Failed to copy', 'error');
    }
  },

  // Confirm dialog
  confirm(message, onConfirm, onCancel) {
    try {
      const confirmed = window.confirm(message);
      if (confirmed && onConfirm) {
        onConfirm();
      } else if (!confirmed && onCancel) {
        onCancel();
      }
      return confirmed;
    } catch (error) {
      console.error('Confirm error:', error);
      return false;
    }
  },

  // Debounce function
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Make Utils available globally
window.Utils = Utils;

console.log('✅ Utils module loaded');
