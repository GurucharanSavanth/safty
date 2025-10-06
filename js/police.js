// ================================================
// POLICE REPORTING MODULE - COMPLETE & FIXED
// ================================================

const PoliceReport = {
  async capture() {
    try {
      console.log('🚔 Starting police report...');

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

      // Get location
      const location = await Geolocation.getCurrentLocation();
      if (!location) {
        throw new Error('Failed to get location');
      }

      // Capture photo
      const photo = await Media.capturePhoto();
      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Generate report ID
      const reportId = 'POL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // Create report
      const report = {
        id: reportId,
        type: 'police',
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
      const saved = Storage.saveReport('police', report);
      
      if (saved) {
        console.log('✅ Police report saved:', reportId);
        
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Police report submitted successfully!', 'success');
        } else {
          alert('Police report submitted successfully!');
        }

        // Show confirmation
        this.showConfirmation(report);
        
        return report;
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      console.error('❌ Police report error:', error);
      
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Failed to submit report: ' + error.message, 'error');
      } else {
        alert('Failed to submit report: ' + error.message);
      }
      
      return null;
    }
  },

  showConfirmation(report) {
    try {
      if (typeof Utils === 'undefined' || !Utils.createModal) {
        // Fallback to simple alert
        alert(`Police Report Submitted!\n\nReport ID: ${report.id}\nStatus: Pending\n\nThank you for helping keep our community safe.`);
        return;
      }

      Utils.createModal(
        '✅ Police Report Submitted',
        `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🚔</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: #22c55e;">Report Submitted Successfully!</h3>
            
            <div style="background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: left;">
              <div style="display: grid; gap: 12px; color: #cbd5e1;">
                <div><strong style="color: #60a5fa;">Report ID:</strong> ${report.id}</div>
                <div><strong style="color: #60a5fa;">Type:</strong> Police Incident</div>
                <div><strong style="color: #60a5fa;">Status:</strong> Pending</div>
                <div><strong style="color: #60a5fa;">Time:</strong> ${report.timestamp.full}</div>
                ${report.location.isReal ? `
                  <div><strong style="color: #60a5fa;">Location:</strong> ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}</div>
                ` : ''}
              </div>
            </div>

            <p style="color: #94a3b8; margin-bottom: 24px;">
              Your report has been recorded. Police authorities will review it shortly.
            </p>

            <div style="padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
              <p style="color: #22c55e; font-weight: 600;">
                🎉 Thank you for helping keep our community safe!
              </p>
            </div>
          </div>
        `,
        [
          { label: 'View Report', type: 'primary', action: `PoliceReport.viewReport('${report.id}')` },
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

      const report = Storage.getReportById('police', reportId);
      if (!report) {
        alert('Report not found');
        return;
      }

      if (typeof Utils === 'undefined' || !Utils.createModal) {
        alert(`Report ID: ${report.id}\nStatus: ${report.status}\nTime: ${report.timestamp.full}`);
        return;
      }

      Utils.closeModal('dynamicModal');

      Utils.createModal(
        `Police Report: ${report.id}`,
        `
          <div style="display: grid; gap: 16px;">
            ${report.photo ? `
              <img src="${report.photo}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 12px; border: 2px solid var(--bg-tertiary);">
            ` : ''}
            
            <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px;">
              <div style="font-weight: 700; font-size: 1.1rem; color: #60a5fa; margin-bottom: 12px;">Police Incident Report</div>
              <div style="display: grid; gap: 8px; color: #cbd5e1;">
                <div><strong>Report ID:</strong> ${report.id}</div>
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

            <div style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
              <p style="color: #fbbf24; font-size: 0.875rem;">
                <strong>Note:</strong> This is a citizen-reported incident. Police authorities have been notified.
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
window.PoliceReport = PoliceReport;

console.log('✅ Police reporting module loaded');
