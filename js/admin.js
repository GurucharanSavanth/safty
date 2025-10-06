// ================================================
// ADMIN MODULE - COMPLETE WITH PROFILE & AI CONFIG
// ================================================

const Admin = {
  credentials: {
    username: 'admin',
    password: 'admin123'
  },
  isLoggedIn: false,

  init() {
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const closeAdminModal = document.getElementById('closeAdminModal');
    const cancelAdminLogin = document.getElementById('cancelAdminLogin');
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (!adminLoginBtn || !adminLoginModal) {
      console.log('✓ Admin module initialized (no login UI in this page)');
      return;
    }

    adminLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      adminLoginModal.classList.remove('hidden');
      setTimeout(() => document.getElementById('adminUsername')?.focus(), 100);
    });

    closeAdminModal?.addEventListener('click', () => this.closeLoginModal());
    cancelAdminLogin?.addEventListener('click', () => this.closeLoginModal());

    adminLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    adminLoginModal.addEventListener('click', (e) => {
      if (e.target === adminLoginModal) this.closeLoginModal();
    });

    console.log('✓ Admin module initialized');
  },

  closeLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const errorDiv = document.getElementById('loginError');

    modal?.classList.add('hidden');
    errorDiv?.classList.add('hidden');
    if (errorDiv) errorDiv.textContent = '';

    const username = document.getElementById('adminUsername');
    const password = document.getElementById('adminPassword');
    if (username) username.value = '';
    if (password) password.value = '';
  },

  async login() {
    const username = document.getElementById('adminUsername')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;

    if (!username || !password) {
      this.showLoginError('Enter username and password');
      return;
    }

    // Use ProfileManager for authentication if available
    if (typeof ProfileManager !== 'undefined') {
      try {
        const result = await ProfileManager.authenticate(username, password);

        if (result.success) {
          this.isLoggedIn = true;
          if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('Login successful!', 'success');
          }
          this.closeLoginModal();
          setTimeout(() => this.openDashboard(), 500);
        } else {
          this.showLoginError(result.error || 'Invalid credentials');
          const form = document.getElementById('adminLoginForm');
          if (form) {
            form.style.animation = 'shake 0.5s';
            setTimeout(() => form.style.animation = '', 500);
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        this.showLoginError('Login failed: ' + error.message);
      }
    } else {
      // Fallback to old authentication
      if (username === this.credentials.username && password === this.credentials.password) {
        this.isLoggedIn = true;
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Login successful!', 'success');
        }
        this.closeLoginModal();
        setTimeout(() => this.openDashboard(), 500);
      } else {
        this.showLoginError('Invalid credentials');
      }
    }
  },

  showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  },

  openDashboard() {
    try {
      const dashboardWindow = window.open('admin-dashboard.html', '_blank');
      if (!dashboardWindow || dashboardWindow.closed) {
        console.warn('Pop-up blocked, showing inline dashboard');
        this.createInlineDashboard();
      }
    } catch (error) {
      console.error('Dashboard open error:', error);
      this.createInlineDashboard();
    }
  },

  createInlineDashboard() {
    if (typeof Storage === 'undefined') {
      alert('Storage module not loaded');
      return;
    }

    const police = Storage.getAllReports('police') || [];
    const medical = Storage.getAllReports('medical') || [];
    const infrastructure = Storage.getAllReports('infrastructure') || [];
    const all = [...police, ...medical, ...infrastructure].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const stats = Storage.getStatistics ? Storage.getStatistics() : {
      police: police.length,
      medical: medical.length,
      infrastructure: infrastructure.length,
      total: all.length,
      pending: all.filter(r => r.status === 'pending').length,
      inProgress: all.filter(r => r.status === 'in-progress').length,
      resolved: all.filter(r => r.status === 'resolved').length
    };

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
      <div class="modal-panel" style="max-width: 95%; max-height: 95%; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">📊 Admin Dashboard</h2>
          <button class="close-btn" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">

          <!-- Profile Management Section -->
          <div style="margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1)); border: 2px solid #8b5cf6; border-radius: 16px;">
            <h3 style="color: #a78bfa; font-weight: 700; font-size: 1.5rem; margin-bottom: 16px;">👥 Profile Management</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button onclick="Admin.showProfileManagement()" style="padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #a78bfa); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Manage Profiles
              </button>
              <button onclick="Admin.createProfileModal()" style="padding: 12px 24px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                ➕ Create New Profile
              </button>
              <button onclick="Admin.showAIConfigModal()" style="padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #60a5fa); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                🤖 AI Config
              </button>
            </div>
          </div>

          <!-- Statistics -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
            <div style="padding: 20px; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 12px;">
              <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${stats.police}</div>
              <div style="color: #cbd5e1; font-weight: 600;">Police Reports</div>
            </div>
            <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; border-radius: 12px;">
              <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">${stats.medical}</div>
              <div style="color: #cbd5e1; font-weight: 600;">Medical Reports</div>
            </div>
            <div style="padding: 20px; background: rgba(245, 158, 11, 0.1); border: 2px solid #f59e0b; border-radius: 12px;">
              <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${stats.infrastructure}</div>
              <div style="color: #cbd5e1; font-weight: 600;">Infrastructure</div>
            </div>
            <div style="padding: 20px; background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; border-radius: 12px;">
              <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${stats.total}</div>
              <div style="color: #cbd5e1; font-weight: 600;">Total Reports</div>
            </div>
          </div>

          ${stats.total === 0 ? `
          <div style="text-align: center; padding: 60px;">
            <div style="font-size: 4rem;">📊</div>
            <h3 style="font-size: 1.5rem; margin: 16px 0;">No Reports Yet</h3>
            <p style="color: #94a3b8;">Reports will appear here</p>
          </div>
          ` : `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 style="font-size: 1.5rem; font-weight: 700;">Recent Reports</h3>
              <button onclick="Admin.runAIAnalysis()" style="padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #a78bfa); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                🤖 Run AI Analysis
              </button>
            </div>
            <div style="display: grid; gap: 16px; max-height: 500px; overflow-y: auto;">
              ${all.map(r => this.createReportCard(r)).join('')}
            </div>
          </div>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  createReportCard(report) {
    const colors = { police: '#3b82f6', medical: '#ef4444', infrastructure: '#f59e0b' };
    const icons = { police: '🚔', medical: '🚑', infrastructure: '🏗️' };
    const color = colors[report.type] || '#64748b';
    const icon = icons[report.type] || '📋';

    return `
      <div style="padding: 20px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <div style="display: flex; gap: 12px;">
            <span style="font-size: 1.5rem;">${icon}</span>
            <div>
              <div style="color: ${color}; font-weight: 700;">${report.id}</div>
              <div style="color: #94a3b8; font-size: 0.875rem; text-transform: capitalize;">${report.type}</div>
            </div>
          </div>
          <span style="padding: 4px 12px; background: rgba(${color === '#3b82f6' ? '59,130,246' : color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.2); border: 1px solid ${color}; border-radius: 20px; color: ${color}; font-size: 0.75rem; text-transform: uppercase;">${report.status || 'pending'}</span>
        </div>
        <div style="color: #cbd5e1; font-size: 0.875rem;">
          <div><strong>Date:</strong> ${report.timestamp?.full || new Date(report.createdAt).toLocaleString() || 'N/A'}</div>
          <div><strong>Location:</strong> ${report.location?.isReal ? 
            `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}` : 
            'Not provided'}</div>
        </div>
        ${report.photo ? `<img src="${report.photo}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 12px; cursor: pointer;" onclick="window.open(this.src)">` : ''}
      </div>
    `;
  },

  // ==========================================
  // AI CONFIGURATION MODAL
  // ==========================================

  showAIConfigModal() {
    console.log('🤖 Opening AI Config modal...');
    
    if (typeof AIAnalytics === 'undefined') {
      alert('AI Analytics module not loaded. Please refresh the page.');
      return;
    }

    if (typeof Utils === 'undefined') {
      alert('Utils module not loaded. Please refresh the page.');
      return;
    }

    const keys = AIAnalytics.loadAPIKeys ? AIAnalytics.loadAPIKeys() : { gemini: '', openai: '' };
    const provider = AIAnalytics.config?.currentProvider || 'gemini';

    Utils.createModal(
      '🤖 AI Configuration',
      `
        <div style="display: grid; gap: 24px;">
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15)); border-left: 4px solid #8b5cf6; border-radius: 12px;">
            <h3 style="color: #a78bfa; font-weight: 700; margin-bottom: 12px;">🤖 AI-Powered Analysis</h3>
            <p style="color: #cbd5e1; line-height: 1.6;">
              Configure API keys for Google Gemini or OpenAI ChatGPT to enable intelligent analysis with DBSCAN clustering.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Select AI Provider</label>
            <select id="aiProvider" class="form-select" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
              <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>🌟 Google Gemini (Free)</option>
              <option value="openai" ${provider === 'openai' ? 'selected' : ''}>💬 OpenAI ChatGPT</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">
              Gemini API Key 
              <a href="https://aistudio.google.com/apikey" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 600;">(Get Free Key)</a>
            </label>
            <input type="password" id="geminiKey" value="${keys.gemini || ''}" class="form-input" placeholder="Enter Gemini API key" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            <button onclick="Admin.togglePasswordVisibility('geminiKey')" style="margin-top: 8px; padding: 6px 12px; background: var(--bg-tertiary); border: none; border-radius: 6px; cursor: pointer;">👁️ Show/Hide</button>
          </div>

          <div class="form-group">
            <label class="form-label">
              OpenAI API Key 
              <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 600;">(Get Key)</a>
            </label>
            <input type="password" id="openaiKey" value="${keys.openai || ''}" class="form-input" placeholder="Enter OpenAI API key" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            <button onclick="Admin.togglePasswordVisibility('openaiKey')" style="margin-top: 8px; padding: 6px 12px; background: var(--bg-tertiary); border: none; border-radius: 6px; cursor: pointer;">👁️ Show/Hide</button>
          </div>

          <div style="padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
            <p style="color: #fbbf24; font-size: 0.875rem;">
              <strong>Note:</strong> API keys are stored locally in your browser. Gemini offers free tier with generous limits.
            </p>
          </div>
        </div>
      `,
      [
        { label: 'Save Configuration', type: 'primary', action: 'Admin.saveAIConfig()' },
        { label: 'Cancel', type: 'secondary', action: "Utils.closeModal('dynamicModal')" }
      ]
    );
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  },

  saveAIConfig() {
    const provider = document.getElementById('aiProvider')?.value || 'gemini';
    const geminiKey = document.getElementById('geminiKey')?.value.trim() || '';
    const openaiKey = document.getElementById('openaiKey')?.value.trim() || '';

    if (!geminiKey && !openaiKey) {
      alert('Please enter at least one API key');
      return;
    }

    if (typeof AIAnalytics === 'undefined') {
      alert('AI Analytics module not loaded');
      return;
    }

    if (AIAnalytics.setAPIKeys) {
      AIAnalytics.setAPIKeys(geminiKey, openaiKey);
    } else {
      if (geminiKey) localStorage.setItem('ai_gemini_key', geminiKey);
      if (openaiKey) localStorage.setItem('ai_openai_key', openaiKey);
    }

    if (AIAnalytics.setProvider) {
      AIAnalytics.setProvider(provider);
    } else {
      localStorage.setItem('ai_provider', provider);
    }

    if (typeof Utils !== 'undefined') {
      Utils.closeModal('dynamicModal');
      if (Utils.showToast) {
        Utils.showToast('✅ AI configuration saved successfully!', 'success');
      }
    }

    console.log('✓ AI Config saved');
  },

  // ==========================================
  // PROFILE MANAGEMENT METHODS
  // ==========================================

  showProfileManagement() {
    if (typeof ProfileManager === 'undefined') {
      alert('Profile Manager not loaded');
      return;
    }

    if (typeof Utils === 'undefined') {
      alert('Utils module not loaded');
      return;
    }

    const profiles = ProfileManager.getAllProfiles();
    const stats = ProfileManager.getStatistics();

    Utils.createModal(
      '👥 Profile Management',
      `
        <div style="display: grid; gap: 24px;">
          <!-- Statistics -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 8px; text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${stats.total}</div>
              <div style="color: #cbd5e1; font-size: 0.875rem;">Total Profiles</div>
            </div>
            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border: 2px solid #22c55e; border-radius: 8px; text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: #22c55e;">${stats.active}</div>
              <div style="color: #cbd5e1; font-size: 0.875rem;">Active</div>
            </div>
            <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; border-radius: 8px; text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: #ef4444;">${stats.inactive}</div>
              <div style="color: #cbd5e1; font-size: 0.875rem;">Inactive</div>
            </div>
          </div>

          <!-- Profiles List -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 1.25rem; font-weight: 700;">All Profiles</h3>
              <button onclick="Admin.createProfileModal()" style="padding: 8px 16px; background: #22c55e; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                ➕ Add Profile
              </button>
            </div>

            ${profiles.length === 0 ? `
              <div style="text-align: center; padding: 40px; color: #64748b;">
                <p>No profiles created yet</p>
              </div>
            ` : `
              <div style="display: grid; gap: 12px; max-height: 400px; overflow-y: auto;">
                ${profiles.map(profile => this.createProfileCard(profile)).join('')}
              </div>
            `}
          </div>
        </div>
      `,
      [{ label: 'Close', type: 'primary', action: "Utils.closeModal('dynamicModal')" }]
    );
  },

  createProfileCard(profile) {
    const roleColors = {
      police: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#60a5fa' },
      medical: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#f87171' },
      infrastructure: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fbbf24' }
    };
    const colors = roleColors[profile.role] || roleColors.police;

    return `
      <div style="padding: 16px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 1.1rem; color: #f1f5f9;">${profile.fullName}</div>
              <span style="padding: 4px 10px; background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 12px; color: ${colors.text}; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                ${profile.role}
              </span>
              ${profile.isActive ? 
                '<span style="padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; border-radius: 12px; color: #22c55e; font-size: 0.75rem; font-weight: 600;">Active</span>' :
                '<span style="padding: 4px 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; color: #ef4444; font-size: 0.75rem; font-weight: 600;">Inactive</span>'
              }
            </div>
            <div style="color: #94a3b8; font-size: 0.875rem;">
              <div><strong>Username:</strong> ${profile.username}</div>
              <div><strong>Email:</strong> ${profile.email || 'Not provided'}</div>
              <div><strong>Access Level:</strong> ${profile.accessLevel}</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="Admin.editProfile('${profile.id}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Edit</button>
            <button onclick="Admin.toggleProfileStatus('${profile.id}')" style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
              ${profile.isActive ? 'Disable' : 'Enable'}
            </button>
            <button onclick="Admin.deleteProfile('${profile.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Delete</button>
          </div>
        </div>
      </div>
    `;
  },

  createProfileModal() {
    if (typeof Utils === 'undefined') return;

    Utils.closeModal('dynamicModal');

    Utils.createModal(
      '➕ Create New Profile',
      `
        <form id="createProfileForm">
          <div style="display: grid; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="profileFullName" class="form-input" required placeholder="Enter full name" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Username *</label>
              <input type="text" id="profileUsername" class="form-input" required placeholder="Choose username" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" id="profilePassword" class="form-input" required placeholder="Set password" minlength="6" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Role *</label>
              <select id="profileRole" class="form-select" required style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
                <option value="">Select Role</option>
                <option value="police">🚔 Police</option>
                <option value="medical">🚑 Medical</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="profileEmail" class="form-input" placeholder="email@example.com" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" id="profilePhone" class="form-input" placeholder="+91 1234567890" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
              <p style="color: #60a5fa; font-size: 0.875rem;">
                <strong>Note:</strong> The new profile will have access only to reports of their assigned role.
              </p>
            </div>
          </div>
        </form>
      `,
      [
        { label: 'Create Profile', type: 'primary', action: 'Admin.submitCreateProfile()' },
        { label: 'Cancel', type: 'secondary', action: "Admin.showProfileManagement()" }
      ]
    );
  },

  async submitCreateProfile() {
    const fullName = document.getElementById('profileFullName')?.value.trim();
    const username = document.getElementById('profileUsername')?.value.trim();
    const password = document.getElementById('profilePassword')?.value;
    const role = document.getElementById('profileRole')?.value;
    const email = document.getElementById('profileEmail')?.value.trim();
    const phone = document.getElementById('profilePhone')?.value.trim();

    if (!fullName || !username || !password || !role) {
      alert('Please fill all required fields');
      return;
    }

    if (typeof ProfileManager === 'undefined') {
      alert('ProfileManager not loaded');
      return;
    }

    try {
      const result = await ProfileManager.createProfile({
        fullName,
        username,
        password,
        role,
        email,
        phone,
        accessLevel: 1
      });

      if (result.success) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Profile created successfully', 'success');
        }
        this.showProfileManagement();
      } else {
        alert('Failed to create profile: ' + result.error);
      }
    } catch (error) {
      console.error('Create profile error:', error);
      alert('Failed to create profile: ' + error.message);
    }
  },

  editProfile(profileId) {
    if (typeof ProfileManager === 'undefined' || typeof Utils === 'undefined') return;

    const profile = ProfileManager.getProfileById(profileId);
    if (!profile) return;

    Utils.closeModal('dynamicModal');

    Utils.createModal(
      '✏️ Edit Profile',
      `
        <form id="editProfileForm">
          <div style="display: grid; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="editFullName" class="form-input" value="${profile.fullName}" required style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">New Password (leave blank to keep current)</label>
              <input type="password" id="editPassword" class="form-input" placeholder="Enter new password" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <select id="editRole" class="form-select" required style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
                <option value="police" ${profile.role === 'police' ? 'selected' : ''}>🚔 Police</option>
                <option value="medical" ${profile.role === 'medical' ? 'selected' : ''}>🚑 Medical</option>
                <option value="infrastructure" ${profile.role === 'infrastructure' ? 'selected' : ''}>🏗️ Infrastructure</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="editEmail" class="form-input" value="${profile.email || ''}" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>

            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" id="editPhone" class="form-input" value="${profile.phone || ''}" style="width: 100%; padding: 10px; background: var(--bg-secondary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary);">
            </div>
          </div>
        </form>
      `,
      [
        { label: 'Save Changes', type: 'primary', action: `Admin.submitEditProfile('${profileId}')` },
        { label: 'Cancel', type: 'secondary', action: "Admin.showProfileManagement()" }
      ]
    );
  },

  async submitEditProfile(profileId) {
    const updates = {
      fullName: document.getElementById('editFullName')?.value.trim(),
      role: document.getElementById('editRole')?.value,
      email: document.getElementById('editEmail')?.value.trim(),
      phone: document.getElementById('editPhone')?.value.trim()
    };

    const newPassword = document.getElementById('editPassword')?.value;
    if (newPassword) {
      updates.password = newPassword;
    }

    if (typeof ProfileManager === 'undefined') {
      alert('ProfileManager not loaded');
      return;
    }

    try {
      const result = await ProfileManager.updateProfile(profileId, updates);

      if (result.success) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Profile updated successfully', 'success');
        }
        this.showProfileManagement();
      } else {
        alert('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile: ' + error.message);
    }
  },

  toggleProfileStatus(profileId) {
    if (typeof ProfileManager === 'undefined') return;

    const result = ProfileManager.toggleProfileStatus(profileId);
    if (result.success) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Profile ${result.profile.isActive ? 'enabled' : 'disabled'}`, 'success');
      }
      this.showProfileManagement();
    } else {
      alert('Failed to toggle status: ' + result.error);
    }
  },

  deleteProfile(profileId) {
    if (typeof ProfileManager === 'undefined') return;

    const profile = ProfileManager.getProfileById(profileId);
    if (!profile) return;

    if (confirm(`Are you sure you want to delete profile "${profile.fullName}"? This action cannot be undone.`)) {
      const result = ProfileManager.deleteProfile(profileId);
      if (result.success) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Profile deleted', 'success');
        }
        this.showProfileManagement();
      } else {
        alert('Failed to delete profile: ' + result.error);
      }
    }
  },

  async runAIAnalysis() {
    if (typeof AIAnalytics === 'undefined') {
      alert('AI Analytics module not loaded');
      return;
    }

    if (typeof Storage === 'undefined') {
      alert('Storage module not loaded');
      return;
    }

    const all = [
      ...(Storage.getAllReports('police') || []),
      ...(Storage.getAllReports('medical') || []),
      ...(Storage.getAllReports('infrastructure') || [])
    ];

    if (all.length === 0) {
      alert('No reports to analyze');
      return;
    }

    if (typeof Utils !== 'undefined' && Utils.showLoading) {
      Utils.showLoading('🤖 Running AI analysis...');
    }

    try {
      const analysis = await AIAnalytics.analyzeAllReports(all);
      
      if (typeof Utils !== 'undefined' && Utils.hideLoading) {
        Utils.hideLoading();
      }
      
      this.showAnalysisResults(analysis);
    } catch (error) {
      if (typeof Utils !== 'undefined' && Utils.hideLoading) {
        Utils.hideLoading();
      }
      alert('AI Analysis failed: ' + error.message);
    }
  },

  showAnalysisResults(analysis) {
    if (typeof Utils === 'undefined') return;

    const { clusters, noise } = analysis.clustering || { clusters: [], noise: [] };

    Utils.createModal(
      '🤖 AI Analysis Results',
      `
        <div style="display: grid; gap: 24px;">
          <div style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; border-radius: 8px;">
            <h3 style="color: #a78bfa; font-weight: 700; margin-bottom: 12px;">Overall Assessment</h3>
            <p style="color: #cbd5e1; line-height: 1.6;">${analysis.overall_safety_assessment || 'Analysis complete'}</p>
          </div>

          <div>
            <h3 style="color: #ef4444; font-weight: 700; margin-bottom: 12px;">🎯 High Priority Areas</h3>
            ${analysis.high_priority_areas?.map(area => `
              <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 6px; margin-bottom: 8px;">
                <div style="font-weight: 600; color: #f87171;">${area.area}</div>
                <div style="font-size: 0.875rem; color: #cbd5e1;">${area.reason}</div>
              </div>
            `).join('') || '<p style="color: #94a3b8;">No high-priority areas identified</p>'}
          </div>

          <div>
            <h3 style="color: #3b82f6; font-weight: 700; margin-bottom: 12px;">📊 DBSCAN Clustering Results</h3>
            <div style="padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
              <p style="color: #cbd5e1;"><strong>Clusters Identified:</strong> ${clusters.length}</p>
              <p style="color: #cbd5e1;"><strong>Isolated Reports:</strong> ${noise.length}</p>
              ${clusters.map((cluster, i) => `
                <div style="margin-top: 12px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">
                  <strong style="color: #60a5fa;">Cluster ${i + 1}</strong>
                  <div style="font-size: 0.875rem; color: #cbd5e1;">
                    Reports: ${cluster.size} | Severity: ${cluster.severity.toFixed(2)}
                    <br>Location: ${cluster.centroid.latitude.toFixed(4)}, ${cluster.centroid.longitude.toFixed(4)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <h3 style="color: #f59e0b; font-weight: 700; margin-bottom: 12px;">💡 Recommendations</h3>
            <ul style="list-style: none; padding: 0;">
              ${analysis.resource_allocation?.map(rec => `
                <li style="padding: 8px 12px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 6px; margin-bottom: 6px; color: #cbd5e1;">• ${rec}</li>
              `).join('') || '<p style="color: #94a3b8;">No recommendations available</p>'}
            </ul>
          </div>
        </div>
      `,
      [{ label: 'Close', type: 'primary', action: "Utils.closeModal('dynamicModal')" }]
    );
  }
};

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }';
document.head.appendChild(shakeStyle);

// Make Admin available globally
window.Admin = Admin;

console.log('✅ Admin module loaded');
