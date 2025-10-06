// ================================================
// INFRASTRUCTURE REPORTING MODULE - COMPLETE & FIXED
// ================================================

const InfrastructureReport = {
  async capture() {
    try {
      console.log('🏗️ Starting infrastructure report...');

      // Check dependencies
      if (typeof Media === 'undefined') {
        throw new Error('Media module not loaded');
      }
      if (typeof Geolocation === 'undefined') {
        throw new Error('Geolocation module not loaded');
      }
      if (typeof Storage === 'undefined') {
        throw new Error('Storage module not loaded');
      }

      // Get location first
      const location = await Geolocation.getCurrentLocation();
      if (!location) {
        throw new Error('Failed to get location');
      }

      // Ask for problem type
      const problem = await this.askProblemType();
      if (!problem) {
        throw new Error('Problem type selection cancelled');
      }

      // Capture photo
      const photo = await Media.capturePhoto();
      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Generate report ID
      const reportId = 'INF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Create report
      const report = {
        id: reportId,
        type: 'infrastructure',
        problem: problem,
        timestamp: Utils.formatDate ? Utils.formatDate(new Date()) : { 
          full: new Date().toLocaleString(),
          iso: new Date().toISOString()
        },
        location: location,
        photo: photo,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Save report
      const saved = Storage.saveReport('infrastructure', report);
      
      if (saved) {
        console.log('✅ Infrastructure report saved:', reportId);
        
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Infrastructure issue reported successfully!', 'success');
        } else {
          alert('Infrastructure issue reported successfully!');
        }

        // Show confirmation
        this.showConfirmation(report);
        
        return report;
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      console.error('❌ Infrastructure report error:', error);
      
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Failed to submit report: ' + error.message, 'error');
      } else {
        alert('Failed to submit report: ' + error.message);
      }
      
      return null;
    }
  },

  askProblemType() {
    return new Promise((resolve) => {
      if (typeof Utils === 'undefined' || !Utils.createModal) {
        const problemTypes = ['Road Damage', 'Broken Streetlight', 'Water Leakage', 'Garbage Overflow', 'Other'];
        const problem = prompt('Select problem type:\n1. Road Damage\n2. Broken Streetlight\n3. Water Leakage\n4. Garbage Overflow\n5. Other\n\nEnter number (1-5):');
        const index = parseInt(problem) - 1;
        resolve(index >= 0 && index < 5 ? { type: problemTypes[index], escalation: 'medium' } : null);
        return;
      }

      Utils.createModal(
        '🏗️ Infrastructure Problem Type',
        `
          <div style="padding: 20px;">
            <div style="text-align: center; font-size: 4rem; margin-bottom: 20px;">🏗️</div>
            <h3 style="text-align: center; font-size: 1.5rem; margin-bottom: 24px;">What type of infrastructure problem?</h3>
            
            <div style="display: grid; gap: 12px;">
              <button onclick="InfrastructureReport.selectProblem('Road Damage', 'high')" style="padding: 16px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); border: 2px solid #ef4444; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">🚧</span>
                  <div>
                    <div style="font-size: 1.05rem;">Road Damage / Potholes</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Damaged roads, potholes, broken pavement</div>
                  </div>
                </div>
              </button>

              <button onclick="InfrastructureReport.selectProblem('Broken Streetlight', 'medium')" style="padding: 16px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)); border: 2px solid #f59e0b; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">💡</span>
                  <div>
                    <div style="font-size: 1.05rem;">Broken Streetlight</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Non-functional or damaged streetlights</div>
                  </div>
                </div>
              </button>

              <button onclick="InfrastructureReport.selectProblem('Water Leakage', 'high')" style="padding: 16px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)); border: 2px solid #3b82f6; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">💧</span>
                  <div>
                    <div style="font-size: 1.05rem;">Water Leakage / Pipeline</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Burst pipes, water leaks, drainage issues</div>
                  </div>
                </div>
              </button>

              <button onclick="InfrastructureReport.selectProblem('Garbage Overflow', 'medium')" style="padding: 16px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); border: 2px solid #22c55e; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">🗑️</span>
                  <div>
                    <div style="font-size: 1.05rem;">Garbage Overflow / Waste</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Overflowing bins, waste management issues</div>
                  </div>
                </div>
              </button>

              <button onclick="InfrastructureReport.selectProblem('Electricity Issue', 'high')" style="padding: 16px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05)); border: 2px solid #fbbf24; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">⚡</span>
                  <div>
                    <div style="font-size: 1.05rem;">Electricity / Power Issue</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Power outage, exposed wires, transformer issues</div>
                  </div>
                </div>
              </button>

              <button onclick="InfrastructureReport.selectProblem('Other', 'low')" style="padding: 16px; background: linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05)); border: 2px solid #64748b; border-radius: 10px; color: #f1f5f9; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 1.5rem;">📋</span>
                  <div>
                    <div style="font-size: 1.05rem;">Other Infrastructure Issue</div>
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-top: 4px;">Any other municipal or infrastructure problem</div>
                  </div>
                </div>
              </button>
            </div>

            <button onclick="Utils.closeModal('dynamicModal'); InfrastructureReport.problemCallback(null)" style="margin-top: 16px; padding: 10px 20px; background: rgba(100, 116, 139, 0.3); color: #cbd5e1; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
              Cancel
            </button>
          </div>

          <style>
            button:hover {
              transform: translateX(4px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
          </style>
        `,
        []
      );

      this.problemCallback = resolve;
    });
  },

  selectProblem(type, escalation) {
    if (typeof Utils !== 'undefined') {
      Utils.closeModal('dynamicModal');
    }
    if (this.problemCallback) {
      this.problemCallback({ type, escalation });
    }
  },

  showConfirmation(report) {
    try {
      if (typeof Utils === 'undefined' || !Utils.createModal) {
        alert(`Infrastructure Report Submitted!\n\nReport ID: ${report.id}\nProblem: ${report.problem.type}\nStatus: Pending\n\nBBMP has been notified.`);
        return;
      }

      const escalationColor = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#64748b'
      }[report.problem.escalation] || '#64748b';

      const escalationLabel = {
        high: 'HIGH PRIORITY',
        medium: 'MEDIUM PRIORITY',
        low: 'LOW PRIORITY'
      }[report.problem.escalation] || 'MEDIUM';

      Utils.createModal(
        '✅ Infrastructure Issue Reported',
        `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🏗️</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: #22c55e;">Report Submitted Successfully!</h3>
            
            <div style="background: rgba(245, 158, 11, 0.1); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;">
              <div style="display: grid; gap: 12px; color: #cbd5e1;">
                <div><strong style="color: #fbbf24;">Report ID:</strong> ${report.id}</div>
                <div><strong style="color: #fbbf24;">Category:</strong> Infrastructure / BBMP</div>
                <div><strong style="color: #fbbf24;">Problem Type:</strong> ${report.problem.type}</div>
                <div>
                  <strong style="color: #fbbf24;">Priority:</strong> 
                  <span style="padding: 4px 10px; background: rgba(${
                    report.problem.escalation === 'high' ? '239, 68, 68' : 
                    report.problem.escalation === 'medium' ? '245, 158, 11' : '100, 116, 139'
                  }, 0.2); border: 1px solid ${escalationColor}; border-radius: 12px; color: ${escalationColor}; font-weight: 700; margin-left: 8px;">
                    ${escalationLabel}
                  </span>
                </div>
                <div><strong style="color: #fbbf24;">Status:</strong> Pending</div>
                <div><strong style="color: #fbbf24;">Time:</strong> ${report.timestamp.full}</div>
                ${report.location.isReal ? `
                  <div><strong style="color: #fbbf24;">Location:</strong> ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}</div>
                ` : ''}
              </div>
            </div>

            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #22c55e; font-weight: 600;">
                🏢 BBMP officials have been notified!
              </p>
            </div>

            ${report.problem.escalation === 'high' ? `
              <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                <p style="color: #ef4444; font-weight: 600;">
                  ⚠️ HIGH PRIORITY: This issue will be addressed urgently
                </p>
              </div>
            ` : ''}

            <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; margin-top: 16px;">
              <p style="color: #60a5fa; font-size: 0.875rem;">
                <strong>Track Progress:</strong> Use your Report ID to track the resolution status
              </p>
            </div>
          </div>
        `,
        [
          { label: 'View Report', type: 'primary', action: `InfrastructureReport.viewReport('${report.id}')` },
          { label: 'Close', type: 'secondary', action: "Utils.closeModal('dynamicModal')" }
        ]
      );
    } catch (error) {
      console.error('Show confirmation error:', error);
    }
  },

  viewReport(reportId) {
    try {
      if (typeof Storage === 'undefined') {
        alert('Storage module not loaded');
        return;
      }

      const report = Storage.getReportById('infrastructure', reportId);
      if (!report) {
        alert('Report not found');
        return;
      }

      if (typeof Utils === 'undefined' || !Utils.createModal) {
        alert(`Report ID: ${report.id}\nProblem: ${report.problem.type}\nPriority: ${report.problem.escalation}\nStatus: ${report.status}\nTime: ${report.timestamp.full}`);
        return;
      }

      Utils.closeModal('dynamicModal');

      const escalationColor = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#64748b'
      }[report.problem.escalation] || '#f59e0b';

      Utils.createModal(
        `Infrastructure Report: ${report.id}`,
        `
          <div style="display: grid; gap: 16px;">
            ${report.photo ? `
              <img src="${report.photo}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 12px; border: 2px solid var(--bg-tertiary);">
            ` : ''}
            
            <div style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid ${escalationColor}; border-radius: 8px;">
              <div style="font-weight: 700; font-size: 1.1rem; color: #fbbf24; margin-bottom: 12px;">Infrastructure Issue Report</div>
              <div style="display: grid; gap: 8px; color: #cbd5e1;">
                <div><strong>Report ID:</strong> ${report.id}</div>
                <div><strong>Problem Type:</strong> ${report.problem.type}</div>
                <div><strong>Priority:</strong> <span style="color: ${escalationColor}; text-transform: uppercase; font-weight: 700;">${report.problem.escalation}</span></div>
                <div><strong>Status:</strong> <span style="text-transform: capitalize; color: ${
                  report.status === 'resolved' ? '#22c55e' : 
                  report.status === 'in-progress' ? '#f59e0b' : '#ef4444'
                };">${report.status || 'pending'}</span></div>
                <div><strong>Submitted:</strong> ${report.timestamp.full}</div>
                ${report.location.isReal ? `
                  <div><strong>Location:</strong> ${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}</div>
                  <div>
                    <a href="https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                      📍 View on Google Maps →
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>

            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
              <p style="color: #22c55e; font-size: 0.875rem;">
                <strong>Note:</strong> BBMP officials have been notified and will address this issue soon.
              </p>
            </div>

            ${report.problem.escalation === 'high' ? `
              <div style="padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                <p style="color: #ef4444; font-size: 0.875rem;">
                  <strong>⚠️ High Priority:</strong> This issue is being expedited for urgent resolution.
                </p>
              </div>
            ` : ''}
          </div>
        `,
        [
          { label: 'Close', type: 'primary', action: "Utils.closeModal('dynamicModal')" }
        ]
      );
    } catch (error) {
      console.error('View report error:', error);
      alert('Failed to view report');
    }
  }
};

// Make available globally
window.InfrastructureReport = InfrastructureReport;

console.log('✅ Infrastructure reporting module loaded');
