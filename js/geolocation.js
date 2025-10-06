// ================================================
// GEOLOCATION MODULE - COMPLETE & FIXED
// ================================================

const Geolocation = {
  // Get current location with high accuracy
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      console.log('📍 Requesting location...');

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Geolocation not supported by your browser', 'error');
        }
        
        // Return mock location as fallback
        resolve(this.getMockLocation());
        return;
      }

      // Show loading
      if (typeof Utils !== 'undefined' && Utils.showLoading) {
        Utils.showLoading('📍 Getting your location...');
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Hide loading
          if (typeof Utils !== 'undefined' && Utils.hideLoading) {
            Utils.hideLoading();
          }

          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            isReal: true
          };

          console.log('✅ Location acquired:', location.latitude.toFixed(6), location.longitude.toFixed(6));
          
          if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('Location acquired successfully', 'success');
          }

          resolve(location);
        },
        (error) => {
          // Hide loading
          if (typeof Utils !== 'undefined' && Utils.hideLoading) {
            Utils.hideLoading();
          }

          console.error('Geolocation error:', error);
          
          let errorMessage = 'Failed to get location';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Using approximate location.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Using approximate location.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using approximate location.';
              break;
          }

          console.warn(errorMessage);
          
          if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(errorMessage, 'warning');
          }

          // Return mock location as fallback
          resolve(this.getMockLocation());
        },
        options
      );
    });
  },

  // Get mock location (Bangalore coordinates)
  getMockLocation() {
    console.log('📍 Using mock location (Bangalore)');
    
    // Random location in Bangalore area
    const bangaloreBase = {
      lat: 12.9716,
      lng: 77.5946
    };

    // Add small random offset (within ~5km)
    const offset = 0.05;
    const randomLat = bangaloreBase.lat + (Math.random() - 0.5) * offset;
    const randomLng = bangaloreBase.lng + (Math.random() - 0.5) * offset;

    return {
      latitude: randomLat,
      longitude: randomLng,
      accuracy: 100,
      timestamp: new Date().toISOString(),
      isReal: false,
      note: 'Mock location - enable GPS for accurate location'
    };
  },

  // Watch position (continuous tracking)
  watchPosition(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          isReal: true
        };
        
        if (callback) callback(location);
      },
      (error) => {
        console.error('Watch position error:', error);
        if (callback) callback(this.getMockLocation());
      },
      options
    );

    console.log('✓ Started watching position:', watchId);
    return watchId;
  },

  // Stop watching position
  stopWatchingPosition(watchId) {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
      console.log('✓ Stopped watching position:', watchId);
    }
  },

  // Calculate distance between two points (in km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  },

  // Convert degrees to radians
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  },

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoords(latitude, longitude) {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          success: true,
          address: data.display_name,
          city: data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state,
          country: data.address?.country,
          postcode: data.address?.postcode
        };
      }
      
      return { success: false, error: 'Address not found' };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { success: false, error: error.message };
    }
  },

  // Format location for display
  formatLocation(location) {
    if (!location) return 'Location unavailable';
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  },

  // Check if location is within bounds
  isWithinBounds(location, bounds) {
    return location.latitude >= bounds.south &&
           location.latitude <= bounds.north &&
           location.longitude >= bounds.west &&
           location.longitude <= bounds.east;
  }
};

// Make available globally
window.Geolocation = Geolocation;

console.log('✅ Geolocation module loaded');
