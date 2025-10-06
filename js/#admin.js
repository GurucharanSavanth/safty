// ================================================
// ADMIN MODULE - COMPLETE WITH AI CONFIG & PROFILE MANAGEMENT
// ================================================

const Admin = {
  credentials: {
    username: 'admin',
    password: 'admin123'
  },
  isLoggedIn: false,

  init() {
    console.log('✓ Admin module initialized');
  },

  // ==========================================
  // AI CONFIGURATION MODAL - FIXED
  // ==========================================

  showAIConfigModal() {
    console.log('🤖 Opening AI Config modal...');

    if (typeof AIAnalytics === 'undefined') {
      alert('AI Analytics module not loaded. Please refresh the page.');
      console.error('AIAnalytics is undefined');
      return;
    }

    // Get current settings
    const keys = AIAnalytics.loadAPIKeys();
    const provider = AIAnalytics.config.currentProvider || 'gemini';

    console.log('Current provider:', provider);
    console.log('Keys loaded:', { hasGemini: !!keys.gemini, hasOpenAI: !!keys.openai });

    if (typeof Utils === 'undefined') {
      alert('Utils module not loaded');
      return;
    }

    Utils.createModal(
      '🤖 AI Configuration',
      `
        <div style="display: grid; gap: 24px;">
          <!-- Info Banner -->
          <div style="padding: 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15)); border-left: 4px solid #8b5cf6; border-radius: 12px;">
            <h3 style="color: #a78bfa; font-weight: 700; margin-bottom: 12px; font-size: 1.1rem;">
              🤖 AI-Powered Analysis
            </h3>
            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 12px;">
              Configure API keys for Google Gemini or OpenAI ChatGPT to enable intelligent analysis with DBSCAN clustering.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px;">
              <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; margin-bottom: 4px;">🎯</div>
                <div style="color: #60a5fa; font-weight: 600; font-size: 0.875rem;">DBSCAN Clustering</div>
              </div>
              <div style="padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; margin-bottom: 4px;">📊</div>
                <div style="color: #22c55e; font-weight: 600; font-size: 0.875rem;">Predictive Insights</div>
              </div>
              <div style="padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
                <div style="font-size: 1.5rem; margin-bottom: 4px;">🧠</div>
                <div style="color: #fbbf24; font-weight: 600; font-size: 0.875rem;">Smart Recommendations</div>
              </div>
            </div>
          </div>

          <!-- Provider Selection -->
          <div class="form-group">
            <label class="form-label" style="font-size: 1rem; font-weight: 600; margin-bottom: 8px; display: block;">
              Select AI Provider
            </label>
            <select id="aiProvider" class="form-select" style="width: 100%; padding: 12px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary); font-size: 1rem;">
              <option value="gemini" ${provider === 'gemini' ? 'selected' : ''}>
                🟢 Google Gemini (Recommended - Free Tier Available)
              </option>
              <option value="openai" ${provider === 'openai' ? 'selected' : ''}>
                🔵 OpenAI ChatGPT (Requires Paid Account)
              </option>
            </select>
            <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 8px;">
              Gemini offers generous free tier limits perfect for testing
            </p>
          </div>

          <!-- Gemini API Key -->
          <div class="form-group">
            <label class="form-label" style="font-size: 1rem; font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>Google Gemini API Key</span>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 0.875rem; padding: 4px 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; transition: all 0.3s;">
                🔗 Get Free Key
              </a>
            </label>
            <input 
              type="password" 
              id="geminiKey" 
              value="${keys.gemini || ''}" 
              class="form-input" 
              placeholder="Enter your Gemini API key (e.g., AIzaSy...)"
              style="width: 100%; padding: 12px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary); font-size: 0.95rem; font-family: 'Courier New', monospace;"
            >
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button onclick="Admin.togglePasswordVisibility('geminiKey')" style="padding: 6px 12px; background: var(--bg-tertiary); border: none; border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 0.875rem;">
                👁️ Show/Hide
              </button>
              <button onclick="Admin.testAPIKey('gemini')" style="padding: 6px 12px; background: #22c55e; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 0.875rem; font-weight: 600;">
                ✓ Test Key
              </button>
            </div>
          </div>

          <!-- OpenAI API Key -->
          <div class="form-group">
            <label class="form-label" style="font-size: 1rem; font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>OpenAI API Key</span>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 0.875rem; padding: 4px 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">
                🔗 Get Key
              </a>
            </label>
            <input 
              type="password" 
              id="openaiKey" 
              value="${keys.openai || ''}" 
              class="form-input" 
              placeholder="Enter your OpenAI API key (e.g., sk-proj-...)"
              style="width: 100%; padding: 12px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px; color: var(--text-primary); font-size: 0.95rem; font-family: 'Courier New', monospace;"
            >
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button onclick="Admin.togglePasswordVisibility('openaiKey')" style="padding: 6px 12px; background: var(--bg-tertiary); border: none; border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: 0.875rem;">
                👁️ Show/Hide
              </button>
              <button onclick="Admin.testAPIKey('openai')" style="padding: 6px 12px; background: #22c55e; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 0.875rem; font-weight: 600;">
                ✓ Test Key
              </button>
            </div>
          </div>

          <!-- Security Notice -->
          <div style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 8px;">
            <p style="color: #fbbf24; font-size: 0.875rem; line-height: 1.6;">
              <strong>🔒 Security Note:</strong> API keys are stored locally in your browser's localStorage. 
              Never share your keys. For production, use environment variables and backend API proxies.
            </p>
          </div>

          <!-- Quick Start Guide -->
          <details style="padding: 16px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px;">
            <summary style="cursor: pointer; font-weight: 600; color: #60a5fa; user-select: none;">
              📖 Quick Start Guide
            </summary>
            <div style="margin-top: 12px; color: #cbd5e1; font-size: 0.875rem; line-height: 1.6;">
              <ol style="padding-left: 20px;">
                <li style="margin-bottom: 8px;">
                  <strong>Get Gemini API Key (Recommended):</strong> Visit 
                  <a href="https://aistudio.google.com/apikey" target="_blank" style="color: #3b82f6;">Google AI Studio</a>, 
                  sign in, click "Get API Key", and copy it.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Paste Key:</strong> Paste your API key in the "Gemini API Key" field above.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Test Connection:</strong> Click "Test Key" to verify it works.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Save & Run:</strong> Click "Save Configuration" then use "Run AI Analysis" on the dashboard.
                </li>
              </ol>
              <p style="margin-top: 12px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">
                💡 <strong>Tip:</strong> Gemini's free tier includes 15 requests per minute, perfect for this platform!
              </p>
            </div>
          </details>
        </div>
      `,
      [
        { 
          label: '💾 Save Configuration', 
          type: 'primary', 
          action: 'Admin.saveAIConfig()' 
        },
        { 
          label: 'Cancel', 
          type: 'secondary', 
          action: "Utils.closeModal('dynamicModal')" 
        }
      ]
    );
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  },

  async testAPIKey(provider) {
    const keyInput = document.getElementById(provider === 'gemini' ? 'geminiKey' : 'openaiKey');
    const key = keyInput?.value.trim();

    if (!key) {
      alert(`Please enter a ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key first`);
      return;
    }

    Utils.showLoading(`Testing ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} connection...`);

    try {
      if (provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
          { method: 'GET' }
        );

        Utils.hideLoading();

        if (response.ok) {
          Utils.showToast('✅ Gemini API key is valid!', 'success');
        } else {
          const error = await response.json();
          alert(`❌ Invalid Gemini API key: ${error.error?.message || 'Unknown error'}`);
        }
      } else {
        const response = await fetch(
          'https://api.openai.com/v1/models',
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${key}` }
          }
        );

        Utils.hideLoading();

        if (response.ok) {
          Utils.showToast('✅ OpenAI API key is valid!', 'success');
        } else {
          alert('❌ Invalid OpenAI API key');
        }
      }
    } catch (error) {
      Utils.hideLoading();
      alert(`❌ Connection failed: ${error.message}`);
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

    // Save to AIAnalytics
    AIAnalytics.setAPIKeys(geminiKey, openaiKey);
    AIAnalytics.setProvider(provider);

    Utils.closeModal('dynamicModal');
    Utils.showToast('✅ AI configuration saved successfully!', 'success');

    console.log('AI Config saved:', { provider, hasGemini: !!geminiKey, hasOpenAI: !!openaiKey });
  },

  // ==========================================
  // AI ANALYSIS RESULTS DISPLAY
  // ==========================================

  showAnalysisResults(analysis) {
    const { clusters, noise } = analysis.clustering || { clusters: [], noise: [] };

    const modalContent = `
      <div style="display: grid; gap: 24px;">
        <!-- Overall Assessment -->
        <div style="padding: 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15)); border-left: 4px solid #8b5cf6; border-radius: 12px;">
          <h3 style="color: #a78bfa; font-weight: 700; margin-bottom: 12px; font-size: 1.2rem;">
            📊 Overall Safety Assessment
          </h3>
          <p style="color: #e2e8f0; line-height: 1.7; font-size: 1rem;">
            ${analysis.overall_safety_assessment || 'Analysis completed with DBSCAN clustering'}
          </p>
        </div>

        <!-- Cluster Statistics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 20px; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 800; color: #60a5fa; margin-bottom: 8px;">
              ${clusters.length}
            </div>
            <div style="color: #cbd5e1; font-weight: 600;">Clusters Found</div>
            <div style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">Hotspot areas</div>
          </div>
          <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 800; color: #f87171; margin-bottom: 8px;">
              ${noise.length}
            </div>
            <div style="color: #cbd5e1; font-weight: 600;">Isolated Reports</div>
            <div style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">Scattered incidents</div>
          </div>
        </div>

        <!-- High Priority Areas -->
        ${analysis.high_priority_areas && analysis.high_priority_areas.length > 0 ? `
        <div>
          <h3 style="color: #ef4444; font-weight: 700; margin-bottom: 16px; font-size: 1.2rem;">
            🎯 High Priority Areas
          </h3>
          <div style="display: grid; gap: 12px;">
            ${analysis.high_priority_areas.map(area => `
              <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px;">
                <div style="font-weight: 700; color: #f87171; margin-bottom: 4px;">${area.area || 'Priority Area'}</div>
                <div style="color: #cbd5e1; font-size: 0.9rem;">${area.reason || area.priority_level || 'Requires attention'}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Cluster Details -->
        ${clusters.length > 0 ? `
        <div>
          <h3 style="color: #3b82f6; font-weight: 700; margin-bottom: 16px; font-size: 1.2rem;">
            📍 Cluster Details
          </h3>
          <div style="display: grid; gap: 12px; max-height: 400px; overflow-y: auto;">
            ${clusters.map((cluster, i) => `
              <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px;">
                  <div>
                    <div style="font-weight: 700; color: #60a5fa; font-size: 1.1rem; margin-bottom: 8px;">
                      Cluster ${i + 1}
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6;">
                      <div><strong>Reports:</strong> ${cluster.size}</div>
                      <div><strong>Severity:</strong> ${cluster.severity.toFixed(2)}</div>
                      <div><strong>Location:</strong> ${cluster.centroid.latitude.toFixed(4)}, ${cluster.centroid.longitude.toFixed(4)}</div>
                    </div>
                  </div>
                  <a 
                    href="https://www.google.com/maps?q=${cluster.centroid.latitude},${cluster.centroid.longitude}" 
                    target="_blank" 
                    rel="noopener"
                    style="padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.875rem; white-space: nowrap;"
                  >
                    📍 View on Map
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Resource Allocation -->
        ${analysis.resource_allocation && analysis.resource_allocation.length > 0 ? `
        <div>
          <h3 style="color: #f59e0b; font-weight: 700; margin-bottom: 16px; font-size: 1.2rem;">
            💡 Resource Allocation Recommendations
          </h3>
          <ul style="list-style: none; padding: 0; display: grid; gap: 8px;">
            ${analysis.resource_allocation.map(rec => `
              <li style="padding: 12px 16px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; border-radius: 6px; color: #cbd5e1;">
                • ${rec}
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        <!-- Analysis Metadata -->
        <div style="padding: 16px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; color: #94a3b8; font-size: 0.875rem;">
            <div><strong>Provider:</strong> ${analysis.provider || 'DBSCAN'}</div>
            <div><strong>Timestamp:</strong> ${new Date(analysis.timestamp).toLocaleString()}</div>
            <div><strong>Total Analyzed:</strong> ${analysis.clustering?.totalClustered || 0} reports</div>
          </div>
        </div>
      </div>
    `;

    Utils.createModal(
      '🤖 AI Analysis Results',
      modalContent,
      [
        { label: 'Close', type: 'primary', action: "Utils.closeModal('dynamicModal')" },
        { label: 'Export PDF', type: 'secondary', action: "Admin.exportAnalysisPDF()" }
      ]
    );
  },

  exportAnalysisPDF() {
    alert('PDF export feature coming soon! For now, use browser print (Ctrl/Cmd + P)');
    window.print();
  },

  // ==========================================
  // PROFILE MANAGEMENT (From previous version)
  // ==========================================

  showProfileManagement() {
    if (typeof ProfileManager === 'undefined') {
      alert('Profile Manager not loaded');
      return;
    }

    const profiles = ProfileManager.getAllProfiles();
    const stats = ProfileManager.getStatistics();

    const profilesList = profiles.length === 0 ? 
      '<div style="text-align: center; padding: 40px; color: #64748b;">No profiles created yet</div>' :
      profiles.map(profile => this.createProfileCard(profile)).join('');

    Utils.createModal(
      '👥 Profile Management',
      `
        <div style="display: grid; gap: 24px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 8px; text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${stats.total}</div>
              <div style="color: #cbd5e1; font-size: 0.875rem;">Total</div>
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

          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <h3 style="font-size: 1.25rem; font-weight: 700;">All Profiles</h3>
              <button onclick="Admin.createProfileModal()" style="padding: 8px 16px; background: #22c55e; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                ➕ Add Profile
              </button>
            </div>
            <div style="display: grid; gap: 12px; max-height: 400px; overflow-y: auto;">
              ${profilesList}
            </div>
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
    const colors = roleColors[profile.role];

    return `
      <div style="padding: 16px; background: var(--bg-primary); border: 2px solid var(--bg-tertiary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 12px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
              <div style="font-weight: 700; font-size: 1.1rem; color: #f1f5f9;">${profile.fullName}</div>
              <span style="padding: 4px 10px; background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 12px; color: ${colors.text}; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                ${profile.role}
              </span>
              ${profile.isActive ? 
                '<span style="padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; border-radius: 12px; color: #22c55e; font-size: 0.75rem;">Active</span>' :
                '<span style="padding: 4px 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; color: #ef4444; font-size: 0.75rem;">Inactive</span>'
              }
            </div>
            <div style="color: #94a3b8; font-size: 0.875rem;">
              <div><strong>Username:</strong> ${profile.username}</div>
              ${profile.email ? `<div><strong>Email:</strong> ${profile.email}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="alert('Edit feature: Use profile management system')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Edit</button>
            <button onclick="alert('Toggle feature: Use profile management system')" style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
              ${profile.isActive ? 'Disable' : 'Enable'}
            </button>
            <button onclick="if(confirm('Delete profile?')) alert('Delete feature: Use profile management system')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">Delete</button>
          </div>
        </div>
      </div>
    `;
  },

  createProfileModal() {
    alert('Profile creation: Please use the updated ProfileManager system from previous implementation');
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Admin.init());
} else {
  Admin.init();
}