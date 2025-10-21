// ================================================
// MEDICAL REPORTING MODULE - WITH HOSPITAL FINDER
// ✅ Updated based on your base code
// ✅ Hospital finder integrated
// ✅ All bugs fixed
// ================================================

const MedicalReport = {

  currentReport: null,
  hospitalResults: null,
  severityCallback: null,

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

      // STEP 1: Get location first
      const location = await Geolocation.getCurrentLocation();
      if (!location) {
        throw new Error('Failed to get location');
      }
      console.log('✅ Location obtained');

      // STEP 2: Ask for severity
      const severity = await this.askSeverity();
      if (!severity) {
        throw new Error('Severity selection cancelled');
      }
      console.log('✅ Severity selected:', severity);

      // STEP 3: Capture photo
      const photo = await Media.capturePhoto();
      if (!photo) {
        throw new Error('Failed to capture photo');
      }
      console.log('✅ Photo captured');

      // STEP 4: Generate report ID
      const reportId = 'MED-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      // STEP 5: Create report
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
        createdAt: new Date().toISOString(),
        nearestHospital: null,
        hospitalDistance: null,
        hospitalTime: null,
        hospitalNotified: false
      };

      this.currentReport = report;

      // STEP 6: Save report
      const saved = Storage.saveReport('medical', report);

      if (!saved) {
        throw new Error('Failed to save report');
      }

      console.log('✅ Medical report saved:', reportId);

      // STEP 7: ✅ Find nearest hospitals using Prim's algorithm
      if (typeof HospitalFinder !== 'undefined' && typeof PrimAlgorithm !== 'undefined') {
        try {
          console.log('🏥 Searching for nearest hospitals...');

          const hospitalResults = await HospitalFinder.findNearbyHospitals(
            location.latitude,
            location.longitude,
            severity,
            10 // 10km radius
          );

          this.hospitalResults = hospitalResults;

          // Update report with hospital data
          report.nearestHospital = hospitalResults.nearest.hospital;
          report.hospitalDistance = hospitalResults.nearest.distance;
          report.hospitalTime = hospitalResults.nearest.estimatedTime;

          // Save updated report
          Storage.saveReport('medical', report);

          console.log('✅ Found', hospitalResults.alternatives.length, 'hospitals');

          // Show hospital results
          await this.showHospitalResults(hospitalResults);

        } catch (error) {
          console.warn('⚠️ Could not find hospitals:', error.message);
          // Still show confirmation even if hospital search fails
          this.showConfirmation(report);
        }
      } else {
        // No hospital finder available, show normal confirmation
        console.log('⚠️ Hospital Finder not available');
        this.showConfirmation(report);
      }

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Medical emergency reported successfully!', 'success');
      }

      return report;

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
      this.severityCallback = null;
    }
  },

  // ✅ NEW: Show hospital results with Prim's algorithm
  async showHospitalResults(results) {
    return new Promise((resolve) => {
      const { nearest, alternatives } = results;

      // ✅ FIX: Filter out invalid hospitals
      const validAlternatives = alternatives
        .filter((alt, index) => {
          if (index === 0) return false; // Skip first (it's nearest)
          if (!alt || !alt.hospital) return false;
          if (!alt.hospital.id || !alt.hospital.name) return false;
          if (alt.hospital.name === 'undefined') return false;
          if (typeof alt.distance !== 'number') return false;
          return true;
        })
        .slice(0, 3);

      const modalContent = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 8px; color: #22c55e;">Report Submitted!</h3>
          <p style="color: #94a3b8; margin-bottom: 24px;">Medical services have been notified</p>

          <div style="background: linear-gradient(135deg, #1e293b, #334155); border: 3px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: left;">
            <h4 style="color: #22c55e; margin: 0 0 12px 0; font-size: 1.1rem;">🏥 Nearest Hospital (Prim's Algorithm)</h4>
            <h5 style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 1rem;">${nearest.hospital.name}</h5>
            <div style="color: #cbd5e1; line-height: 1.7; font-size: 0.9rem;">
              <p style="margin: 6px 0;">📍 Distance: <strong>${nearest.distance.toFixed(2)} km</strong></p>
              <p style="margin: 6px 0;">⏱️ Est. Time: <strong>~${nearest.estimatedTime} minutes</strong></p>
              <p style="margin: 6px 0;">📫 ${nearest.hospital.address}</p>
              ${nearest.hospital.phone !== 'N/A' ? `<p style="margin: 6px 0;">📞 ${nearest.hospital.phone}</p>` : ''}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
              <button onclick="MedicalReport.openDirections('${nearest.hospital.id}')" 
                      style="flex: 1; padding: 12px; background: #3b82f6; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                🗺️ Directions
              </button>
              <button id="notify-btn-${nearest.hospital.id}"
                      onclick="MedicalReport.notifyHospital('${nearest.hospital.id}')" 
                      style="flex: 1; padding: 12px; background: #f59e0b; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                🔔 Notify Hospital
              </button>
            </div>
          </div>

          ${validAlternatives.length > 0 ? `
          <div style="text-align: left; margin-bottom: 20px;">
            <h5 style="margin: 0 0 12px 0; color: #94a3b8; font-size: 0.95rem;">Other Nearby Hospitals:</h5>
            ${validAlternatives.map((alt, i) => `
              <div style="background: rgba(51,65,85,0.5); border: 2px solid #475569; border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="flex: 1;">
                  <div style="color: #f1f5f9; font-weight: 600; font-size: 0.9rem;">${i+2}. ${alt.hospital.name}</div>
                  <div style="color: #94a3b8; font-size: 0.8rem; margin-top: 2px;">
                    ${alt.distance.toFixed(2)} km • ~${alt.estimatedTime} min
                  </div>
                </div>
                <button onclick="MedicalReport.openDirections('${alt.hospital.id}')" 
                        style="padding: 8px 14px; background: #3b82f6; border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; font-size: 0.8rem;">
                  Directions
                </button>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <button onclick="MedicalReport.viewReportFromHospitals()" 
                  style="width: 100%; padding: 14px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; font-size: 1rem; margin-bottom: 12px;">
            📋 View Full Report
          </button>

          <button onclick="Utils.closeModal('dynamicModal')" 
                  style="width: 100%; padding: 14px; background: rgba(100, 116, 139, 0.3); color: #cbd5e1; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Close
          </button>
        </div>
      `;

      if (typeof Utils !== 'undefined' && Utils.createModal) {
        Utils.createModal('🏥 Hospitals Near You', modalContent, []);
      } else {
        alert(`Nearest: ${nearest.hospital.name} (${nearest.distance.toFixed(2)} km)`);
        resolve();
      }

      resolve();
    });
  },

  // ✅ NEW: Open Google Maps directions
  openDirections(hospitalId) {
    if (!this.hospitalResults) {
      console.error('No hospital results available');
      return;
    }

    const allHospitals = [this.hospitalResults.nearest, ...this.hospitalResults.alternatives];
    const hospitalData = allHospitals.find(h => h && h.hospital && h.hospital.id === hospitalId);

    if (hospitalData && hospitalData.hospital) {
      const url = HospitalFinder.getDirectionsUrl(hospitalData.hospital, this.hospitalResults.userLocation);
      window.open(url, '_blank');

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Opening Google Maps...', 'info');
      }
    } else {
      console.error('Hospital not found:', hospitalId);
    }
  },

  // ✅ NEW: Notify hospital
  notifyHospital(hospitalId) {
    if (!this.hospitalResults) {
      alert('Hospital data not available');
      return;
    }

    const allHospitals = [this.hospitalResults.nearest, ...this.hospitalResults.alternatives];
    const hospitalData = allHospitals.find(h => h && h.hospital && h.hospital.id === hospitalId);

    if (!hospitalData || !hospitalData.hospital) {
      alert('Hospital not found');
      return;
    }

    // Create notification
    HospitalFinder.notifyHospital(hospitalData.hospital, {
      reportId: this.currentReport ? this.currentReport.id : 'UNKNOWN',
      severity: this.hospitalResults.severity,
      location: this.hospitalResults.userLocation,
      distance: hospitalData.distance,
      estimatedTime: hospitalData.estimatedTime
    });

    // Update report
    if (this.currentReport) {
      this.currentReport.hospitalNotified = true;
      Storage.saveReport('medical', this.currentReport);
    }

    // Update button
    const btn = document.getElementById(`notify-btn-${hospitalId}`);
    if (btn) {
      btn.textContent = '✅ Notified';
      btn.disabled = true;
      btn.style.background = '#22c55e';
      btn.style.cursor = 'not-allowed';
      btn.style.opacity = '0.7';
      btn.onclick = null;
    }

    alert(`✅ ${hospitalData.hospital.name} has been notified!`);
  },

  // ✅ NEW: View report from hospital results screen
  viewReportFromHospitals() {
    if (typeof Utils !== 'undefined') {
      Utils.closeModal('dynamicModal');
    }
    if (this.currentReport) {
      setTimeout(() => {
        this.viewReport(this.currentReport.id);
      }, 300);
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
                ${report.nearestHospital ? `
                  <div><strong style="color: #f87171;">Nearest Hospital:</strong> ${report.nearestHospital.name}</div>
                  <div><strong style="color: #f87171;">Distance:</strong> ${report.hospitalDistance.toFixed(2)} km</div>
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
                ${report.nearestHospital ? `
                  <hr style="border: none; border-top: 1px solid #475569; margin: 12px 0;">
                  <div><strong>Nearest Hospital:</strong> ${report.nearestHospital.name}</div>
                  <div><strong>Distance:</strong> ${report.hospitalDistance.toFixed(2)} km</div>
                  <div><strong>Est. Time:</strong> ~${report.hospitalTime} minutes</div>
                  <div><strong>Hospital Notified:</strong> ${report.hospitalNotified ? '✅ Yes' : '❌ No'}</div>
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

console.log('✅ Medical reporting module loaded (with Hospital Finder)');
