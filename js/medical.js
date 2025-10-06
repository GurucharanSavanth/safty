// ================================================
// MEDICAL REPORTING MODULE - COMPLETE & FIXED
// ================================================

const MedicalReport = {
  async capture() {
    try {
      console.log('🚑 Starting medical report...');

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

      // Ask for severity
      const severity = await this.askSeverity();
      if (!severity) {
        throw new Error('Severity selection cancelled');
      }

      // Capture photo
      const photo = await Media.capturePhoto();
      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Generate report ID
      const reportId = 'MED-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Create report
      const report = {
        id: reportId,
        type: 'medical',
        severity: severity,
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
      const saved = Storage.saveReport('medical', report);
      
      if (saved) {
        console.log('✅ Medical report saved:', reportId);
        
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Medical emergency reported successfully!', 'success');
        } else {
          alert('Medical emergency reported successfully!');
        }

        // Show confirmation
        this.showConfirmation(report);
        
        return report;
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      console.error('❌ Medical report error:', error);
      
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Failed to submit report: ' + error.message, 'error');
      } else {
        alert('Failed to submit report: ' + error.message);
      }
      
      return null;
    }
  },

  askSeverity() {
    return new Promise((resolve) => {
      if (typeof Utils === 'undefined' || !Utils.createModal) {
        const severity = confirm('Is this a high severity emergency?') ? 'high' : 'low';
        resolve(severity);
        return;
      }

      Utils.createModal(
        '🚑 Medical Emergency Severity',
        `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🚑</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 24px;">How severe is the medical emergency?</h3>
            
            <div style="display: grid; gap: 16px;">
              <button onclick="MedicalReport.selectSeverity('high')" style="padding: 20px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s;">
                🔴 HIGH SEVERITY
                <div style="font-size: 0.875rem; font-weight: 400; margin-top: 8px;">Life-threatening emergency requiring immediate attention</div>
              </button>
              
              <button onclick="MedicalReport.selectSeverity('low')" style="padding: 20px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s;">
                🟡 LOW SEVERITY
                <div style="font-size: 0.875rem; font-weight: 400; margin-top: 8px;">Non-critical medical situation requiring assistance</div>
              </button>
            </div>

            <button onclick="Utils.closeModal('dynamicModal'); MedicalReport.severityCallback(null)" style="margin-top: 16px; padding: 10px 20px; background: rgba(100, 116, 139, 0.3); color: #cbd5e1; border: none; border-radius: 8px; cursor: pointer;">
              Cancel
            </button>
          </div>
        `,
        []
      );

      this.severityCallback = resolve;
    });
  },

  selectSeverity(severity) {
    if (typeof Utils !== 'undefined') {
      Utils.closeModal('dynamicModal');
    }
    if (this.severityCallback) {
      this.severityCallback(severity);
    }
  },

  showConfirmation(report) {
    try {
      if (typeof Utils === 'undefined' || !Utils.createModal) {
        alert(`Medical Report Submitted!\n\nReport ID: ${report.id}\nSeverity: ${report.severity}\nStatus: Pending\n\nMedical assistance has been alerted.`);
        return;
      }

      const severityColor = report.severity === 'high' ? '#ef4444' : '#f59e0b';
      const severityLabel = report.severity === 'high' ? 'HIGH SEVERITY' : 'LOW SEVERITY';

      Utils.createModal(
        '✅ Medical Emergency Reported',
        `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🚑</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: #22c55e;">Emergency Report Submitted!</h3>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 2px solid ${severityColor}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;">
              <div style="display: grid; gap: 12px; color: #cbd5e1;">
                <div><strong style="color: #f87171;">Report ID:</strong> ${report.id}</div>
                <div><strong style="color: #f87171;">Type:</strong> Medical Emergency</div>
                <div>
                  <strong style="color: #f87171;">Severity:</strong> 
                  <span style="padding: 4px 10px; background: rgba(${report.severity === 'high' ? '239, 68, 68' : '245, 158, 11'}, 0.2); border: 1px solid ${severityColor}; border-radius: 12px; color: ${severityColor}; font-weight: 700; margin-left: 8px;">
                    ${severityLabel}
                  </span>
                </div>
                <div><strong style="color: #f87171;">Status:</strong> Pending</div>
                <div><strong style="color: #f87171;">Time:</strong> ${report.timestamp.full}</div>
                ${report.location.isReal ? `
                  <div><strong style="color: #f87171;">Location:</strong> ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}</div>
                ` : ''}
              </div>
            </div>

            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #22c55e; font-weight: 600;">
                🚑 Medical assistance has been alerted!
              </p>
            </div>

            ${report.severity === 'high' ? `
              <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                <p style="color: #ef4444; font-weight: 600;">
                  ⚠️ HIGH PRIORITY: Emergency services are being dispatched immediately
                </p>
              </div>
            ` : ''}
          </div>
        `,
        [
          { label: 'View Report', type: 'primary', action: `MedicalReport.viewReport('${report.id}')` },
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

      const report = Storage.getReportById('medical', reportId);
      if (!report) {
        alert('Report not found');
        return;
      }

      if (typeof Utils === 'undefined' || !Utils.createModal) {
        alert(`Report ID: ${report.id}\nSeverity: ${report.severity}\nStatus: ${report.status}\nTime: ${report.timestamp.full}`);
        return;
      }

      Utils.closeModal('dynamicModal');

      const severityColor = report.severity === 'high' ? '#ef4444' : '#f59e0b';

      Utils.createModal(
        `Medical Report: ${report.id}`,
        `
          <div style="display: grid; gap: 16px;">
            ${report.photo ? `
              <img src="${report.photo}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 12px; border: 2px solid var(--bg-tertiary);">
            ` : ''}
            
            <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid ${severityColor}; border-radius: 8px;">
              <div style="font-weight: 700; font-size: 1.1rem; color: #f87171; margin-bottom: 12px;">Medical Emergency Report</div>
              <div style="display: grid; gap: 8px; color: #cbd5e1;">
                <div><strong>Report ID:</strong> ${report.id}</div>
                <div><strong>Severity:</strong> <span style="color: ${severityColor}; text-transform: uppercase; font-weight: 700;">${report.severity}</span></div>
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
                <strong>Note:</strong> Medical services have been notified. Help is on the way.
              </p>
            </div>
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
window.MedicalReport = MedicalReport;

console.log('✅ Medical reporting module loaded');
