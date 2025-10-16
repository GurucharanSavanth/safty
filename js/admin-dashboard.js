// ================================================
// ADMIN DASHBOARD - COMPLETE JAVASCRIPT
// Features: Report Management, AI Generation, Status Updates, User/Role Management
// ✅ PATCHED: loadAllReports() now displays image thumbnails
// ================================================

let currentUser = null;
let currentReportDetail = null;

// ================================================
// SECTION 1: INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Admin Dashboard initializing...');

  // Check authentication
  if (!ProfileManager.isAuthenticated()) {
    console.log('❌ Not authenticated, redirecting to login');
    window.location.href = 'profile-login.html';
    return;
  }

  currentUser = ProfileManager.getCurrentUser();

  // Check admin access
  if (!['superadmin', 'admin'].includes(currentUser.role)) {
    alert('Unauthorized access. Redirecting to user dashboard.');
    setTimeout(() => window.location.href = 'profile-dashboard.html', 2000);
    return;
  }

  console.log('✅ Admin dashboard loaded for:', currentUser.username);
  loadDashboard();
  setupEventListeners();
});

function loadDashboard() {
  loadStatistics();
  loadUsers();
  loadRoles();
  loadRecentActivity();
  loadAllReports();
  loadAnalytics();
}

// ================================================
// SECTION 2: STATISTICS LOADING
// ================================================

