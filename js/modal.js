// ================================================
// MODAL.JS - FIXED VERSION
// Beautiful promise-based modal dialogs
// ================================================

console.log('✅ Modal module loading...');

const Modal = {
  currentModal: null,
  modalStack: [],

  // ==========================================
  // ALERT DIALOG (FIXED)
  // ==========================================
  
  alert(options) {
    return new Promise((resolve) => {
      const config = {
        title: options.title || 'Alert',
        message: options.message || '',
        icon: options.icon || '⚠️',
        confirmText: options.confirmText || 'OK',
        confirmColor: options.confirmColor || '#3b82f6'
      };

      this.show({
        ...config,
        type: 'alert',
        onConfirm: () => {
          this.close();
          resolve(true);
        }
      });
    });
  },

  // ==========================================
  // CONFIRM DIALOG (FIXED)
  // ==========================================
  
  confirm(options) {
    return new Promise((resolve) => {
      const config = {
        title: options.title || 'Confirm',
        message: options.message || 'Are you sure?',
        icon: options.icon || '❓',
        confirmText: options.confirmText || 'Yes',
        cancelText: options.cancelText || 'No',
        confirmColor: options.confirmColor || '#22c55e',
        cancelColor: options.cancelColor || '#ef4444'
      };

      this.show({
        ...config,
        type: 'confirm',
        onConfirm: () => {
          this.close();
          resolve(true);
        },
        onCancel: () => {
          this.close();
          resolve(false);
        }
      });
    });
  },

  // ==========================================
  // PROMPT DIALOG (FIXED)
  // ==========================================
  
  prompt(options) {
    return new Promise((resolve) => {
      const config = {
        title: options.title || 'Input',
        message: options.message || 'Please enter a value:',
        icon: options.icon || '✏️',
        placeholder: options.placeholder || '',
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || 'Submit',
        cancelText: options.cancelText || 'Cancel',
        inputType: options.inputType || 'text'
      };

      this.show({
        ...config,
        type: 'prompt',
        onConfirm: (value) => {
          this.close();
          resolve(value);
        },
        onCancel: () => {
          this.close();
          resolve(null);
        }
      });
    });
  },

  // ==========================================
  // SHOW MODAL (FIXED)
  // ==========================================
  
  show(config) {
    // Close any existing modal first
    if (this.currentModal) {
      this.close();
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
      animation: modalFadeIn 0.2s ease;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(59, 130, 246, 0.2);
      animation: modalSlideIn 0.3s ease;
    `;

    // Icon
    if (config.icon) {
      const icon = document.createElement('div');
      icon.style.cssText = `
        font-size: 4rem;
        text-align: center;
        margin-bottom: 20px;
      `;
      icon.textContent = config.icon;
      modalContent.appendChild(icon);
    }

    // Title
    if (config.title) {
      const title = document.createElement('h2');
      title.style.cssText = `
        font-size: 1.75rem;
        font-weight: 800;
        color: #f1f5f9;
        margin-bottom: 16px;
        text-align: center;
      `;
      title.textContent = config.title;
      modalContent.appendChild(title);
    }

    // Message
    if (config.message) {
      const message = document.createElement('p');
      message.style.cssText = `
        font-size: 1rem;
        color: #94a3b8;
        margin-bottom: 24px;
        text-align: center;
        line-height: 1.6;
        white-space: pre-wrap;
      `;
      message.textContent = config.message;
      modalContent.appendChild(message);
    }

    // Input field for prompt
    let inputField = null;
    if (config.type === 'prompt') {
      inputField = document.createElement('input');
      inputField.type = config.inputType || 'text';
      inputField.placeholder = config.placeholder || '';
      inputField.value = config.defaultValue || '';
      inputField.style.cssText = `
        width: 100%;
        padding: 14px 18px;
        font-size: 1rem;
        border: 2px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.8);
        color: #f1f5f9;
        margin-bottom: 24px;
        outline: none;
        transition: all 0.3s;
        box-sizing: border-box;
      `;
      
      // Focus styles
      inputField.addEventListener('focus', () => {
        inputField.style.borderColor = '#3b82f6';
      });
      
      inputField.addEventListener('blur', () => {
        inputField.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      });

      // Enter key to confirm
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && config.onConfirm) {
          config.onConfirm(inputField.value);
        }
      });

      modalContent.appendChild(inputField);
    }

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    // Cancel button (for confirm and prompt)
    if (config.type === 'confirm' || config.type === 'prompt') {
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = config.cancelText || 'Cancel';
      cancelBtn.style.cssText = `
        padding: 14px 32px;
        font-size: 1rem;
        font-weight: 700;
        border: 2px solid ${config.cancelColor || '#ef4444'};
        border-radius: 12px;
        background: transparent;
        color: ${config.cancelColor || '#ef4444'};
        cursor: pointer;
        transition: all 0.3s;
        flex: 1;
      `;

      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = config.cancelColor || '#ef4444';
        cancelBtn.style.color = 'white';
      });

      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = config.cancelColor || '#ef4444';
      });

      cancelBtn.addEventListener('click', () => {
        if (config.onCancel) {
          config.onCancel();
        }
      });

      buttonsContainer.appendChild(cancelBtn);
    }

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = config.confirmText || 'OK';
    confirmBtn.style.cssText = `
      padding: 14px 32px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      background: ${config.confirmColor || '#3b82f6'};
      color: white;
      cursor: pointer;
      transition: all 0.3s;
      flex: 1;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    `;

    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.transform = 'translateY(-2px)';
      confirmBtn.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    });

    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.transform = 'translateY(0)';
      confirmBtn.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
    });

    confirmBtn.addEventListener('click', () => {
      if (config.onConfirm) {
        if (config.type === 'prompt' && inputField) {
          config.onConfirm(inputField.value);
        } else {
          config.onConfirm();
        }
      }
    });

    buttonsContainer.appendChild(confirmBtn);
    modalContent.appendChild(buttonsContainer);

    // Add modal to DOM
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Store reference
    this.currentModal = modal;

    // Focus input if prompt
    if (inputField) {
      setTimeout(() => inputField.focus(), 100);
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal && config.onCancel) {
        config.onCancel();
      }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && config.onCancel) {
        config.onCancel();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return modal;
  },

  // ==========================================
  // CLOSE MODAL (FIXED)
  // ==========================================
  
  close() {
    if (this.currentModal) {
      this.currentModal.style.animation = 'modalFadeOut 0.2s ease';
      
      setTimeout(() => {
        if (this.currentModal && this.currentModal.parentNode) {
          this.currentModal.parentNode.removeChild(this.currentModal);
        }
        this.currentModal = null;
      }, 200);
    }
  },

  // ==========================================
  // CUSTOM MODAL
  // ==========================================
  
  custom(options) {
    return new Promise((resolve) => {
      const modal = this.show({
        title: options.title,
        message: options.message,
        icon: options.icon,
        confirmText: options.confirmText || 'OK',
        confirmColor: options.confirmColor,
        type: 'alert',
        onConfirm: () => {
          this.close();
          resolve(true);
        }
      });

      // Add custom content if provided
      if (options.content && typeof options.content === 'function') {
        const modalContent = modal.querySelector('.modal-content');
        const customElement = options.content();
        if (customElement) {
          modalContent.insertBefore(customElement, modalContent.lastElementChild);
        }
      }
    });
  },

  // ==========================================
  // LOADING MODAL
  // ==========================================
  
  loading(message = 'Loading...') {
    // Create loading modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-loading';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      border: 2px solid rgba(59, 130, 246, 0.2);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      border: 5px solid rgba(59, 130, 246, 0.2);
      border-top: 5px solid #3b82f6;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    `;

    const text = document.createElement('p');
    text.style.cssText = `
      color: #94a3b8;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    `;
    text.textContent = message;

    content.appendChild(spinner);
    content.appendChild(text);
    modal.appendChild(content);
    document.body.appendChild(modal);

    this.currentModal = modal;

    return {
      close: () => this.close(),
      updateMessage: (newMessage) => {
        text.textContent = newMessage;
      }
    };
  }
};

// ==========================================
// ADD CSS ANIMATIONS
// ==========================================

if (!document.getElementById('modal-animations')) {
  const style = document.createElement('style');
  style.id = 'modal-animations';
  style.textContent = `
    @keyframes modalFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes modalFadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes modalSlideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}

console.log('✅ Modal module loaded successfully');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
}
