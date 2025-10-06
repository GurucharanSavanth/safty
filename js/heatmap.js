// ================================================
// HEATMAP MODULE - Interactive Incident Visualization
// Complete with Leaflet.js Integration
// ================================================

const HeatMap = {
  map: null,
  heatLayer: null,
  markerCluster: null,
  currentReports: [],
  filters: {
    timeRange: 'all',
    type: 'all',
    status: 'all'
  },

  // Check if Leaflet is loaded
  checkDependencies() {
    if (typeof L === 'undefined') {
      console.error('Leaflet.js not loaded. Please include Leaflet CDN.');
      return false;
    }

    if (typeof L.heat === 'undefined') {
      console.warn('Leaflet.heat not loaded. Heatmap functionality disabled.');
    }

    if (typeof L.markerClusterGroup === 'undefined') {
      console.warn('Leaflet.markercluster not loaded. Clustering disabled.');
    }

    return true;
  },

  initialize(containerId = 'map', options = {}) {
    if (!this.checkDependencies()) {
      alert('Map libraries not loaded. Please refresh the page.');
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Map container not found:', containerId);
      return false;
    }

    // Default options
    const defaultOptions = {
      center: [12.9716, 77.5946], // Bangalore
      zoom: 12,
      minZoom: 10,
      maxZoom: 18
    };

    const mapOptions = { ...defaultOptions, ...options };

    try {
      // Initialize map
      this.map = L.map(containerId, {
        zoomControl: true,
        attributionControl: true
      }).setView(mapOptions.center, mapOptions.zoom);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: mapOptions.maxZoom,
        minZoom: mapOptions.minZoom
      }).addTo(this.map);

      // Initialize marker cluster group if available
      if (typeof L.markerClusterGroup !== 'undefined') {
        this.markerCluster = L.markerClusterGroup({
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 50,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let className = 'marker-cluster-';

            if (count < 10) className += 'small';
            else if (count < 50) className += 'medium';
            else className += 'large';

            return L.divIcon({
              html: '<div><span>' + count + '</span></div>',
              className: 'marker-cluster ' + className,
              iconSize: L.point(40, 40)
            });
          }
        });
        this.map.addLayer(this.markerCluster);
      }

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        imperial: false
      }).addTo(this.map);

      console.log('✓ HeatMap initialized successfully');
      return true;
    } catch (error) {
      console.error('Map initialization error:', error);
      return false;
    }
  },

  loadReports(reports, applyFilters = true) {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }

    this.currentReports = reports || [];

    // Apply filters if needed
    let displayReports = applyFilters ? this.applyFilters(this.currentReports) : this.currentReports;

    // Clear existing layers
    this.clearLayers();

    const validReports = displayReports.filter(r => 
      r.location && 
      r.location.isReal && 
      r.location.latitude && 
      r.location.longitude &&
      !isNaN(r.location.latitude) && 
      !isNaN(r.location.longitude)
    );

    if (validReports.length === 0) {
      console.log('No valid reports to display');
      this.showNoDataMessage();
      return;
    }

    // Create heatmap
    this.createHeatmap(validReports);

    // Create markers
    this.createMarkers(validReports);

    // Fit bounds to show all markers
    this.fitBounds(validReports);

    console.log(`✓ Loaded ${validReports.length} reports on map`);
  },

  createHeatmap(reports) {
    if (typeof L.heat === 'undefined') return;

    const heatData = reports.map(r => {
      const intensity = this.calculateIntensity(r);
      return [r.location.latitude, r.location.longitude, intensity];
    });

    this.heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 35,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.0: '#00FF00',  // Green (low)
        0.3: '#FFFF00',  // Yellow (medium-low)
        0.6: '#FFA500',  // Orange (medium-high)
        1.0: '#FF0000'   // Red (high)
      }
    }).addTo(this.map);
  },

  createMarkers(reports) {
    if (!this.markerCluster && !this.map) return;

    reports.forEach(report => {
      const marker = this.createMarker(report);
      if (this.markerCluster) {
        this.markerCluster.addLayer(marker);
      } else {
        marker.addTo(this.map);
      }
    });
  },

  createMarker(report) {
    const icons = { police: '🚔', medical: '🚑', infrastructure: '🏗️' };
    const colors = { police: '#3b82f6', medical: '#ef4444', infrastructure: '#f59e0b' };

    const customIcon = L.divIcon({
      html: `<div class="custom-map-marker" style="background: ${colors[report.type]}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer;">${icons[report.type]}</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const marker = L.marker(
      [report.location.latitude, report.location.longitude],
      { icon: customIcon, title: report.id }
    );

    marker.bindPopup(this.createPopupContent(report), {
      maxWidth: 320,
      className: 'custom-popup'
    });

    return marker;
  },

  createPopupContent(report) {
    const icons = { police: '🚔', medical: '🚑', infrastructure: '🏗️' };
    const colors = { police: '#3b82f6', medical: '#ef4444', infrastructure: '#f59e0b' };
    const statusColors = { pending: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#22c55e' };

    return `
      <div style="min-width: 280px; font-family: 'Inter', sans-serif;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0;">
          <span style="font-size: 2rem;">${icons[report.type]}</span>
          <div>
            <div style="font-weight: 700; font-size: 1.1rem; color: ${colors[report.type]};">
              ${report.id}
            </div>
            <div style="font-size: 0.875rem; color: #64748b; text-transform: capitalize;">
              ${report.type} Report
            </div>
          </div>
        </div>

        <div style="display: grid; gap: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-weight: 600;">Status:</span>
            <span style="padding: 2px 10px; background: ${statusColors[report.status]}; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              ${report.status}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-weight: 600;">Date:</span>
            <span style="color: #1e293b; font-size: 0.875rem;">${report.timestamp?.full || new Date(report.createdAt).toLocaleString()}</span>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-weight: 600;">Location:</span>
            <span style="color: #1e293b; font-size: 0.875rem;">
              ${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}
            </span>
          </div>
        </div>

        ${report.photo ? `
          <img src="${report.photo}" 
               style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin: 12px 0; cursor: pointer;" 
               onclick="window.open(this.src, '_blank')"
               alt="Report photo">
        ` : ''}

        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button onclick="viewReportFromMap('${report.type}', '${report.id}')" 
                  style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.3s;"
                  onmouseover="this.style.background='#2563eb'"
                  onmouseout="this.style.background='#3b82f6'">
            📋 View Details
          </button>
          <a href="https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}" 
             target="_blank" 
             rel="noopener"
             style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem; text-decoration: none; text-align: center; transition: all 0.3s;"
             onmouseover="this.style.background='#059669'"
             onmouseout="this.style.background='#10b981'">
            🗺️ Google Maps
          </a>
        </div>
      </div>
    `;
  },

  calculateIntensity(report) {
    let intensity = 0.3; // Base intensity

    // Type-based intensity
    if (report.type === 'medical') intensity += 0.35;
    else if (report.type === 'police') intensity += 0.25;
    else intensity += 0.15;

    // Severity-based
    if (report.severity === 'high') intensity += 0.25;
    else if (report.severity === 'medium') intensity += 0.15;

    // Status-based (unresolved = higher intensity)
    if (report.status === 'pending') intensity += 0.15;
    else if (report.status === 'in-progress') intensity += 0.1;

    return Math.min(intensity, 1.0);
  },

  applyFilters(reports) {
    let filtered = [...reports];

    // Time range filter
    if (this.filters.timeRange !== 'all') {
      filtered = this.filterByTimeRange(filtered, this.filters.timeRange);
    }

    // Type filter
    if (this.filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === this.filters.type);
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === this.filters.status);
    }

    return filtered;
  },

  filterByTimeRange(reports, range) {
    const now = Date.now();
    const ranges = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const timeLimit = ranges[range] || Infinity;

    return reports.filter(r => {
      const reportTime = new Date(r.createdAt).getTime();
      return (now - reportTime) <= timeLimit;
    });
  },

  setFilter(filterType, value) {
    this.filters[filterType] = value;
    this.loadReports(this.currentReports, true);
    console.log('Filter applied:', filterType, '=', value);
  },

  clearLayers() {
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }

    if (this.markerCluster) {
      this.markerCluster.clearLayers();
    }
  },

  fitBounds(reports) {
    if (reports.length === 0) return;

    const bounds = L.latLngBounds(
      reports.map(r => [r.location.latitude, r.location.longitude])
    );

    this.map.fitBounds(bounds, { 
      padding: [50, 50],
      maxZoom: 15
    });
  },

  showNoDataMessage() {
    const center = this.map.getCenter();
    L.popup()
      .setLatLng(center)
      .setContent('<div style="text-align: center; padding: 20px;"><h3>📭 No Data</h3><p>No reports match the current filters</p></div>')
      .openOn(this.map);
  },

  setView(lat, lon, zoom = 15) {
    if (this.map) {
      this.map.setView([lat, lon], zoom);
    }
  },

  toggleHeatmap() {
    if (!this.heatLayer) return;

    if (this.map.hasLayer(this.heatLayer)) {
      this.map.removeLayer(this.heatLayer);
    } else {
      this.map.addLayer(this.heatLayer);
    }
  },

  toggleMarkers() {
    if (!this.markerCluster) return;

    if (this.map.hasLayer(this.markerCluster)) {
      this.map.removeLayer(this.markerCluster);
    } else {
      this.map.addLayer(this.markerCluster);
    }
  },

  exportMapImage() {
    alert('Map export feature: Use browser print or screenshot tools for now. Advanced export coming soon!');
  },

  destroy() {
    if (this.map) {
      this.clearLayers();
      this.map.remove();
      this.map = null;
    }
  }
};

// Global function for popup buttons
function viewReportFromMap(type, id) {
  if (typeof Storage !== 'undefined' && typeof Utils !== 'undefined') {
    const report = Storage.getReportById(type, id);
    if (report) {
      const locationInfo = typeof GeoLocation !== 'undefined' ? 
        GeoLocation.formatLocation(report.location) : 
        { display: `${report.location.latitude}, ${report.location.longitude}` };

      let html = `
        <div style="display: grid; gap: 16px;">
          <div><strong>Report ID:</strong> ${report.id}</div>
          <div><strong>Type:</strong> <span style="text-transform: capitalize;">${report.type}</span></div>
          <div><strong>Status:</strong> <span style="text-transform: capitalize; color: ${report.status === 'resolved' ? '#22c55e' : '#f59e0b'};">${report.status}</span></div>
          <div><strong>Created:</strong> ${report.timestamp?.full || new Date(report.createdAt).toLocaleString()}</div>
          <div><strong>Location:</strong> ${locationInfo.display}</div>
      `;

      if (report.photo) {
        html += `<div><strong>Photo:</strong><br><img src="${report.photo}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-top: 8px;"></div>`;
      }

      if (report.audio) {
        html += `<div><strong>Audio:</strong><br><audio controls src="${report.audio}" style="width: 100%; margin-top: 8px;"></audio></div>`;
      }

      html += `</div>`;

      Utils.createModal(`Report Details - ${report.id}`, html, [
        { label: 'Close', type: 'primary', action: "Utils.closeModal('dynamicModal')" }
      ]);
    }
  } else {
    alert('Report ID: ' + id + '\nType: ' + type);
  }
}

// Auto-initialize if DOM ready and container exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
      HeatMap.initialize();
    }
  });
} else {
  if (document.getElementById('map')) {
    HeatMap.initialize();
  }
}