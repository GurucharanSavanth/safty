// ================================================
// HOSPITAL FINDER MODULE - LIVE DATA
// Uses Overpass API (OpenStreetMap) for real-time hospital locations
// Implements Prim's Algorithm for optimal hospital selection
// ================================================

const HospitalFinder = {

  currentResults: null,
  cache: new Map(), // Cache results to reduce API calls
  CACHE_DURATION: 300000, // 5 minutes in milliseconds

  /**
   * Find nearby hospitals using live data from Overpass API
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @param {string} severity - Emergency severity level
   * @param {number} radiusKm - Search radius in kilometers (default 10km)
   * @returns {Promise<Object>} {nearest, alternatives, userLocation, severity, timestamp}
   */
  async findNearbyHospitals(latitude, longitude, severity, radiusKm = 10) {
    console.log('🏥 Finding hospitals near:', latitude, longitude, 'Severity:', severity, 'Radius:', radiusKm, 'km');

    try {
      const userLocation = { latitude, longitude };

      // Check cache first
      const cacheKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}_${radiusKm}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        console.log('📦 Using cached hospital data');
        return this.processHospitalResults(cached, userLocation, severity);
      }

      // Fetch live hospital data from Overpass API
      const hospitals = await this.fetchHospitalsFromOverpass(latitude, longitude, radiusKm);

      if (!hospitals || hospitals.length === 0) {
        throw new Error('No hospitals found in the area. Please increase search radius or check your location.');
      }

      console.log(`✅ Found ${hospitals.length} hospitals from OpenStreetMap`);

      // Cache the results
      this.setCache(cacheKey, hospitals);

      // Process and return results
      return this.processHospitalResults(hospitals, userLocation, severity);

    } catch (error) {
      console.error('❌ Error finding hospitals:', error);
      throw error;
    }
  },

  /**
   * Process hospital results using Prim's algorithm
   */
  processHospitalResults(hospitals, userLocation, severity) {
    // Use Prim's algorithm to find nearest hospital
    const nearestResult = PrimAlgorithm.findNearestHospital(userLocation, hospitals);

    if (!nearestResult) {
      throw new Error('Could not determine nearest hospital');
    }

    // Also get top 5 alternatives for comparison
    const alternatives = PrimAlgorithm.findNearestHospitals(userLocation, hospitals, 5);

    this.currentResults = {
      nearest: nearestResult,
      alternatives: alternatives,
      userLocation: userLocation,
      severity: severity,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 Nearest hospital:', nearestResult.hospital.name, '(', nearestResult.distance.toFixed(2), 'km )');

    return this.currentResults;
  },

  /**
   * Fetch hospitals from Overpass API (OpenStreetMap)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Promise<Array>} Array of hospital objects
   */
  async fetchHospitalsFromOverpass(lat, lon, radiusKm) {
    const radiusMeters = radiusKm * 1000;

    // Overpass API query to find hospitals
    // Searches for nodes, ways, and relations tagged as hospitals
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
        way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
        relation["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      );
      out center;
    `;

    try {
      console.log('🌐 Fetching hospitals from Overpass API...');

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        console.warn('⚠️ No hospitals found in Overpass data');
        return [];
      }

      // Parse and format hospital data
      const hospitals = data.elements.map(element => this.parseHospitalElement(element)).filter(h => h !== null);

      console.log(`✅ Parsed ${hospitals.length} valid hospitals`);

      return hospitals;

    } catch (error) {
      console.error('❌ Overpass API fetch error:', error);
      throw new Error('Failed to fetch hospital data from OpenStreetMap. Please try again.');
    }
  },

  /**
   * Parse hospital element from Overpass API response
   */
  parseHospitalElement(element) {
    try {
      // Get coordinates
      let latitude, longitude;

      if (element.type === 'node') {
        latitude = element.lat;
        longitude = element.lon;
      } else if (element.center) {
        latitude = element.center.lat;
        longitude = element.center.lon;
      } else if (element.lat && element.lon) {
        latitude = element.lat;
        longitude = element.lon;
      } else {
        return null; // Skip if no coordinates
      }

      // Extract tags
      const tags = element.tags || {};

      // Get hospital name
      const name = tags.name || tags['name:en'] || tags['official_name'] || 'Unnamed Hospital';

      // Get address components
      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const city = tags['addr:city'] || '';
      const state = tags['addr:state'] || '';
      const postcode = tags['addr:postcode'] || '';
      const full_address = tags['addr:full'] || '';

      // Build address string
      let address = full_address;
      if (!address) {
        const parts = [housenumber, street, city, state, postcode].filter(p => p);
        address = parts.join(', ') || 'Address not available';
      }

      // Get contact info
      const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || 'N/A';
      const email = tags.email || tags['contact:email'] || null;
      const website = tags.website || tags['contact:website'] || null;

      // Get hospital details
      const emergency = tags.emergency === 'yes' || tags['emergency:room'] === 'yes';
      const beds = tags.beds ? parseInt(tags.beds) : null;
      const operator = tags.operator || null;

      return {
        id: `OSM_${element.type}_${element.id}`,
        name: name,
        latitude: latitude,
        longitude: longitude,
        address: address,
        phone: phone,
        email: email,
        website: website,
        type: tags.healthcare || tags['healthcare:speciality'] || 'Hospital',
        emergency: emergency,
        beds: beds,
        operator: operator,
        source: 'OpenStreetMap',
        osmType: element.type,
        osmId: element.id
      };

    } catch (error) {
      console.error('Error parsing hospital element:', error);
      return null;
    }
  },

  /**
   * Generate Google Maps directions URL
   */
  getDirectionsUrl(hospital, userLocation) {
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${hospital.latitude},${hospital.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  },

  /**
   * Notify hospital (store notification in localStorage)
   */
  notifyHospital(hospital, reportDetails) {
    const notification = {
      id: 'NOTIF_' + Date.now(),
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      reportId: reportDetails.reportId,
      severity: reportDetails.severity,
      patientLocation: reportDetails.location,
      distance: reportDetails.distance.toFixed(2) + ' km',
      estimatedTime: reportDetails.estimatedTime + ' min',
      timestamp: new Date().toISOString(),
      status: 'sent',
      message: `EMERGENCY: ${reportDetails.severity.toUpperCase()} medical case reported at ${reportDetails.distance.toFixed(2)}km from your hospital. Estimated travel time: ${reportDetails.estimatedTime} minutes.`
    };

    // Store in localStorage
    const notifications = JSON.parse(localStorage.getItem('hospital_notifications') || '[]');
    notifications.unshift(notification); // Add to beginning

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }

    localStorage.setItem('hospital_notifications', JSON.stringify(notifications));

    console.log('✅ Hospital notified:', notification);
    return notification;
  },

  /**
   * Get all hospital notifications
   */
  getAllNotifications() {
    return JSON.parse(localStorage.getItem('hospital_notifications') || '[]');
  },

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      return cached.data;
    }
    return null;
  },

  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  },

  clearCache() {
    this.cache.clear();
    console.log('🗑️ Hospital cache cleared');
  }
};

console.log('✅ Hospital Finder module loaded (Live OpenStreetMap data)');
