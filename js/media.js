// ================================================
// MEDIA MODULE - CAMERA CAPTURE WITH FALLBACKS
// ================================================

const Media = {
  // Check if media is supported
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  // Main capture photo function
  async capturePhoto() {
    try {
      console.log('📸 Media module: Starting photo capture...');

      // Method 1: Try live camera first
      if (this.isSupported()) {
        console.log('✓ getUserMedia supported - using live camera');
        return await this.captureLivePhoto();
      }

      // Method 2: Fallback to file input
      console.warn('⚠️ getUserMedia not supported - using file input fallback');
      return await this.capturePhotoFallback();

    } catch (error) {
      console.error('📸 Camera capture failed:', error);

      // Try fallback if main method fails
      console.log('🔄 Trying file input fallback...');
      return await this.capturePhotoFallback();
    }
  },

  // Live camera capture
  async captureLivePhoto() {
    try {
      console.log('📹 Opening live camera stream...');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('✓ Camera stream acquired');

      // Show camera UI
      const photo = await this.showCameraPreview(stream);

      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      console.log('✓ Camera stopped');

      return photo;

    } catch (error) {
      console.error('Live camera error:', error.name, error.message);
      throw error;
    }
  },

  // Show live camera preview
  showCameraPreview(stream) {
    return new Promise((resolve, reject) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'cameraOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #000;
        z-index: 99999;
        display: flex;
        flex-direction: column;
      `;

      // Create video
      const video = document.createElement('video');
      video.style.cssText = `
        flex: 1;
        width: 100%;
        object-fit: cover;
      `;
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = stream;

      // Create controls
      const controls = document.createElement('div');
      controls.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 30px;
        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        display: flex;
        justify-content: center;
        gap: 20px;
      `;

      // Capture button
      const captureBtn = document.createElement('button');
      captureBtn.innerHTML = '📸 Capture';
      captureBtn.style.cssText = `
        padding: 16px 40px;
        background: linear-gradient(135deg, #3b82f6, #60a5fa);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
      `;

      captureBtn.onclick = async () => {
        try {
          // Flash effect
          overlay.style.backgroundColor = '#fff';
          setTimeout(() => overlay.style.backgroundColor = '#000', 100);

          // Capture frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          // Convert to base64
          const base64 = canvas.toDataURL('image/jpeg', 0.85);

          // Compress
          const compressed = await this.compressImage(base64, 0.8);

          // Cleanup
          document.body.removeChild(overlay);

          console.log('✅ Photo captured from live camera');
          resolve(compressed);
        } catch (error) {
          console.error('Capture frame error:', error);
          document.body.removeChild(overlay);
          reject(error);
        }
      };

      // Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.innerHTML = '✕ Cancel';
      cancelBtn.style.cssText = `
        padding: 16px 40px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
      `;

      cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
        reject(new Error('User cancelled'));
      };

      // Assemble
      controls.appendChild(cancelBtn);
      controls.appendChild(captureBtn);
      overlay.appendChild(video);
      overlay.appendChild(controls);
      document.body.appendChild(overlay);

      // Wait for video to be ready
      video.onloadedmetadata = () => {
        video.play().catch(err => {
          console.error('Video play error:', err);
          reject(err);
        });
      };
    });
  },

  // Fallback: File input method
  capturePhotoFallback() {
    return new Promise((resolve, reject) => {
      console.log('📁 Using file input method...');

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = async (e) => {
        try {
          const file = e.target.files[0];
          
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          if (!file.type.startsWith('image/')) {
            reject(new Error('Not an image file'));
            return;
          }

          console.log('📷 Processing image:', file.name);

          const base64 = await this.fileToBase64(file);
          const compressed = await this.compressImage(base64, 0.8);

          console.log('✅ Photo captured from file input');
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('User cancelled'));
      };

      input.click();
    });
  },

  // File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Compress image
  compressImage(base64, quality = 0.8) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', quality);
          
          console.log('✓ Image compressed:', 
            Math.round(base64.length / 1024), 'KB →',
            Math.round(compressed.length / 1024), 'KB'
          );
          
          resolve(compressed);
        };
        
        img.onerror = () => {
          console.warn('Compression failed, using original');
          resolve(base64);
        };
        
        img.src = base64;
      } catch (error) {
        console.error('Compression error:', error);
        resolve(base64);
      }
    });
  },

  // Get image dimensions
  getImageDimensions(base64) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = base64;
    });
  },

  // Validate image
  async validateImage(base64) {
    try {
      if (!base64 || !base64.startsWith('data:image/')) {
        return { valid: false, error: 'Invalid format' };
      }

      const dimensions = await this.getImageDimensions(base64);
      if (dimensions.width === 0) {
        return { valid: false, error: 'Failed to load' };
      }

      return { valid: true, dimensions };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
};

// Auto-register and test
if (typeof window !== 'undefined') {
  window.Media = Media;
  console.log('✅ Media module loaded');
  console.log('📸 Camera support:', Media.isSupported());
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Media;
}