function loadStatistics() {
  try {
    const allReports = [
      ...Storage.getAllReports('police'),
      ...Storage.getAllReports('medical'),
      ...Storage.getAllReports('infrastructure')
    ];

    const userStats = ProfileManager.getUserStatistics();
    const pendingReports = allReports.filter(r => r.status === 'pending').length;

    document.getElementById('totalReports').textContent = allReports.length;
    document.getElementById('totalUsers').textContent = userStats.total;
    document.getElementById('pendingReports').textContent = pendingReports;
    document.getElementById('activeUsers').textContent = userStats.active;
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// ================================================
// SECTION 3: USER MANAGEMENT
// ================================================

function loadUsers() {
  const users = ProfileManager.getAllSafeProfiles();
  const tbody = document.getElementById('usersTableBody');

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px; color: #94a3b8;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td style="font-weight: 600;">${user.username}</td>
      <td>${user.fullName || '-'}</td>
      <td><span class="role-badge role-${user.role}">${user.role}</span></td>
      <td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td style="font-size: 0.875rem; color: #94a3b8;">${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn edit" onclick="editUser('${user.id}')" title="Edit">✏️</button>
          <button class="icon-btn toggle" onclick="toggleUserStatus('${user.id}')" title="Toggle">🔄</button>
          ${user.role !== 'superadmin' ? `<button class="icon-btn delete" onclick="deleteUser('${user.id}')" title="Delete">🗑️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function openCreateUserModal() {
  if (!ProfileManager.canCreateUsers(currentUser.role)) {
    alert('Unauthorized: Cannot create users');
    return;
  }

  const allRoles = ProfileManager.getAllRoles();
  const roleSelect = document.getElementById('role');
  roleSelect.innerHTML = allRoles.map(r => 
    `<option value="${r.value}">${r.label}</option>`
  ).join('');

  document.getElementById('userModalTitle').textContent = '👤 Create User';
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('userModal').classList.add('active');
}

function editUser(userId) {
  const user = ProfileManager.getProfileById(userId);
  if (!user) return;

  const allRoles = ProfileManager.getAllRoles();
  const roleSelect = document.getElementById('role');
  roleSelect.innerHTML = allRoles.map(r => 
    `<option value="${r.value}">${r.label}</option>`
  ).join('');

  document.getElementById('userModalTitle').textContent = '✏️ Edit User';
  document.getElementById('userId').value = user.id;
  document.getElementById('username').value = user.username;
  document.getElementById('fullName').value = user.fullName || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('role').value = user.role;
  document.getElementById('department').value = user.department || '';
  document.getElementById('isActive').checked = user.isActive;
  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('userModal').classList.add('active');
}

function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  const result = ProfileManager.deleteProfile(userId, currentUser.id);
  if (result.success) {
    alert('User deleted successfully');
    loadUsers();
    loadStatistics();
  } else {
    alert('Error: ' + result.error);
  }
}

function toggleUserStatus(userId) {
  const user = ProfileManager.getProfileById(userId);
  if (!user) return;

  const result = ProfileManager.toggleUserStatus(userId, !user.isActive, currentUser.id);
  if (result.success) {
    alert('User status updated');
    loadUsers();
    loadStatistics();
  } else {
    alert('Error: ' + result.error);
  }
}

// ================================================
// SECTION 4: ROLE MANAGEMENT
// ================================================

function loadRoles() {
  const allRoles = ProfileManager.getAllRolesWithCustom();
  const systemRoles = allRoles.filter(r => r.isSystem);
  const customRoles = allRoles.filter(r => !r.isSystem);

  document.getElementById('systemRolesList').innerHTML = systemRoles.map(r => createRoleCard(r, true)).join('');

  const customContainer = document.getElementById('customRolesList');
  if (customRoles.length === 0) {
    customContainer.innerHTML = '<p style="color: #94a3b8; padding: 32px; text-align: center;">No custom roles. Click "Create Custom Role" to add one.</p>';
  } else {
    customContainer.innerHTML = customRoles.map(r => createRoleCard(r, false)).join('');
  }
}

function createRoleCard(role, isSystem) {
  const permissions = Array.isArray(role.permissions) ? role.permissions.join(', ') : 'N/A';
  const reportAccess = Array.isArray(role.reportAccess) ? role.reportAccess.join(', ') : 'None';
  const reportLimit = role.reportLimit === null ? 'Unlimited' : role.reportLimit;

  return `
    <div style="padding: 20px; background: rgba(51, 65, 85, 0.3); border: 2px solid ${isSystem ? '#3b82f6' : '#22c55e'}; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <div>
          <h4 style="font-size: 1.1rem;">${role.label}</h4>
          <p style="color: #94a3b8; font-size: 0.875rem;">Key: ${role.key}</p>
          ${role.description ? `<p style="color: #cbd5e1; font-size: 0.875rem; margin-top: 8px;">${role.description}</p>` : ''}
        </div>
        ${!isSystem ? `
          <div style="display: flex; gap: 8px;">
            <button class="icon-btn edit" onclick="editRole('${role.key}')">✏️</button>
            <button class="icon-btn delete" onclick="deleteRole('${role.key}')">🗑️</button>
          </div>
        ` : '<span style="padding: 4px 12px; background: #3b82f6; color: white; border-radius: 12px; font-size: 0.75rem;">SYSTEM</span>'}
      </div>
      <div style="font-size: 0.875rem; color: #cbd5e1;">
        <strong>Permissions:</strong> ${permissions}<br>
        <strong>Report Access:</strong> ${reportAccess}<br>
        <strong>Report Limit:</strong> ${reportLimit}
      </div>
    </div>
  `;
}

function openCreateRoleModal() {
  if (!ProfileManager.canModifyRoles(currentUser.role)) {
    alert('Unauthorized: Cannot create custom roles');
    return;
  }

  document.getElementById('roleModalTitle').textContent = '🎭 Create Custom Role';
  document.getElementById('roleForm').reset();
  document.getElementById('roleId').value = '';
  document.getElementById('roleKey').disabled = false;
  document.querySelectorAll('.role-permission').forEach(cb => cb.checked = cb.value === 'read');
  document.getElementById('roleModal').classList.add('active');
}

function editRole(roleKey) {
  const allRoles = ProfileManager.getAllRolesWithCustom();
  const role = allRoles.find(r => r.key === roleKey);

  if (!role || role.isSystem) {
    alert('Cannot edit system roles');
    return;
  }

  document.getElementById('roleModalTitle').textContent = '✏️ Edit Custom Role';
  document.getElementById('roleId').value = roleKey;
  document.getElementById('roleKey').value = roleKey;
  document.getElementById('roleKey').disabled = true;
  document.getElementById('roleLabel').value = role.label;
  document.getElementById('roleDescription').value = role.description || '';
  document.getElementById('roleReportLimit').value = role.reportLimit || 0;

  document.querySelectorAll('.role-permission').forEach(cb => cb.checked = role.permissions.includes(cb.value));
  document.querySelectorAll('.role-report-access').forEach(cb => cb.checked = role.reportAccess.includes(cb.value));
  document.getElementById('roleCanCreateUsers').checked = role.canCreateUsers || false;
  document.getElementById('roleCanDeleteUsers').checked = role.canDeleteUsers || false;
  document.getElementById('roleCanModifyRoles').checked = role.canModifyRoles || false;
  document.getElementById('roleCanAccessConfig').checked = role.canAccessConfig || false;
  document.getElementById('roleCanGenerateReports').checked = role.canGenerateReports || false;
  document.getElementById('roleDashboardAccess').value = role.dashboardAccess || 'limited';

  document.getElementById('roleModal').classList.add('active');
}

function deleteRole(roleKey) {
  if (!confirm('Are you sure you want to delete this custom role?')) return;

  const result = ProfileManager.deleteCustomRole(roleKey, currentUser.id);
  if (result.success) {
    alert('Custom role deleted');
    loadRoles();
  } else {
    alert('Error: ' + result.error);
  }
}

// ================================================
// ✅ SECTION 5: REPORT MANAGEMENT WITH IMAGE THUMBNAILS (PATCHED)
// ================================================

function loadAllReports() {
  try {
    const allReports = [
      ...Storage.getAllReports('police').map(r => ({...r, type: 'police'})),
      ...Storage.getAllReports('medical').map(r => ({...r, type: 'medical'})),
      ...Storage.getAllReports('infrastructure').map(r => ({...r, type: 'infrastructure'}))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const container = document.getElementById('allReportsList');

    if (allReports.length === 0) {
      container.innerHTML = '<p style="color: #94a3b8; padding: 32px; text-align: center;">No reports found</p>';
      return;
    }

    container.innerHTML = allReports.map(report => {
      // ✅ IMAGE FIX: Handle both photo (single) and images (array)
      let imageList = [];
      if (report.images && Array.isArray(report.images) && report.images.length > 0) {
        imageList = report.images;
      } else if (report.photo) {
        imageList = [report.photo];
      }
      const hasImages = imageList.length > 0;
      const firstImage = hasImages ? imageList[0] : null;
      const imageCount = imageList.length;

      return `
        <div onclick="openReportDetail('${report.id}', '${report.type}')" 
             style="padding: 20px; background: rgba(51, 65, 85, 0.3); border: 2px solid rgba(71, 85, 105, 0.5); border-radius: 12px; cursor: pointer; transition: all 0.3s;"
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
          <div style="display: flex; gap: 16px; align-items: start;">
            ${firstImage ? `
              <div style="flex-shrink: 0; position: relative;">
                <img src="${firstImage}" alt="Report" 
                     style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #475569;">
                ${imageCount > 1 ? `
                  <span style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">
                    +${imageCount - 1} 📸
                  </span>
                ` : ''}
              </div>
            ` : ''}

            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="font-size: 1.5rem;">${report.type === 'police' ? '🚔' : report.type === 'medical' ? '🚑' : '🏗️'}</span>
                <div>
                  <div style="font-weight: 700; font-size: 1.1rem;">${report.id}</div>
                  <div style="color: #94a3b8; font-size: 0.875rem;">${report.type.toUpperCase()}</div>
                </div>
              </div>
              <div style="color: #cbd5e1; margin-top: 8px; line-height: 1.5;">
                ${(report.description || report.details || 'No description').substring(0, 150)}${(report.description || report.details || '').length > 150 ? '...' : ''}
              </div>
              ${report.location && report.location.latitude ? `
                <div style="color: #94a3b8; font-size: 0.875rem; margin-top: 8px;">
                  📍 ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}
                </div>
              ` : ''}
            </div>

            <div style="text-align: right; flex-shrink: 0;">
              <span class="status-badge status-${report.status || 'pending'}">${report.status || 'pending'}</span>
              <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 8px;">
                ${new Date(report.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

function openReportDetail(reportId, reportType) {
  console.log('Opening report:', reportId, reportType);

  const report = Storage.getReportById(reportType, reportId);
  if (!report) {
    alert('Report not found');
    return;
  }

  currentReportDetail = { id: reportId, type: reportType, data: report };

  document.getElementById('detailReportId').textContent = report.id;
  document.getElementById('detailReportType').textContent = reportType.toUpperCase();
  document.getElementById('detailDescription').textContent = report.description || report.details || 'No description provided';
  document.getElementById('detailCreatedAt').textContent = new Date(report.createdAt).toLocaleString();

  const statusSpan = document.getElementById('currentStatus');
  statusSpan.textContent = report.status || 'pending';
  statusSpan.className = `status-badge status-${report.status || 'pending'}`;
  document.getElementById('statusSelect').value = report.status || 'pending';

  const canUpdate = ProfileManager.hasPermission(currentUser, 'update');
  document.getElementById('statusUpdateSection').style.display = canUpdate ? 'block' : 'none';

  if (report.location || report.geolocation) {
    const loc = report.location || report.geolocation;
    if (typeof loc === 'object' && loc.latitude && loc.longitude) {
      document.getElementById('detailLocation').innerHTML = `
        <strong>Coordinates:</strong><br>
        Latitude: ${loc.latitude.toFixed(6)}<br>
        Longitude: ${loc.longitude.toFixed(6)}
        ${loc.address ? `<br><br><strong>Address:</strong><br>${loc.address}` : ''}
      `;

      document.getElementById('geotagSection').style.display = 'block';
      document.getElementById('googleMapsLink').href = 
        `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    } else {
      document.getElementById('detailLocation').textContent = loc.toString();
      document.getElementById('geotagSection').style.display = 'none';
    }
    document.getElementById('locationSection').style.display = 'block';
  } else {
    document.getElementById('locationSection').style.display = 'none';
  }

  if (report.images && report.images.length > 0) {
    document.getElementById('imagesSection').style.display = 'block';
    document.getElementById('detailImages').innerHTML = report.images.map(img => `
      <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid #475569;">
        <img src="${img}" alt="Report image" style="width: 100%; height: 200px; object-fit: cover; cursor: pointer;" onclick="window.open('${img}', '_blank')">
      </div>
    `).join('');
  } else {
    document.getElementById('imagesSection').style.display = 'none';
  }

  if (report.audioUrl || report.audioData) {
    document.getElementById('audioSection').style.display = 'block';
    document.getElementById('detailAudio').src = report.audioUrl || report.audioData;
  } else {
    document.getElementById('audioSection').style.display = 'none';
  }

  if (report.updatedAt) {
    document.getElementById('detailUpdatedAtSection').style.display = 'block';
    document.getElementById('detailUpdatedAt').textContent = new Date(report.updatedAt).toLocaleString();
  } else {
    document.getElementById('detailUpdatedAtSection').style.display = 'none';
  }

  document.getElementById('reportDetailModal').classList.add('active');
}

function updateReportStatus() {
  if (!currentReportDetail) return;

  const newStatus = document.getElementById('statusSelect').value;
  const result = Storage.updateReportStatus(currentReportDetail.type, currentReportDetail.id, newStatus);

  if (result) {
    alert('✅ Status updated successfully!');

    const statusSpan = document.getElementById('currentStatus');
    statusSpan.textContent = newStatus;
    statusSpan.className = `status-badge status-${newStatus}`;

    loadAllReports();
    loadStatistics();
  } else {
    alert('❌ Failed to update status');
  }
}
// ✅ Delete current report (with confirmation)
function deleteCurrentReport() {
  if (!currentReportDetail) {
    alert('No report selected');
    return;
  }

  const reportId = currentReportDetail.id;
  const reportType = currentReportDetail.type;

  // Show confirmation dialog
  const confirmed = confirm(
    `⚠️ DELETE REPORT?\n\n` +
    `Report ID: ${reportId}\n` +
    `Type: ${reportType.toUpperCase()}\n\n` +
    `This action cannot be undone!\n\n` +
    `Are you sure you want to delete this report?`
  );

  if (!confirmed) {
    console.log('Delete cancelled by user');
    return;
  }

  try {
    console.log('🗑️ Attempting to delete report:', reportId, reportType);

    // Delete from storage
    const success = Storage.deleteReport(reportType, reportId);

    if (success) {
      console.log('✅ Report deleted successfully');
      
      // Show success message
      alert('✅ Report deleted successfully!');
      
      // Close the modal
      closeModal('reportDetailModal');
      
      // Refresh the reports list
      loadAllReports();
      loadStatistics();
      
      // Clear current detail
      currentReportDetail = null;
      
    } else {
      console.error('❌ Failed to delete report');
      alert('❌ Failed to delete report. Please try again.');
    }
    
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    alert('❌ Error deleting report: ' + error.message);
  }
}

function refreshReports() {
  loadAllReports();
  alert('Reports refreshed!');
}

// ================================================
// SECTION 6: AI REPORT GENERATION
// ================================================

async function generateReport() {
  const reportType = document.getElementById('reportType').value;
  const dateRange = reportType === 'custom' ? parseInt(document.getElementById('reportDays').value) : 30;

  closeModal('reportGenerationModal');

  const loadingMsg = document.createElement('div');
  loadingMsg.id = 'generatingMsg';
  loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(30, 41, 59, 0.95); padding: 32px; border-radius: 16px; z-index: 20000; text-align: center; border: 2px solid #3b82f6;';
  loadingMsg.innerHTML = '<h3 style="color: #3b82f6; margin-bottom: 16px;">🤖 Generating AI Report...</h3><p style="color: #94a3b8;">This may take a few moments...</p>';
  document.body.appendChild(loadingMsg);

  try {
    const allReports = [
      ...Storage.getAllReports('police').map(r => ({...r, type: 'police'})),
      ...Storage.getAllReports('medical').map(r => ({...r, type: 'medical'})),
      ...Storage.getAllReports('infrastructure').map(r => ({...r, type: 'infrastructure'}))
    ];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);
    const filteredReports = allReports.filter(r => new Date(r.createdAt) >= cutoffDate);

    const generatedReport = {
      id: 'AI_REPORT_' + Date.now(),
      generatedAt: new Date().toISOString(),
      dateRange: dateRange,
      reportCount: filteredReports.length,
      summary: {
        total: filteredReports.length,
        byType: {
          police: filteredReports.filter(r => r.type === 'police').length,
          medical: filteredReports.filter(r => r.type === 'medical').length,
          infrastructure: filteredReports.filter(r => r.type === 'infrastructure').length
        },
        byStatus: {
          pending: filteredReports.filter(r => (r.status || 'pending') === 'pending').length,
          inProgress: filteredReports.filter(r => r.status === 'in-progress').length,
          resolved: filteredReports.filter(r => r.status === 'resolved').length
        }
      },
      insights: generateInsights(filteredReports),
      recommendations: generateRecommendations(filteredReports),
      trends: analyzeTrends(filteredReports)
    };

    const existingReports = JSON.parse(localStorage.getItem('ai_generated_reports') || '[]');
    existingReports.unshift(generatedReport);
    localStorage.setItem('ai_generated_reports', JSON.stringify(existingReports));

    document.body.removeChild(loadingMsg);
    alert('✅ AI Report generated successfully! View it in the Analytics tab.');

    loadAnalytics();
    switchTab('analytics');

  } catch (error) {
    console.error('Error generating report:', error);
    if (document.getElementById('generatingMsg')) {
      document.body.removeChild(document.getElementById('generatingMsg'));
    }
    alert('❌ Error generating report: ' + error.message);
  }
}

function generateInsights(reports) {
  const insights = [];

  insights.push(`Analyzed ${reports.length} reports from the selected time period`);

  if (reports.length > 0) {
    insights.push(`Most common report type: ${getMostCommonType(reports)}`);
    insights.push(`Resolution rate: ${calculateResolutionRate(reports)}%`);

    const avgPerDay = (reports.length / 30).toFixed(1);
    insights.push(`Average reports per day: ${avgPerDay}`);

    const withLocation = reports.filter(r => r.location && r.location.latitude).length;
    insights.push(`Reports with geolocation: ${withLocation} (${Math.round(withLocation/reports.length*100)}%)`);
  } else {
    insights.push('No reports found in the selected time period');
  }

  return insights;
}

function generateRecommendations(reports) {
  const pending = reports.filter(r => (r.status || 'pending') === 'pending').length;
  const recommendations = [];

  if (reports.length === 0) {
    recommendations.push('System is ready to receive and process reports');
    return recommendations;
  }

  if (pending > reports.length * 0.5) {
    recommendations.push('⚠️ High number of pending reports detected. Consider increasing response team capacity.');
  }

  if (pending > reports.length * 0.3) {
    recommendations.push('Implement automated status updates for faster processing');
  }

  recommendations.push('Deploy additional resources to high-density report areas');
  recommendations.push('Establish 24/7 monitoring for critical report types');
  recommendations.push('Consider AI-powered prioritization for urgent cases');

  return recommendations;
}

function analyzeTrends(reports) {
  const trends = {
    dailyDistribution: {},
    hourlyDistribution: {},
    typeGrowth: {}
  };

  reports.forEach(r => {
    const date = new Date(r.createdAt);
    const day = date.toLocaleDateString();
    const hour = date.getHours();

    trends.dailyDistribution[day] = (trends.dailyDistribution[day] || 0) + 1;
    trends.hourlyDistribution[hour] = (trends.hourlyDistribution[hour] || 0) + 1;
  });

  return trends;
}

function getMostCommonType(reports) {
  const counts = reports.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'N/A');
}

function calculateResolutionRate(reports) {
  if (reports.length === 0) return 0;
  const resolved = reports.filter(r => r.status === 'resolved').length;
  return Math.round((resolved / reports.length) * 100);
}

// ================================================
// SECTION 7: ANALYTICS & REPORT VIEWING
// ================================================

function loadAnalytics() {
  const generatedReports = JSON.parse(localStorage.getItem('ai_generated_reports') || '[]');

  document.getElementById('totalGeneratedReports').textContent = generatedReports.length;

  if (generatedReports.length > 0) {
    const latest = generatedReports[0];
    document.getElementById('lastReportDate').textContent = new Date(latest.generatedAt).toLocaleDateString();

    document.getElementById('latestReportContent').innerHTML = `
      <div style="background: rgba(30, 41, 59, 0.5); padding: 20px; border-radius: 8px;">
        <h4 style="color: #3b82f6; margin-bottom: 12px;">📊 Report ID: ${latest.id}</h4>
        <p style="margin-bottom: 8px;"><strong>Generated:</strong> ${new Date(latest.generatedAt).toLocaleString()}</p>
        <p style="margin-bottom: 8px;"><strong>Date Range:</strong> Last ${latest.dateRange} days</p>
        <p style="margin-bottom: 16px;"><strong>Reports Analyzed:</strong> ${latest.reportCount}</p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6;">${latest.summary.byType.police}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Police</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${latest.summary.byType.medical}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Medical</div>
          </div>
          <div style="background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 800; color: #f59e0b;">${latest.summary.byType.infrastructure}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Infrastructure</div>
          </div>
        </div>

        <h5 style="color: #22c55e; margin: 16px 0 8px 0;">💡 Key Insights:</h5>
        <ul style="list-style: none; padding: 0;">
          ${latest.insights.map(i => `<li style="padding: 4px 0; color: #cbd5e1;">• ${i}</li>`).join('')}
        </ul>

        <h5 style="color: #f59e0b; margin: 16px 0 8px 0;">📋 Recommendations:</h5>
        <ul style="list-style: none; padding: 0;">
          ${latest.recommendations.map(r => `<li style="padding: 4px 0; color: #cbd5e1;">• ${r}</li>`).join('')}
        </ul>
      </div>
    `;
  } else {
    document.getElementById('lastReportDate').textContent = 'Never';
    document.getElementById('latestReportContent').innerHTML = `
      <p style="color: #94a3b8; text-align: center; padding: 32px;">
        No AI reports generated yet. Click "Generate Report" in the header to create one.
      </p>
    `;
  }
}

function viewGeneratedReports() {
  const reports = JSON.parse(localStorage.getItem('ai_generated_reports') || '[]');

  if (reports.length === 0) {
    alert('No AI reports generated yet. Generate one first!');
    return;
  }

  const container = document.getElementById('generatedReportsList');
  container.innerHTML = reports.map((report, index) => `
    <div style="background: rgba(51, 65, 85, 0.3); padding: 24px; border-radius: 12px; margin-bottom: 16px; border: 2px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="color: #3b82f6;">📊 Report #${index + 1}</h3>
        <button class="action-btn secondary" onclick="downloadReport(${index})" style="padding: 8px 16px;">📥 Download JSON</button>
      </div>

      <div style="display: grid; gap: 8px; font-size: 0.875rem;">
        <p><strong>ID:</strong> ${report.id}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        <p><strong>Date Range:</strong> ${report.dateRange} days</p>
        <p><strong>Reports Analyzed:</strong> ${report.reportCount}</p>
      </div>

      <div style="margin-top: 16px;">
        <strong>Summary:</strong>
        <ul style="margin-top: 8px; color: #cbd5e1; font-size: 0.875rem;">
          <li>Total Reports: ${report.summary.total}</li>
          <li>Police: ${report.summary.byType.police}</li>
          <li>Medical: ${report.summary.byType.medical}</li>
          <li>Infrastructure: ${report.summary.byType.infrastructure}</li>
          <li>Pending: ${report.summary.byStatus.pending}</li>
          <li>In Progress: ${report.summary.byStatus.inProgress}</li>
          <li>Resolved: ${report.summary.byStatus.resolved}</li>
        </ul>
      </div>
    </div>
  `).join('');

  document.getElementById('generatedReportsModal').classList.add('active');
}

function downloadReport(index) {
  const reports = JSON.parse(localStorage.getItem('ai_generated_reports') || '[]');
  const report = reports[index];

  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `AI_Report_${new Date(report.generatedAt).toISOString().split('T')[0]}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

// ================================================
// SECTION 8: RECENT ACTIVITY
// ================================================

function loadRecentActivity() {
  const auditLog = ProfileManager.getAuditLog(10);
  const container = document.getElementById('recentActivity');

  if (auditLog.length === 0) {
    container.innerHTML = '<p style="color: #94a3b8; padding: 20px; text-align: center;">No recent activity</p>';
    return;
  }

  container.innerHTML = auditLog.map(log => `
    <div style="padding: 12px; background: rgba(51, 65, 85, 0.3); border-radius: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <div><span style="font-weight: 600;">${log.action}</span> - ${log.details}</div>
        <div style="font-size: 0.75rem; color: #94a3b8;">${new Date(log.timestamp).toLocaleString()}</div>
      </div>
    </div>
  `).join('');
}

// ================================================
// SECTION 9: TAB SWITCHING
// ================================================

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  event.target.classList.add('active');

  if (tabName === 'users') loadUsers();
  if (tabName === 'roles') loadRoles();
  if (tabName === 'reports') loadAllReports();
  if (tabName === 'analytics') loadAnalytics();
}

// ================================================
// SECTION 10: MODALS & CONFIG
// ================================================

function openConfigModal() {
  if (!ProfileManager.canAccessConfig(currentUser.role)) {
    alert('Unauthorized: Cannot access configuration');
    return;
  }
  document.getElementById('configModal').classList.add('active');
}

function toggleLLM(provider) {
  const toggle = document.getElementById(provider + 'Toggle');
  const keyGroup = document.getElementById(provider + 'KeyGroup');
  toggle.classList.toggle('active');
  keyGroup.style.display = toggle.classList.contains('active') ? 'block' : 'none';
}

function saveConfig() {
  alert('Configuration saved successfully!');
  closeModal('configModal');
}

function openReportGenerationModal() {
  if (!ProfileManager.canGenerateReports(currentUser.role)) {
    alert('Unauthorized: Cannot generate reports');
    return;
  }
  document.getElementById('reportGenerationModal').classList.add('active');
}

function toggleAutomation() {
  const toggle = document.getElementById('automationToggle');
  const options = document.getElementById('automationOptions');
  toggle.classList.toggle('active');
  options.style.display = toggle.classList.contains('active') ? 'block' : 'none';
}

function toggleInterval(interval) {
  const toggle = document.getElementById(interval + 'Toggle');
  toggle.classList.toggle('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function handleLogout() {
  ProfileManager.logout();
  window.location.href = 'profile-login.html';
}

function exportReports() {
  try {
    const allReports = [
      ...Storage.getAllReports('police').map(r => ({...r, type: 'police'})),
      ...Storage.getAllReports('medical').map(r => ({...r, type: 'medical'})),
      ...Storage.getAllReports('infrastructure').map(r => ({...r, type: 'infrastructure'}))
    ];

    if (allReports.length === 0) {
      alert('No reports to export');
      return;
    }

    const csv = ['ID,Type,Status,Location,Created At\n'];
    allReports.forEach(r => {
      const loc = r.location && r.location.latitude ? 
        `"${r.location.latitude.toFixed(6)}, ${r.location.longitude.toFixed(6)}"` : 'N/A';
      csv.push(`${r.id},${r.type},${r.status || 'pending'},${loc},${new Date(r.createdAt).toISOString()}\n`);
    });

    const blob = new Blob(csv, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    alert('✅ Reports exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    alert('❌ Error exporting reports');
  }
}

// ================================================
// SECTION 11: EVENT LISTENERS
// ================================================

function setupEventListeners() {
  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const userData = {
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      fullName: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      role: document.getElementById('role').value,
      department: document.getElementById('department').value,
      isActive: document.getElementById('isActive').checked
    };

    let result;
    if (userId) {
      result = ProfileManager.updateProfile(userId, userData, currentUser.id);
    } else {
      result = ProfileManager.createProfile(userData, currentUser.id);
    }

    if (result.success) {
      alert(userId ? 'User updated successfully' : 'User created successfully');
      closeModal('userModal');
      loadUsers();
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  });

  document.getElementById('roleForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const roleId = document.getElementById('roleId').value;
    const permissions = Array.from(document.querySelectorAll('.role-permission:checked')).map(cb => cb.value);
    const reportAccess = Array.from(document.querySelectorAll('.role-report-access:checked')).map(cb => cb.value);

    const roleData = {
      roleKey: document.getElementById('roleKey').value.toLowerCase(),
      label: document.getElementById('roleLabel').value,
      description: document.getElementById('roleDescription').value,
      permissions: permissions,
      reportAccess: reportAccess,
      reportLimit: parseInt(document.getElementById('roleReportLimit').value) || 0,
      canCreateUsers: document.getElementById('roleCanCreateUsers').checked,
      canDeleteUsers: document.getElementById('roleCanDeleteUsers').checked,
      canModifyRoles: document.getElementById('roleCanModifyRoles').checked,
      canAccessConfig: document.getElementById('roleCanAccessConfig').checked,
      canGenerateReports: document.getElementById('roleCanGenerateReports').checked,
      dashboardAccess: document.getElementById('roleDashboardAccess').value
    };

    const result = roleId ? 
      ProfileManager.updateCustomRole(roleId, roleData, currentUser.id) :
      ProfileManager.createCustomRole(roleData, currentUser.id);

    if (result.success) {
      alert(roleId ? 'Role updated' : 'Custom role created');
      closeModal('roleModal');
      loadRoles();
      loadUsers();
    } else {
      alert('Error: ' + result.error);
    }
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.getElementById('reportType')?.addEventListener('change', (e) => {
    document.getElementById('dateRangeGroup').style.display = 
      e.target.value === 'custom' ? 'block' : 'none';
  });
}

console.log('✅ Admin Dashboard JavaScript loaded successfully - WITH IMAGE THUMBNAILS');
