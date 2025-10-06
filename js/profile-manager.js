// ================================================
// PROFILE MANAGEMENT MODULE - RBAC SYSTEM
// ================================================

const ProfileManager = {
  // Initialize profiles from localStorage
  initialize() {
    console.log('ðŸ” Initializing Profile Manager...');

    // Create profiles storage if doesn't exist
    if (!localStorage.getItem('user_profiles')) {
      localStorage.setItem('user_profiles', JSON.stringify([]));
    }

    // Create active session storage
    if (!localStorage.getItem('active_session')) {
      localStorage.setItem('active_session', JSON.stringify(null));
    }

    console.log('âœ… Profile Manager initialized');
  },

  // Get all profiles
  getAllProfiles() {
    try {
      const profiles = localStorage.getItem('user_profiles');
      return profiles ? JSON.parse(profiles) : [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  },

  // Create new profile
  createProfile(profileData) {
    try {
      const profiles = this.getAllProfiles();

      // Check if username already exists
      if (profiles.find(p => p.username === profileData.username)) {
        throw new Error('Username already exists');
      }

      const newProfile = {
        id: this.generateProfileId(),
        username: profileData.username,
        password: profileData.password, // In production, hash this!
        role: profileData.role, // 'police', 'medical', 'infrastructure'
        accessLevel: profileData.accessLevel || 1, // 0 = admin, 1 = staff
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        createdAt: new Date().toISOString(),
        createdBy: this.getCurrentUser()?.username || 'admin',
        isActive: true
      };

      profiles.push(newProfile);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      console.log('âœ“ Profile created:', newProfile.username);
      return { success: true, profile: newProfile };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update profile
  updateProfile(profileId, updates) {
    try {
      const profiles = this.getAllProfiles();
      const index = profiles.findIndex(p => p.id === profileId);

      if (index === -1) {
        throw new Error('Profile not found');
      }

      profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: this.getCurrentUser()?.username || 'admin'
      };

      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      console.log('âœ“ Profile updated:', profiles[index].username);
      return { success: true, profile: profiles[index] };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete profile
  deleteProfile(profileId) {
    try {
      let profiles = this.getAllProfiles();
      const profile = profiles.find(p => p.id === profileId);

      if (!profile) {
        throw new Error('Profile not found');
      }

      profiles = profiles.filter(p => p.id !== profileId);
      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      console.log('âœ“ Profile deleted:', profile.username);
      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle profile active status
  toggleProfileStatus(profileId) {
    try {
      const profiles = this.getAllProfiles();
      const index = profiles.findIndex(p => p.id === profileId);

      if (index === -1) {
        throw new Error('Profile not found');
      }

      profiles[index].isActive = !profiles[index].isActive;
      profiles[index].updatedAt = new Date().toISOString();

      localStorage.setItem('user_profiles', JSON.stringify(profiles));

      console.log('âœ“ Profile status toggled:', profiles[index].username);
      return { success: true, profile: profiles[index] };
    } catch (error) {
      console.error('Profile status toggle error:', error);
      return { success: false, error: error.message };
    }
  },

  // Authenticate user (admin or profile)
  authenticate(username, password) {
    try {
      // Check if admin
      if (username === 'admin' && password === 'admin123') {
        const adminSession = {
          username: 'admin',
          role: 'admin',
          accessLevel: 0,
          fullName: 'System Administrator',
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('active_session', JSON.stringify(adminSession));
        console.log('âœ“ Admin logged in');
        return { success: true, user: adminSession, isAdmin: true };
      }

      // Check profiles
      const profiles = this.getAllProfiles();
      const profile = profiles.find(p => 
        p.username === username && 
        p.password === password && 
        p.isActive
      );

      if (!profile) {
        throw new Error('Invalid credentials or account disabled');
      }

      const session = {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        accessLevel: profile.accessLevel,
        fullName: profile.fullName,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('active_session', JSON.stringify(session));
      console.log('âœ“ User logged in:', username);
      return { success: true, user: session, isAdmin: false };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('active_session');
    console.log('âœ“ User logged out');
  },

  // Get current logged in user
  getCurrentUser() {
    try {
      const session = localStorage.getItem('active_session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is logged in
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  // Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.accessLevel === 0;
  },

  // Check if user has access to specific report type
  hasAccessToReportType(reportType) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.accessLevel === 0) return true; // Admin has all access
    return user.role === reportType;
  },

  // Get reports accessible to current user
  getAccessibleReports() {
    const user = this.getCurrentUser();
    if (!user) return { police: [], medical: [], infrastructure: [] };

    if (user.accessLevel === 0) {
      // Admin sees all
      return {
        police: Storage.getAllReports('police'),
        medical: Storage.getAllReports('medical'),
        infrastructure: Storage.getAllReports('infrastructure')
      };
    }

    // Staff sees only their role's reports
    const reports = { police: [], medical: [], infrastructure: [] };
    reports[user.role] = Storage.getAllReports(user.role);
    return reports;
  },

  // Generate unique profile ID
  generateProfileId() {
    return 'PROF-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  },

  // Get profile by ID
  getProfileById(profileId) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === profileId);
  },

  // Get profiles by role
  getProfilesByRole(role) {
    const profiles = this.getAllProfiles();
    return profiles.filter(p => p.role === role);
  },

  // Get profile statistics
  getStatistics() {
    const profiles = this.getAllProfiles();
    return {
      total: profiles.length,
      active: profiles.filter(p => p.isActive).length,
      inactive: profiles.filter(p => !p.isActive).length,
      byRole: {
        police: profiles.filter(p => p.role === 'police').length,
        medical: profiles.filter(p => p.role === 'medical').length,
        infrastructure: profiles.filter(p => p.role === 'infrastructure').length
      }
    };
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ProfileManager.initialize();
  });
} else {
  ProfileManager.initialize();
}