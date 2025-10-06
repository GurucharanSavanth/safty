// ================================================
// VOICE RECORDING MODULE - COMPLETE PRODUCTION READY
// ================================================

const VoiceCommands = {
  
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  recordingTimeout: null,

  /**
   * Record voice note - similar to camera capture
   * Returns base64 audio data or throws error
   */
  async recordNote() {
    try {
      console.log('ðŸŽ¤ Voice: Initializing...');

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording not supported in this browser. Please use Chrome, Firefox, or Safari.');
      }

      // Request microphone permission (similar to camera)
      console.log('ðŸŽ¤ Requesting microphone permission...');
      
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          } 
        });
      } catch (permError) {
        console.error('âŒ Microphone permission error:', permError);
        
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          throw new Error('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (permError.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (permError.name === 'NotReadableError') {
          throw new Error('Microphone is being used by another application. Please close other apps and try again.');
        } else {
          throw new Error('Cannot access microphone: ' + permError.message);
        }
      }

      console.log('âœ… Microphone access granted');

      // Get supported mime type
      const mimeType = this.getBestMimeType();
      console.log('âœ… Using audio format:', mimeType);

      // Initialize MediaRecorder
      try {
        this.mediaRecorder = new MediaRecorder(this.stream, { 
          mimeType: mimeType,
          audioBitsPerSecond: 128000
        });
      } catch (recorderError) {
        this.stopStream();
        throw new Error('Failed to initialize recorder: ' + recorderError.message);
      }

      this.audioChunks = [];

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('ðŸ“Š Audio chunk collected:', event.data.size, 'bytes');
        }
      };

      // Handle recording errors
      this.mediaRecorder.onerror = (event) => {
        console.error('âŒ Recording error:', event.error);
        this.stopStream();
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log('ðŸŽ¤ Recording started');

      // Show recording UI and wait for user action
      const audioBlob = await this.showRecordingInterface();

      if (!audioBlob) {
        throw new Error('Recording cancelled');
      }

      console.log('âœ… Recording completed:', audioBlob.size, 'bytes', audioBlob.type);

      // Convert to base64 (similar to camera image conversion)
      const base64Audio = await this.convertToBase64(audioBlob);
      console.log('âœ… Audio converted to base64');

      return base64Audio;

    } catch (error) {
      console.error('âŒ Voice recording failed:', error);
      this.stopStream();
      throw error;
    }
  },

  /**
   * Get best supported audio mime type
   */
  getBestMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  },

  /**
   * Show recording interface (similar to camera preview)
   */
  showRecordingInterface() {
    return new Promise((resolve, reject) => {
      
      // Create fullscreen overlay
      const overlay = document.createElement('div');
      overlay.id = 'voiceRecordingOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.98);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999999;
        animation: fadeIn 0.3s ease-out;
      `;

      // Create recording UI
      const container = document.createElement('div');
      container.style.cssText = `
        max-width: 500px;
        width: 90%;
        text-align: center;
        animation: slideUp 0.4s ease-out;
      `;

      let seconds = 0;
      let timerInterval = null;

      container.innerHTML = `
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          @keyframes waveAnimation {
            0% { height: 20px; }
            50% { height: 60px; }
            100% { height: 20px; }
          }
        </style>

        <!-- Microphone Icon -->
        <div style="font-size: 8rem; margin-bottom: 32px; animation: pulse 2s infinite; filter: drop-shadow(0 0 40px rgba(239, 68, 68, 0.6));">
          ðŸŽ¤
        </div>

        <!-- Status Text -->
        <h2 style="color: #ef4444; font-size: 2rem; font-weight: 900; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px;">
          Recording
        </h2>

        <!-- Timer Display -->
        <div id="voiceTimer" style="font-size: 4rem; font-weight: 900; color: #fff; margin-bottom: 32px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);">
          00:00
        </div>

        <!-- Audio Waveform Visualization -->
        <div style="display: flex; gap: 4px; justify-content: center; margin-bottom: 48px; height: 60px; align-items: center;">
          ${Array(20).fill(0).map((_, i) => `
            <div style="width: 8px; background: linear-gradient(to top, #ef4444, #dc2626); border-radius: 4px; animation: waveAnimation ${0.5 + Math.random()}s infinite ease-in-out ${Math.random() * 0.5}s;"></div>
          `).join('')}
        </div>

        <!-- Instructions -->
        <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 32px; line-height: 1.6;">
          Speak clearly into your microphone<br>
          <span style="color: #64748b; font-size: 0.9rem;">Maximum duration: 60 seconds</span>
        </p>

        <!-- Control Buttons -->
        <div style="display: flex; gap: 20px; justify-content: center;">
          <button id="voiceDoneBtn" style="
            padding: 20px 48px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: none;
            border-radius: 16px;
            color: white;
            font-weight: 800;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
          ">
            âœ“ Done
          </button>
          <button id="voiceCancelBtn" style="
            padding: 20px 48px;
            background: rgba(239, 68, 68, 0.2);
            border: 2px solid #ef4444;
            border-radius: 16px;
            color: #fca5a5;
            font-weight: 800;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">
            âœ• Cancel
          </button>
        </div>

        <!-- Warning -->
        <div style="margin-top: 32px; padding: 16px; background: rgba(234, 179, 8, 0.1); border: 2px solid rgba(234, 179, 8, 0.3); border-radius: 12px;">
          <p style="color: #fbbf24; font-size: 0.95rem; font-weight: 600;">
            as Voice recording will automatically stop after 60 seconds
          </p>
        </div>
      `;

      overlay.appendChild(container);
      document.body.appendChild(overlay);

      const timerDisplay = document.getElementById('voiceTimer');
      const doneBtn = document.getElementById('voiceDoneBtn');
      const cancelBtn = document.getElementById('voiceCancelBtn');

      // Start timer
      timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Auto-stop at 60 seconds
        if (seconds >= 60) {
          console.log(' Maximum duration reached, auto-stopping');
          doneBtn.click();
        }
      }, 1000);

      // Done button handler
      doneBtn.addEventListener('click', () => {
        console.log('âœ“ Recording stopped by user');
        clearInterval(timerInterval);
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          
          this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { 
              type: this.mediaRecorder.mimeType 
            });
            
            this.stopStream();
            document.body.removeChild(overlay);
            resolve(audioBlob);
          };

          this.mediaRecorder.stop();
        }
      });

      // Cancel button handler
      cancelBtn.addEventListener('click', () => {
        console.log('âœ• Recording cancelled by user');
        clearInterval(timerInterval);
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
        
        this.stopStream();
        document.body.removeChild(overlay);
        resolve(null);
      });

      // Button hover effects
      doneBtn.addEventListener('mouseenter', () => {
        doneBtn.style.transform = 'translateY(-4px)';
        doneBtn.style.boxShadow = '0 12px 32px rgba(34, 197, 94, 0.5)';
      });
      doneBtn.addEventListener('mouseleave', () => {
        doneBtn.style.transform = 'translateY(0)';
        doneBtn.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.4)';
      });

      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = 'rgba(239, 68, 68, 0.3)';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'rgba(239, 68, 68, 0.2)';
      });
    });
  },

  /**
   * Convert audio blob to base64 (like camera image conversion)
   */
  convertToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert audio to base64'));
      };
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Stop microphone stream and cleanup
   */
  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log(' Microphone track stopped');
      });
      this.stream = null;
    }

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }
};

// Register globally
window.VoiceCommands = VoiceCommands;

console.log(' Voice recording module loaded - Production ready');
