// ================================================
// ADMIN MODULE - COMPLETE WITH AI INTEGRATION
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

    if (!adminLoginBtn || !adminLoginModal) return;

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

  login() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
      this.showLoginError('Enter username and password');
      return;
    }

    if (username === this.credentials.username && password === this.credentials.password) {
      this.isLoggedIn = true;
      Utils.showToast('Login successful!', 'success');
      this.closeLoginModal();
      setTimeout(() => this.openDashboard(), 500);
    } else {
      this.showLoginError('Invalid credentials');
      const form = document.getElementById('adminLoginForm');
      if (form) {
        form.style.animation = 'shake 0.5s';
        setTimeout(() => form.style.animation = '', 500);
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
        this.createInlineDashboard();
      }
    } catch (error) {
      this.createInlineDashboard();
    }
  },

  createInlineDashboard() {
    const police = Storage.getAllReports('police');
    const medical = Storage.getAllReports('medical');
    const infrastructure = Storage.getAllReports('infrastructure');
    const all = [...police, ...medical, ...infrastructure].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    const stats = Storage.getStatistics();

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
    const color = colors[report.type];
    const icon = icons[report.type];

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
          <span style="padding: 4px 12px; background: rgba(${color === '#3b82f6' ? '59,130,246' : color === '#ef4444' ? '239,68,68' : '245,158,11'}, 0.2); border: 1px solid ${color}; border-radius: 20px; color: ${color}; font-size: 0.75rem; text-transform: uppercase;">${report.status}</span>
        </div>
        <div style="color: #cbd5e1; font-size: 0.875rem;">
          <div><strong>Date:</strong> ${report.timestamp?.full || 'N/A'}</div>
          <div><strong>Location:</strong> ${report.location?.isReal ? 
            `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}` : 
            'Not provided'}</div>
        </div>
        ${report.photo ? `<img src="${report.photo}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-top: 12px; cursor: pointer;" onclick="window.open(this.src)">` : ''}
      </div>
    `;
  },

  runAIAnalysis() {
    if (typeof AIAnalytics === 'undefined') {
      alert('AI Analytics module not loaded');
      return;
    }

    const all = [
      ...Storage.getAllReports('police'),
      ...Storage.getAllReports('medical'),
      ...Storage.getAllReports('infrastructure')
    ];

    if (all.length === 0) {
      alert('No reports to analyze');
      return;
    }

    Utils.showLoading('Running AI analysis with DBSCAN clustering...');

    setTimeout(async () => {
      try {
        const analysis = await AIAnalytics.analyzeAllReports(all);
        Utils.hideLoading();
        this.showAnalysisResults(analysis);
      } catch (error) {
        Utils.hideLoading();
        alert('AI Analysis failed: ' + error.message);
      }
    }, 500);
  },

  showAnalysisResults(analysis) {
    const { clusters, noise } = analysis.clustering;
    
    const modal = Utils.createModal(
      '🤖 AI Analysis Results',
      `
        <div style="display: grid; gap: 24px;">
          <div style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; border-radius: 8px;">
            <h3 style="color: #a78bfa; font-weight: 700; margin-bottom: 12px;">Overall Assessment</h3>
            <p style="color: #cbd5e1; line-height: 1.6;">${analysis.overall_safety_assessment}</p>
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

const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }';
document.head.appendChild(shakeStyle);
