// ================================================
// STORAGE MODULE - BULLETPROOF VERSION
// ================================================

const Storage = {
  
  // Initialize storage (called automatically)
  initialize() {
    try {
      console.log('🗄️ Storage: Initializing...');

      // Test localStorage access
      if (typeof localStorage === 'undefined') {
        console.error('❌ localStorage not available');
        return false;
      }

      // Test write capability
      try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
      } catch (e) {
        console.error('❌ localStorage not writable:', e);
        return false;
      }

      // Initialize each storage key
      const types = ['police', 'medical', 'infrastructure'];
      types.forEach(type => {
        const key = `reports_${type}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify([]));
          console.log(`✓ Initialized ${type} storage`);
        } else {
          const count = JSON.parse(localStorage.getItem(key)).length;
          console.log(`✓ Found ${count} existing ${type} reports`);
        }
      });

      console.log('✅ Storage initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Storage initialization error:', error);
      return false;
    }
  },

  // Save report with extensive logging
  saveReport(reportType, reportData) {
    try {
      console.log('💾 Storage: Attempting to save report...');
      console.log('  Type:', reportType);
      console.log('  Report ID:', reportData?.id);

      // Validate type
      if (!['police', 'medical', 'infrastructure'].includes(reportType)) {
        console.error('❌ Invalid report type:', reportType);
        return false;
      }

      // Validate data
      if (!reportData || !reportData.id) {
        console.error('❌ Invalid report data - missing ID');
        return false;
      }

      // Get existing reports
      const key = `reports_${reportType}`;
      const existingData = localStorage.getItem(key);
      console.log('  Existing data:', existingData ? 'Found' : 'Not found');
      
      let reports = [];
      if (existingData) {
        try {
          reports = JSON.parse(existingData);
          if (!Array.isArray(reports)) {
            console.warn('⚠️ Existing data not array, resetting');
            reports = [];
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse existing data, resetting');
          reports = [];
        }
      }

      console.log('  Current report count:', reports.length);

      // Check for duplicates
      if (reports.find(r => r.id === reportData.id)) {
        console.error('❌ Duplicate report ID:', reportData.id);
        return false;
      }

      // Add metadata
      const enrichedReport = {
        ...reportData,
        savedAt: new Date().toISOString(),
        version: '1.0',
        createdAt: reportData.createdAt || new Date().toISOString()
      };

      // Ensure status exists
      if (!enrichedReport.status) {
        enrichedReport.status = 'pending';
      }

      // Add to array
      reports.push(enrichedReport);
      console.log('  New report count:', reports.length);

      // Save to localStorage
      try {
        const jsonString = JSON.stringify(reports);
        localStorage.setItem(key, jsonString);
        console.log('  Saved to localStorage');
      } catch (saveError) {
        console.error('❌ Failed to save to localStorage:', saveError);
        
        if (saveError.name === 'QuotaExceededError') {
          alert('Storage quota exceeded. Please clear old reports.');
        }
        
        return false;
      }

      // Verify save
      const verification = localStorage.getItem(key);
      const verifiedReports = JSON.parse(verification);
      const savedReport = verifiedReports.find(r => r.id === reportData.id);
      
      if (savedReport) {
        console.log('✅ Report saved and verified:', reportData.id);
        return true;
      } else {
        console.error('❌ Report save verification failed');
        return false;
      }

    } catch (error) {
      console.error('❌ Storage error:', error);
      console.error('  Error name:', error.name);
      console.error('  Error message:', error.message);
      return false;
    }
  },

  // Get all reports of a type
  getAllReports(reportType) {
    try {
      if (!['police', 'medical', 'infrastructure'].includes(reportType)) {
        console.error('❌ Invalid report type:', reportType);
        return [];
      }

      const key = `reports_${reportType}`;
      const data = localStorage.getItem(key);
      
      if (!data) {
        console.log(`ℹ️ No ${reportType} reports found`);
        return [];
      }
      
      const reports = JSON.parse(data);
      
      if (!Array.isArray(reports)) {
        console.error('❌ Invalid reports format');
        return [];
      }
      
      console.log(`✓ Retrieved ${reports.length} ${reportType} reports`);
      return reports;
    } catch (error) {
      console.error('❌ Get reports error:', error);
      return [];
    }
  },

  // Get report by ID
  getReportById(reportType, reportId) {
    try {
      const reports = this.getAllReports(reportType);
      const report = reports.find(r => r.id === reportId);
      
      if (report) {
        console.log('✓ Found report:', reportId);
      } else {
        console.warn('⚠️ Report not found:', reportId);
      }
      
      return report || null;
    } catch (error) {
      console.error('❌ Get report by ID error:', error);
      return null;
    }
  },

  // Update report status
  updateReportStatus(reportType, reportId, newStatus) {
    try {
      console.log('🔄 Updating status:', reportType, reportId, '→', newStatus);

      const validStatuses = ['pending', 'in-progress', 'resolved'];
      if (!validStatuses.includes(newStatus)) {
        console.error('❌ Invalid status:', newStatus);
        return false;
      }

      const reports = this.getAllReports(reportType);
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex === -1) {
        console.error('❌ Report not found:', reportId);
        return false;
      }

      reports[reportIndex].status = newStatus;
      reports[reportIndex].updatedAt = new Date().toISOString();
      
      const key = `reports_${reportType}`;
      localStorage.setItem(key, JSON.stringify(reports));
      
      console.log('✅ Status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Update status error:', error);
      return false;
    }
  },

  // Update entire report
  updateReport(reportType, reportId, updates) {
    try {
      console.log('🔄 Updating report:', reportId);

      const reports = this.getAllReports(reportType);
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex === -1) {
        console.error('❌ Report not found:', reportId);
        return false;
      }

      reports[reportIndex] = {
        ...reports[reportIndex],
        ...updates,
        id: reports[reportIndex].id,
        updatedAt: new Date().toISOString()
      };
      
      const key = `reports_${reportType}`;
      localStorage.setItem(key, JSON.stringify(reports));
      
      console.log('✅ Report updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Update report error:', error);
      return false;
    }
  },

  // Delete report
  deleteReport(reportType, reportId) {
    try {
      console.log('🗑️ Deleting report:', reportId);

      const reports = this.getAllReports(reportType);
      const filteredReports = reports.filter(r => r.id !== reportId);
      
      if (filteredReports.length === reports.length) {
        console.error('❌ Report not found for deletion:', reportId);
        return false;
      }

      const key = `reports_${reportType}`;
      localStorage.setItem(key, JSON.stringify(filteredReports));
      
      console.log('✅ Report deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Delete report error:', error);
      return false;
    }
  },

  // Get statistics
  getStatistics() {
    try {
      const police = this.getAllReports('police');
      const medical = this.getAllReports('medical');
      const infrastructure = this.getAllReports('infrastructure');
      
      const all = [...police, ...medical, ...infrastructure];
      
      return {
        police: police.length,
        medical: medical.length,
        infrastructure: infrastructure.length,
        total: all.length,
        pending: all.filter(r => r.status === 'pending').length,
        inProgress: all.filter(r => r.status === 'in-progress').length,
        resolved: all.filter(r => r.status === 'resolved').length
      };
    } catch (error) {
      console.error('❌ Get statistics error:', error);
      return {
        police: 0,
        medical: 0,
        infrastructure: 0,
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0
      };
    }
  },

  // Get all reports (all types)
  getAllReportsOfAllTypes() {
    try {
      const police = this.getAllReports('police');
      const medical = this.getAllReports('medical');
      const infrastructure = this.getAllReports('infrastructure');
      
      return [...police, ...medical, ...infrastructure].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error('❌ Get all reports error:', error);
      return [];
    }
  },

  // Clear all reports
  clearAllReports() {
    try {
      if (!confirm('Delete ALL reports? This cannot be undone!')) {
        return false;
      }

      localStorage.setItem('reports_police', JSON.stringify([]));
      localStorage.setItem('reports_medical', JSON.stringify([]));
      localStorage.setItem('reports_infrastructure', JSON.stringify([]));
      
      console.log('✅ All reports cleared');
      return true;
    } catch (error) {
      console.error('❌ Clear reports error:', error);
      return false;
    }
  },

  // Debug: Show all storage data
  debugShowAll() {
    console.group('🔍 Storage Debug Info');
    console.log('Police:', this.getAllReports('police'));
    console.log('Medical:', this.getAllReports('medical'));
    console.log('Infrastructure:', this.getAllReports('infrastructure'));
    console.log('Statistics:', this.getStatistics());
    console.groupEnd();
  }
};

// Auto-initialize immediately
Storage.initialize();

// Make globally available
window.Storage = Storage;

console.log('✅ Storage module loaded and ready');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}