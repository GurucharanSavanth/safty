// ================================================
// PROFILE MANAGEMENT MODULE - COMPLETE RBAC SYSTEM WITH CUSTOM ROLES
// Features: User Management, Role Creation, Custom Permissions, Advanced RBAC
// ================================================

const ProfileManager = {
  // ================================================
  // SECTION 1: CONFIGURATION WITH CUSTOM ROLES
  // ================================================

  config: {
    // Predefined System Roles (Cannot be deleted)
    systemRoles: {
      superadmin: {
        label: 'Super Admin',
        permissions: ['all'],
        reportAccess: ['police', 'medical', 'infrastructure'],
        reportLimit: null,
        canCreateUsers: true,
        canDeleteUsers: true,
        canModifyRoles: true,
        canAccessConfig: true,
        canGenerateReports: true,
        dashboardAccess: 'full',
        isSystem: true
      },
      admin: {
        label: 'Administrator',
        permissions: ['create', 'read', 'update', 'delete'],
        reportAccess: ['police', 'medical', 'infrastructure'],
        reportLimit: null,
        canCreateUsers: true,
        canDeleteUsers: false,
        canModifyRoles: false,
        canAccessConfig: true,
        canGenerateReports: true,
        dashboardAccess: 'full',
        isSystem: true
      },
      manager: {
        label: 'Manager',
        permissions: ['create', 'read', 'update'],
        reportAccess: ['police', 'medical', 'infrastructure'],
        reportLimit: 1000,
        canCreateUsers: false,
        canDeleteUsers: false,
        canModifyRoles: false,
        canAccessConfig: false,
        canGenerateReports: true,
        dashboardAccess: 'limited',
        isSystem: true
      },
      viewer: {
        label: 'Viewer',
        permissions: ['read'],
        reportAccess: [],
        reportLimit: 50,
        canCreateUsers: false,
        canDeleteUsers: false,
        canModifyRoles: false,
        canAccessConfig: false,
        canGenerateReports: false,
        dashboardAccess: 'minimal',
        isSystem: true
      }
    },

    defaultSuperAdmin: {
      username: 'admin',
      password: 'admin123',
      role: 'superadmin',
      fullName: 'System Administrator',
      email: 'admin@citizensafety.com'
    }
  },

  // ================================================
  // SECTION 2: CUSTOM ROLE MANAGEMENT
  // ================================================

  /**
   * Load custom roles from localStorage
   */
  loadCustomRoles() {
    try {
      const saved = localStorage.getItem('custom_roles');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading custom roles:', error);
      return {};
    }
  },

  /**
   * Save custom roles to localStorage
   */
  saveCustomRoles(customRoles) {
    try {
      localStorage.setItem('custom_roles', JSON.stringify(customRoles));
      return true;
    } catch (error) {
      console.error('Error saving custom roles:', error);
      return false;
    }
  },

  /**
   * Create a new custom role
   */
  createCustomRole(roleData, creatorId) {
    try {
      // Verify creator has permission
      const creator = this.getProfileById(creatorId);
      if (!creator || !this.canModifyRoles(creator.role)) {
        throw new Error('Unauthorized: Cannot create custom roles');
      }

      // Validate role data
      if (!roleData.roleKey || !roleData.label) {
        throw new Error('Role key and label are required');
      }

      // Check if role already exists
      if (this.config.systemRoles[roleData.roleKey] || this.loadCustomRoles()[roleData.roleKey]) {
        throw new Error('Role key already exists');
      }

      // Create role object
      const newRole = {
        label: roleData.label,
        description: roleData.description || '',
        permissions: roleData.permissions || ['read'],
        reportAccess: roleData.reportAccess || [],
        reportLimit: roleData.reportLimit !== undefined ? roleData.reportLimit : 100,
        canCreateUsers: roleData.canCreateUsers || false,
        canDeleteUsers: roleData.canDeleteUsers || false,
        canModifyRoles: roleData.canModifyRoles || false,
        canAccessConfig: roleData.canAccessConfig || false,
        canGenerateReports: roleData.canGenerateReports || false,
        dashboardAccess: roleData.dashboardAccess || 'limited',
        isSystem: false,
        createdAt: new Date().toISOString(),
        createdBy: creatorId
      };

      // Save to custom roles
      const customRoles = this.loadCustomRoles();
      customRoles[roleData.roleKey] = newRole;
      this.saveCustomRoles(customRoles);

      // Log action
      this.logAudit('create_role', creatorId, `Created custom role: ${roleData.label}`);

      console.log('✅ Custom role created:', roleData.roleKey);
      return { success: true, role: newRole };

    } catch (error) {
      console.error('Error creating custom role:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update existing custom role
   */
  updateCustomRole(roleKey, updates, updaterId) {
    try {
      // Verify updater has permission
      const updater = this.getProfileById(updaterId);
      if (!updater || !this.canModifyRoles(updater.role)) {
        throw new Error('Unauthorized: Cannot update roles');
      }

      // Cannot update system roles
      if (this.config.systemRoles[roleKey]) {
        throw new Error('Cannot modify system roles');
      }

      const customRoles = this.loadCustomRoles();
      if (!customRoles[roleKey]) {
        throw new Error('Custom role not found');
      }

      // Update role
      customRoles[roleKey] = {
        ...customRoles[roleKey],
        ...updates,
        isSystem: false,
        updatedAt: new Date().toISOString(),
        updatedBy: updaterId
      };

      this.saveCustomRoles(customRoles);
      this.logAudit('update_role', updaterId, `Updated custom role: ${roleKey}`);

      console.log('✅ Custom role updated:', roleKey);
      return { success: true, role: customRoles[roleKey] };

    } catch (error) {
      console.error('Error updating custom role:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete custom role
   */
  deleteCustomRole(roleKey, deleterId) {
    try {
      // Verify deleter has permission
      const deleter = this.getProfileById(deleterId);
      if (!deleter || !this.canModifyRoles(deleter.role)) {
        throw new Error('Unauthorized: Cannot delete roles');
      }

      // Cannot delete system roles
      if (this.config.systemRoles[roleKey]) {
        throw new Error('Cannot delete system roles');
      }

      // Check if any users have this role
      const users = this.getAllProfiles();
      const usersWithRole = users.filter(u => u.role === roleKey);
      if (usersWithRole.length > 0) {
        throw new Error(`Cannot delete role: ${usersWithRole.length} users still have this role`);
      }

      const customRoles = this.loadCustomRoles();
      if (!customRoles[roleKey]) {
        throw new Error('Custom role not found');
      }

      delete customRoles[roleKey];
      this.saveCustomRoles(customRoles);
      this.logAudit('delete_role', deleterId, `Deleted custom role: ${roleKey}`);

      console.log('✅ Custom role deleted:', roleKey);
      return { success: true };

    } catch (error) {
      console.error('Error deleting custom role:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all roles (system + custom)
   */
  getAllRolesWithCustom() {
    const systemRoles = Object.keys(this.config.systemRoles).map(key => ({
      key: key,
      ...this.config.systemRoles[key]
    }));

    const customRoles = Object.keys(this.loadCustomRoles()).map(key => ({
      key: key,
      ...this.loadCustomRoles()[key]
    }));

    return [...systemRoles, ...customRoles];
  },

  /**
   * Get role configuration (system or custom)
   */
  getRoleConfig(roleName) {
    // Check system roles first
    if (this.config.systemRoles[roleName]) {
      return this.config.systemRoles[roleName];
    }

    // Check custom roles
    const customRoles = this.loadCustomRoles();
    return customRoles[roleName] || null;
  },

  // ================================================
  // SECTION 3: INITIALIZATION
  // ================================================

  initialize() {
    console.log('👤 Initializing Profile Manager...');

    if (!localStorage.getItem('user_profiles')) {
      localStorage.setItem('user_profiles', JSON.stringify([]));
    }

    if (!localStorage.getItem('active_session')) {
      localStorage.setItem('active_session', JSON.stringify(null));
    }

    if (!localStorage.getItem('audit_log')) {
      localStorage.setItem('audit_log', JSON.stringify([]));
    }

    if (!localStorage.getItem('custom_roles')) {
      localStorage.setItem('custom_roles', JSON.stringify({}));
    }

    const profiles = this.getAllProfiles();
    const hasSuperAdmin = profiles.some(p => p.role === 'superadmin');

    if (!hasSuperAdmin) {
      console.log('⚠️  No super admin found, creating default...');
      this.createDefaultSuperAdmin();
    }

    console.log('✅ Profile Manager initialized');
  },

  createDefaultSuperAdmin() {
    try {
      const admin = {
        id: this.generateProfileId(),
        username: this.config.defaultSuperAdmin.username,
        password: this.hashPassword(this.config.defaultSuperAdmin.password),
        role: 'superadmin',
        fullName: this.config.defaultSuperAdmin.fullName,
        email: this.config.defaultSuperAdmin.email,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        isActive: true,
        lastLogin: null,
        loginCount: 0
      };

      const profiles = this.getAllProfiles();
      profiles.push(admin);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      console.log('✅ Default super admin created');
      console.log('⚠️  Username: admin | Password: admin123');
      console.log('⚠️  PLEASE CHANGE THIS PASSWORD IMMEDIATELY!');

    } catch (error) {
      console.error('Error creating default super admin:', error);
    }
  },

  // ================================================
  // SECTION 4: USER CRUD
  // ================================================

  getAllProfiles() {
    try {
      const profiles = localStorage.getItem('user_profiles');
      return profiles ? JSON.parse(profiles) : [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  },

  getProfileById(profileId) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === profileId);
  },

  getProfileByUsername(username) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.username === username);
  },

  createProfile(profileData, creatorId) {
    try {
      const creator = this.getProfileById(creatorId);
      if (!creator || !this.canCreateUsers(creator.role)) {
        throw new Error('Unauthorized: Cannot create users');
      }

      if (!profileData.username || !profileData.password) {
        throw new Error('Username and password are required');
      }

      const profiles = this.getAllProfiles();
      if (profiles.find(p => p.username === profileData.username)) {
        throw new Error('Username already exists');
      }

      if (!this.getRoleConfig(profileData.role || 'viewer')) {
        throw new Error('Invalid role specified');
      }

      const newProfile = {
        id: this.generateProfileId(),
        username: profileData.username,
        password: this.hashPassword(profileData.password),
        role: profileData.role || 'viewer',
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        department: profileData.department || '',
        customPermissions: profileData.customPermissions || null,
        reportAccessOverride: profileData.reportAccessOverride || null,
        reportLimitOverride: profileData.reportLimitOverride || null,
        createdAt: new Date().toISOString(),
        createdBy: creatorId,
        isActive: true,
        lastLogin: null,
        loginCount: 0,
        lastModified: new Date().toISOString(),
        modifiedBy: creatorId
      };

      profiles.push(newProfile);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      this.logAudit('create_user', creatorId, `Created user: ${newProfile.username}`);

      console.log('✅ Profile created:', newProfile.username);
      return { success: true, profile: newProfile };

    } catch (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: error.message };
    }
  },

  updateProfile(profileId, updates, updaterId) {
    try {
      const updater = this.getProfileById(updaterId);
      if (!updater) {
        throw new Error('Unauthorized: Invalid updater');
      }

      const profiles = this.getAllProfiles();
      const profileIndex = profiles.findIndex(p => p.id === profileId);

      if (profileIndex === -1) {
        throw new Error('Profile not found');
      }

      const profile = profiles[profileIndex];

      if (updaterId !== profileId && !this.canModifyRoles(updater.role)) {
        throw new Error('Unauthorized: Cannot modify other users');
      }

      if (updates.role && updates.role !== profile.role) {
        if (!this.canModifyRoles(updater.role)) {
          throw new Error('Unauthorized: Cannot change user roles');
        }
        if (!this.getRoleConfig(updates.role)) {
          throw new Error('Invalid role specified');
        }
      }

      const updatedProfile = {
        ...profile,
        fullName: updates.fullName !== undefined ? updates.fullName : profile.fullName,
        email: updates.email !== undefined ? updates.email : profile.email,
        phone: updates.phone !== undefined ? updates.phone : profile.phone,
        department: updates.department !== undefined ? updates.department : profile.department,
        role: updates.role !== undefined ? updates.role : profile.role,
        customPermissions: updates.customPermissions !== undefined ? updates.customPermissions : profile.customPermissions,
        reportAccessOverride: updates.reportAccessOverride !== undefined ? updates.reportAccessOverride : profile.reportAccessOverride,
        reportLimitOverride: updates.reportLimitOverride !== undefined ? updates.reportLimitOverride : profile.reportLimitOverride,
        isActive: updates.isActive !== undefined ? updates.isActive : profile.isActive,
        lastModified: new Date().toISOString(),
        modifiedBy: updaterId
      };

      if (updates.password) {
        updatedProfile.password = this.hashPassword(updates.password);
      }

      profiles[profileIndex] = updatedProfile;
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      this.logAudit('update_user', updaterId, `Updated user: ${updatedProfile.username}`);

      console.log('✅ Profile updated:', updatedProfile.username);
      return { success: true, profile: updatedProfile };

    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  },

  deleteProfile(profileId, deleterId) {
    try {
      const deleter = this.getProfileById(deleterId);
      if (!deleter || !this.canDeleteUsers(deleter.role)) {
        throw new Error('Unauthorized: Cannot delete users');
      }

      const profiles = this.getAllProfiles();
      const profile = profiles.find(p => p.id === profileId);

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (profile.role === 'superadmin') {
        throw new Error('Cannot delete super admin account');
      }

      if (profileId === deleterId) {
        throw new Error('Cannot delete your own account');
      }

      const filteredProfiles = profiles.filter(p => p.id !== profileId);
      localStorage.setItem('user_profiles', JSON.stringify(filteredProfiles));
      this.logAudit('delete_user', deleterId, `Deleted user: ${profile.username}`);

      console.log('✅ Profile deleted:', profile.username);
      return { success: true };

    } catch (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error: error.message };
    }
  },

  toggleUserStatus(profileId, isActive, updaterId) {
    return this.updateProfile(profileId, { isActive }, updaterId);
  },

  // ================================================
  // SECTION 5: AUTHENTICATION
  // ================================================

  login(username, password) {
    try {
      const profile = this.getProfileByUsername(username);

      if (!profile) {
        throw new Error('Invalid username or password');
      }

      if (!profile.isActive) {
        throw new Error('Account is disabled. Contact administrator.');
      }

      if (!this.verifyPassword(password, profile.password)) {
        throw new Error('Invalid username or password');
      }

      const profiles = this.getAllProfiles();
      const profileIndex = profiles.findIndex(p => p.id === profile.id);
      profiles[profileIndex].lastLogin = new Date().toISOString();
      profiles[profileIndex].loginCount = (profile.loginCount || 0) + 1;
      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      const session = {
        profileId: profile.id,
        username: profile.username,
        role: profile.role,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      localStorage.setItem('active_session', JSON.stringify(session));
      this.logAudit('login', profile.id, `User logged in: ${username}`);

      console.log('✅ Login successful:', username);
      return { success: true, profile: this.getSafeProfile(profile), session };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  logout() {
    try {
      const session = this.getActiveSession();

      if (session) {
        this.logAudit('logout', session.profileId, 'User logged out');
      }

      localStorage.setItem('active_session', JSON.stringify(null));
      console.log('✅ Logout successful');
      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  getActiveSession() {
    try {
      const session = localStorage.getItem('active_session');
      const parsedSession = session ? JSON.parse(session) : null;

      if (!parsedSession) return null;

      if (new Date(parsedSession.expiresAt) < new Date()) {
        this.logout();
        return null;
      }

      return parsedSession;

    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  getCurrentUser() {
    const session = this.getActiveSession();
    if (!session) return null;

    const profile = this.getProfileById(session.profileId);
    return profile ? this.getSafeProfile(profile) : null;
  },

  isAuthenticated() {
    return this.getActiveSession() !== null;
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'profile-login.html';
      return false;
    }
    return true;
  },

  // ================================================
  // SECTION 6: RBAC
  // ================================================

  getAllRoles() {
    return this.getAllRolesWithCustom().map(role => ({
      value: role.key,
      label: role.label,
      permissions: role.permissions,
      isSystem: role.isSystem || false
    }));
  },

  hasPermission(profileOrRole, permission) {
    const role = typeof profileOrRole === 'string' ? 
      profileOrRole : profileOrRole.role;

    const roleConfig = this.getRoleConfig(role);
    if (!roleConfig) return false;

    if (roleConfig.permissions.includes('all')) return true;

    return roleConfig.permissions.includes(permission);
  },

  canAccessReportType(profile, reportType) {
    const roleConfig = this.getRoleConfig(profile.role);
    if (!roleConfig) return false;

    if (profile.reportAccessOverride) {
      return profile.reportAccessOverride.includes(reportType);
    }

    return roleConfig.reportAccess.includes(reportType);
  },

  getReportLimit(profile) {
    if (profile.reportLimitOverride !== null && profile.reportLimitOverride !== undefined) {
      return profile.reportLimitOverride;
    }

    const roleConfig = this.getRoleConfig(profile.role);
    return roleConfig ? roleConfig.reportLimit : 0;
  },

  canCreateUsers(role) {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.canCreateUsers : false;
  },

  canDeleteUsers(role) {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.canDeleteUsers : false;
  },

  canModifyRoles(role) {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.canModifyRoles : false;
  },

  canAccessConfig(role) {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.canAccessConfig : false;
  },

  canGenerateReports(role) {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig ? roleConfig.canGenerateReports : false;
  },

  getFilteredReports(profile) {
    if (typeof Storage === 'undefined') {
      console.error('Storage module not available');
      return [];
    }

    try {
      let allReports = [];

      const roleConfig = this.getRoleConfig(profile.role);
      const accessTypes = profile.reportAccessOverride || roleConfig.reportAccess;

      accessTypes.forEach(type => {
        const reports = Storage.getAllReports(type);
        allReports = allReports.concat(reports);
      });

      const limit = this.getReportLimit(profile);
      if (limit !== null) {
        allReports = allReports.slice(0, limit);
      }

      return allReports;

    } catch (error) {
      console.error('Error filtering reports:', error);
      return [];
    }
  },

  // ================================================
  // SECTION 7: UTILITY
  // ================================================

  generateProfileId() {
    return 'PROFILE_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  hashPassword(password) {
    return btoa(password + '_hashed_' + password.length);
  },

  verifyPassword(inputPassword, hashedPassword) {
    return this.hashPassword(inputPassword) === hashedPassword;
  },

  getSafeProfile(profile) {
    const { password, ...safeProfile } = profile;
    return safeProfile;
  },

  getAllSafeProfiles() {
    return this.getAllProfiles().map(p => this.getSafeProfile(p));
  },

  logAudit(action, userId, details) {
    try {
      const auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');

      auditLog.unshift({
        id: 'AUDIT_' + Date.now(),
        action: action,
        userId: userId,
        details: details,
        timestamp: new Date().toISOString(),
        ipAddress: 'N/A',
        userAgent: navigator.userAgent
      });

      if (auditLog.length > 1000) {
        auditLog.length = 1000;
      }

      localStorage.setItem('audit_log', JSON.stringify(auditLog));

    } catch (error) {
      console.error('Error logging audit:', error);
    }
  },

  getAuditLog(limit = 100) {
    try {
      const auditLog = JSON.parse(localStorage.getItem('audit_log') || '[]');
      return auditLog.slice(0, limit);
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  },

  exportUsers() {
    try {
      const profiles = this.getAllSafeProfiles();
      const dataStr = JSON.stringify(profiles, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${Date.now()}.json`;
      link.click();

      URL.revokeObjectURL(url);
      console.log('✅ Users exported');
      return true;
    } catch (error) {
      console.error('Error exporting users:', error);
      return false;
    }
  },

  getUserStatistics() {
    const profiles = this.getAllProfiles();

    const stats = {
      total: profiles.length,
      active: profiles.filter(p => p.isActive).length,
      inactive: profiles.filter(p => !p.isActive).length,
      byRole: {},
      recentLogins: profiles
        .filter(p => p.lastLogin)
        .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
        .slice(0, 10)
        .map(p => ({
          username: p.username,
          lastLogin: p.lastLogin,
          loginCount: p.loginCount
        }))
    };

    profiles.forEach(p => {
      stats.byRole[p.role] = (stats.byRole[p.role] || 0) + 1;
    });

    return stats;
  }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ProfileManager.initialize());
} else {
  ProfileManager.initialize();
}
