// ================================================
// PROFILE MANAGER - ALL BUGS FIXED
// ================================================

const ProfileManager = {
  // Security configuration
  security: {
    saltRounds: 10,
    jwtSecret: 'CHANGE_THIS_IN_PRODUCTION_' + Date.now(),
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 900000 // 15 minutes
  },

  initialize() {
    console.log('🔐 Initializing Profile Manager...');

    try {
      // Initialize storage
      if (!localStorage.getItem('user_profiles')) {
        localStorage.setItem('user_profiles', JSON.stringify([]));
      }

      if (!localStorage.getItem('staff_profiles')) {
        localStorage.setItem('staff_profiles', JSON.stringify([]));
      }

      if (!localStorage.getItem('active_session')) {
        localStorage.setItem('active_session', JSON.stringify(null));
      }

      if (!localStorage.getItem('current_session')) {
        localStorage.setItem('current_session', JSON.stringify(null));
      }

      if (!localStorage.getItem('login_attempts')) {
        localStorage.setItem('login_attempts', JSON.stringify({}));
      }

      // Validate existing session
      this.validateSession();

      console.log('✅ Profile Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Profile Manager initialization failed:', error);
      return false;
    }
  },

  // Password hashing
  async hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + this.security.jwtSecret);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Hash error:', error);
      return this.simpleHash(password);
    }
  },

  simpleHash(str) {
    let hash = 0;
    const salt = this.security.jwtSecret;
    const input = str + salt;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  },

  async verifyPassword(password, hashedPassword) {
    try {
      const hash = await this.hashPassword(password);
      return hash === hashedPassword;
    } catch (error) {
      console.error('Verify password error:', error);
      return false;
    }
  },

  // JWT Token generation
  generateToken(payload) {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const now = Date.now();

      const tokenPayload = {
        ...payload,
        iat: now,
        exp: now + this.security.sessionTimeout
      };

      const base64Header = btoa(JSON.stringify(header));
      const base64Payload = btoa(JSON.stringify(tokenPayload));
      const signature = this.simpleHash(base64Header + '.' + base64Payload);

      return `${base64Header}.${base64Payload}.${signature}`;
    } catch (error) {
      console.error('Generate token error:', error);
      return null;
    }
  },

  verifyToken(token) {
    try {
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;
      const expectedSignature = this.simpleHash(header + '.' + payload);
      
      if (signature !== expectedSignature) {
        console.warn('Invalid token signature');
        return null;
      }

      const decoded = JSON.parse(atob(payload));

      if (decoded.exp && Date.now() > decoded.exp) {
        console.warn('Token expired');
        this.logout();
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  },

  // Login attempts tracking
  checkLoginAttempts(username) {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
      const userAttempts = attempts[username];

      if (!userAttempts) {
        return { allowed: true, remaining: this.security.maxLoginAttempts };
      }

      if (userAttempts.lockedUntil && Date.now() < userAttempts.lockedUntil) {
        const remainingTime = Math.ceil((userAttempts.lockedUntil - Date.now()) / 60000);
        return { 
          allowed: false, 
          locked: true,
          remainingTime: remainingTime
        };
      }

      if (userAttempts.lockedUntil && Date.now() >= userAttempts.lockedUntil) {
        attempts[username] = { count: 0, lockedUntil: null };
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
        return { allowed: true, remaining: this.security.maxLoginAttempts };
      }

      const remaining = this.security.maxLoginAttempts - (userAttempts.count || 0);
      return { 
        allowed: remaining > 0, 
        remaining: remaining > 0 ? remaining : 0 
      };
    } catch (error) {
      console.error('Login attempt check error:', error);
      return { allowed: true, remaining: this.security.maxLoginAttempts };
    }
  },

  recordFailedLogin(username) {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');

      if (!attempts[username]) {
        attempts[username] = { count: 0, lockedUntil: null };
      }

      attempts[username].count = (attempts[username].count || 0) + 1;

      if (attempts[username].count >= this.security.maxLoginAttempts) {
        attempts[username].lockedUntil = Date.now() + this.security.lockoutDuration;
        attempts[username].count = 0;
        console.warn(`Account locked: ${username}`);
      }

      localStorage.setItem('login_attempts', JSON.stringify(attempts));
    } catch (error) {
      console.error('Failed login record error:', error);
    }
  },

  recordSuccessfulLogin(username) {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');

      if (attempts[username]) {
        attempts[username] = { count: 0, lockedUntil: null };
        localStorage.setItem('login_attempts', JSON.stringify(attempts));
      }
    } catch (error) {
      console.error('Successful login record error:', error);
    }
  },

  // Get all profiles
  getAllProfiles() {
    try {
      let profiles = localStorage.getItem('user_profiles');
      if (!profiles || profiles === '[]') {
        profiles = localStorage.getItem('staff_profiles');
      }
      return profiles ? JSON.parse(profiles) : [];
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  },

  // Create new profile
  async createProfile(profileData) {
    try {
      const profiles = this.getAllProfiles();

      if (!profileData.username || !profileData.password || !profileData.role) {
        throw new Error('Username, password, and role are required');
      }

      if (profiles.find(p => p.username.toLowerCase() === profileData.username.toLowerCase())) {
        throw new Error('Username already exists');
      }

      const hashedPassword = await this.hashPassword(profileData.password);

      const newProfile = {
        id: this.generateProfileId(),
        username: profileData.username.trim(),
        password: hashedPassword,
        role: profileData.role,
        accessLevel: profileData.accessLevel || 1,
        fullName: profileData.fullName?.trim() || profileData.username,
        email: profileData.email?.trim() || '',
        phone: profileData.phone?.trim() || '',
        createdAt: new Date().toISOString(),
        createdBy: this.getCurrentUser()?.username || 'admin',
        isActive: true,
        lastLogin: null,
        loginCount: 0
      };

      profiles.push(newProfile);
      
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('staff_profiles', JSON.stringify(profiles));

      console.log('✓ Profile created:', newProfile.username);
      return { success: true, profile: { ...newProfile, password: '[HIDDEN]' } };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update profile
  async updateProfile(profileId, updates) {
    try {
      const profiles = this.getAllProfiles();
      const index = profiles.findIndex(p => p.id === profileId);

      if (index === -1) {
        throw new Error('Profile not found');
      }

      if (updates.password) {
        updates.password = await this.hashPassword(updates.password);
      }

      delete updates.id;
      delete updates.username;

      profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: this.getCurrentUser()?.username || 'admin'
      };

      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('staff_profiles', JSON.stringify(profiles));

      console.log('✓ Profile updated:', profiles[index].username);
      return { success: true, profile: { ...profiles[index], password: '[HIDDEN]' } };
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

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === profileId) {
        throw new Error('Cannot delete your own profile while logged in');
      }

      profiles = profiles.filter(p => p.id !== profileId);
      
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('staff_profiles', JSON.stringify(profiles));

      console.log('✓ Profile deleted:', profile.username);
      return { success: true };
    } catch (error) {
      console.error('Profile deletion error:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle profile status
  toggleProfileStatus(profileId) {
    try {
      const profiles = this.getAllProfiles();
      const index = profiles.findIndex(p => p.id === profileId);

      if (index === -1) {
        throw new Error('Profile not found');
      }

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === profileId) {
        throw new Error('Cannot disable your own profile while logged in');
      }

      profiles[index].isActive = !profiles[index].isActive;
      profiles[index].updatedAt = new Date().toISOString();
      profiles[index].updatedBy = currentUser?.username || 'admin';

      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('staff_profiles', JSON.stringify(profiles));

      console.log('✓ Profile status toggled:', profiles[index].username, '- Active:', profiles[index].isActive);
      return { success: true, profile: { ...profiles[index], password: '[HIDDEN]' } };
    } catch (error) {
      console.error('Profile status toggle error:', error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // AUTHENTICATE - COMPLETE FIX
  // ==========================================

  async authenticate(username, password) {
    try {
      console.log('🔐 Authenticating:', username);

      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      const trimmedUsername = username.trim().toLowerCase();

      // Check login attempts
      const attemptCheck = this.checkLoginAttempts(trimmedUsername);
      if (!attemptCheck.allowed) {
        if (attemptCheck.locked) {
          throw new Error(`Account locked. Try again in ${attemptCheck.remainingTime} minutes.`);
        }
        throw new Error(`Too many failed attempts. ${attemptCheck.remaining} attempts remaining.`);
      }

      // ADMIN LOGIN - PLAIN TEXT PASSWORD CHECK
      if (trimmedUsername === 'admin') {
        if (password === 'admin123') {
          const adminSession = {
            username: 'admin',
            role: 'admin',
            accessLevel: 0,
            fullName: 'System Administrator',
            isAdmin: true,
            loginTime: new Date().toISOString()
          };

          const token = this.generateToken(adminSession);
          const sessionData = { ...adminSession, token };

          localStorage.setItem('active_session', JSON.stringify(sessionData));
          localStorage.setItem('current_session', JSON.stringify(sessionData));
          
          this.recordSuccessfulLogin(trimmedUsername);

          console.log('✅ Admin logged in successfully');
          return { success: true, user: adminSession, isAdmin: true, token };
        } else {
          this.recordFailedLogin(trimmedUsername);
          throw new Error('Invalid admin credentials');
        }
      }

      // STAFF LOGIN - HASHED PASSWORD CHECK
      const profiles = this.getAllProfiles();
      const profile = profiles.find(p => p.username.toLowerCase() === trimmedUsername);

      if (!profile) {
        this.recordFailedLogin(trimmedUsername);
        throw new Error('Invalid username or password');
      }

      if (!profile.isActive) {
        throw new Error('Account is disabled. Contact administrator.');
      }

      const isValidPassword = await this.verifyPassword(password, profile.password);

      if (!isValidPassword) {
        this.recordFailedLogin(trimmedUsername);
        throw new Error('Invalid username or password');
      }

      // Update profile stats
      const profileIndex = profiles.findIndex(p => p.id === profile.id);
      profiles[profileIndex].lastLogin = new Date().toISOString();
      profiles[profileIndex].loginCount = (profiles[profileIndex].loginCount || 0) + 1;
      
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      localStorage.setItem('staff_profiles', JSON.stringify(profiles));

      const session = {
        id: profile.id,
        username: profile.username,
        role: profile.role,
        accessLevel: profile.accessLevel,
        fullName: profile.fullName,
        email: profile.email,
        isAdmin: false,
        loginTime: new Date().toISOString()
      };

      const token = this.generateToken(session);
      const sessionData = { ...session, token };

      localStorage.setItem('active_session', JSON.stringify(sessionData));
      localStorage.setItem('current_session', JSON.stringify(sessionData));
      
      this.recordSuccessfulLogin(trimmedUsername);

      console.log('✅ User logged in:', profile.username, '- Role:', profile.role);
      return { success: true, user: session, isAdmin: false, token };

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return { success: false, error: error.message };
    }
  },

  // Session validation
  validateSession() {
    try {
      let sessionData = localStorage.getItem('current_session');
      if (!sessionData || sessionData === 'null') {
        sessionData = localStorage.getItem('active_session');
      }
      
      if (!sessionData || sessionData === 'null') return false;

      const session = JSON.parse(sessionData);

      if (session.token) {
        const decoded = this.verifyToken(session.token);
        if (!decoded) {
          this.logout();
          return false;
        }
      }

      if (session.loginTime) {
        const loginTime = new Date(session.loginTime).getTime();
        const now = Date.now();

        if (now - loginTime > this.security.sessionTimeout) {
          console.warn('Session expired');
          this.logout();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      this.logout();
      return false;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('active_session');
    localStorage.removeItem('current_session');
    console.log('✓ User logged out');
    return { success: true };
  },

  // Get current user
  getCurrentUser() {
    try {
      if (!this.validateSession()) return null;

      let session = localStorage.getItem('current_session');
      if (!session || session === 'null') {
        session = localStorage.getItem('active_session');
      }
      
      return session && session !== 'null' ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check if authenticated
  isAuthenticated() {
    return this.validateSession() && this.getCurrentUser() !== null;
  },

  // Check if admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.accessLevel === 0 || user.isAdmin === true || user.role === 'admin');
  },

  // Check report access
  hasAccessToReportType(reportType) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.accessLevel === 0 || user.isAdmin) return true;
    return user.role === reportType;
  },

  // Get accessible reports
  getAccessibleReports() {
    if (!this.isAuthenticated()) {
      return { police: [], medical: [], infrastructure: [] };
    }

    const user = this.getCurrentUser();
    if (!user) return { police: [], medical: [], infrastructure: [] };

    if (typeof Storage === 'undefined') {
      console.error('Storage module not loaded');
      return { police: [], medical: [], infrastructure: [] };
    }

    try {
      if (user.accessLevel === 0 || user.isAdmin) {
        return {
          police: Storage.getAllReports('police') || [],
          medical: Storage.getAllReports('medical') || [],
          infrastructure: Storage.getAllReports('infrastructure') || []
        };
      }

      const reports = { police: [], medical: [], infrastructure: [] };
      if (user.role && Storage.getAllReports) {
        reports[user.role] = Storage.getAllReports(user.role) || [];
      }
      return reports;
    } catch (error) {
      console.error('Get accessible reports error:', error);
      return { police: [], medical: [], infrastructure: [] };
    }
  },

  // Generate profile ID
  generateProfileId() {
    return 'PROF-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  },

  // Get profile by ID
  getProfileById(profileId) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === profileId) || null;
  },

  // Get profile by username
  getProfileByUsername(username) {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
  },

  // Get profiles by role
  getProfilesByRole(role) {
    const profiles = this.getAllProfiles();
    return profiles.filter(p => p.role === role);
  },

  // Get statistics
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
  },

  // Clear login attempts
  clearLoginAttempts(username) {
    try {
      const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
      delete attempts[username];
      localStorage.setItem('login_attempts', JSON.stringify(attempts));
      console.log('✓ Login attempts cleared for:', username);
    } catch (error) {
      console.error('Clear attempts error:', error);
    }
  },

  // Get security info
  getSecurityInfo() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      username: user.username,
      role: user.role,
      accessLevel: user.accessLevel,
      loginTime: user.loginTime,
      sessionValid: this.validateSession(),
      timeRemaining: user.loginTime ? 
        Math.max(0, this.security.sessionTimeout - (Date.now() - new Date(user.loginTime).getTime())) :
        0
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
