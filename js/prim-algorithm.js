// ================================================
// PRIM'S ALGORITHM MODULE
// Minimum Spanning Tree for Nearest Hospital Finding
// ================================================

const PrimAlgorithm = {

  /**
   * Calculate distance between two geographic points using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  },

  /**
   * Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  },

  /**
   * Build adjacency matrix (graph) from user location and hospitals
   * @param {Object} userLocation - {latitude, longitude}
   * @param {Array} hospitals - Array of hospital objects with latitude/longitude
   * @returns {Array} 2D adjacency matrix representing distances
   */
  buildGraph(userLocation, hospitals) {
    const n = hospitals.length + 1; // +1 for user location as node 0
    const graph = Array(n).fill(null).map(() => Array(n).fill(Infinity));

    // Node 0 is user location
    // Nodes 1 to n are hospitals
    for (let i = 0; i < hospitals.length; i++) {
      // Distance from user to hospital i
      const distToUser = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hospitals[i].latitude,
        hospitals[i].longitude
      );

      graph[0][i + 1] = distToUser;
      graph[i + 1][0] = distToUser; // Graph is undirected

      // Distance between hospitals (for MST construction)
      for (let j = i + 1; j < hospitals.length; j++) {
        const dist = this.calculateDistance(
          hospitals[i].latitude,
          hospitals[i].longitude,
          hospitals[j].latitude,
          hospitals[j].longitude
        );
        graph[i + 1][j + 1] = dist;
        graph[j + 1][i + 1] = dist; // Symmetric
      }
    }

    return graph;
  },

  /**
   * Prim's algorithm to find Minimum Spanning Tree
   * @param {Array} graph - Adjacency matrix
   * @returns {Object} {parent: Array, key: Array} - MST structure
   */
  findMST(graph) {
    const n = graph.length;
    const visited = Array(n).fill(false);
    const parent = Array(n).fill(-1);
    const key = Array(n).fill(Infinity);

    // Start from user location (node 0)
    key[0] = 0;

    for (let count = 0; count < n - 1; count++) {
      // Find minimum key vertex not yet included in MST
      let minKey = Infinity;
      let minIndex = -1;

      for (let v = 0; v < n; v++) {
        if (!visited[v] && key[v] < minKey) {
          minKey = key[v];
          minIndex = v;
        }
      }

      if (minIndex === -1) break; // No more vertices to add

      visited[minIndex] = true;

      // Update key values of adjacent vertices
      for (let v = 0; v < n; v++) {
        if (graph[minIndex][v] !== Infinity && 
            !visited[v] && 
            graph[minIndex][v] < key[v]) {
          parent[v] = minIndex;
          key[v] = graph[minIndex][v];
        }
      }
    }

    return { parent, key };
  },

  /**
   * Find nearest hospital using Prim's algorithm
   * @param {Object} userLocation - {latitude, longitude}
   * @param {Array} hospitals - Array of hospital objects
   * @returns {Object} {hospital, distance, estimatedTime}
   */
  findNearestHospital(userLocation, hospitals) {
    if (!hospitals || hospitals.length === 0) {
      return null;
    }

    // Build graph with user as node 0
    const graph = this.buildGraph(userLocation, hospitals);

    // Apply Prim's algorithm to find MST
    const { parent, key } = this.findMST(graph);

    // Find nearest hospital (minimum key value directly connected to user node 0)
    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 1; i < key.length; i++) {
      if (parent[i] === 0 && key[i] < minDistance) {
        minDistance = key[i];
        nearestIndex = i - 1; // Adjust for hospital array index
      }
    }

    // If no direct connection found, use simple distance calculation as fallback
    if (nearestIndex === -1) {
      nearestIndex = 0;
      minDistance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hospitals[0].latitude,
        hospitals[0].longitude
      );

      for (let i = 1; i < hospitals.length; i++) {
        const dist = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hospitals[i].latitude,
          hospitals[i].longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }
    }

    // Calculate estimated travel time (assuming average speed of 40 km/h in city)
    const estimatedTime = Math.ceil((minDistance / 40) * 60); // in minutes

    return {
      hospital: hospitals[nearestIndex],
      distance: minDistance,
      estimatedTime: estimatedTime
    };
  },

  /**
   * Find top N nearest hospitals sorted by distance
   * @param {Object} userLocation - {latitude, longitude}
   * @param {Array} hospitals - Array of hospital objects
   * @param {number} count - Number of hospitals to return
   * @returns {Array} Array of {hospital, distance, estimatedTime}
   */
  findNearestHospitals(userLocation, hospitals, count = 3) {
    if (!hospitals || hospitals.length === 0) {
      return [];
    }

    // Calculate distance for each hospital
    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hospital.latitude,
        hospital.longitude
      );

      return {
        hospital: hospital,
        distance: distance,
        estimatedTime: Math.ceil((distance / 40) * 60)
      };
    });

    // Sort by distance (ascending)
    hospitalsWithDistance.sort((a, b) => a.distance - b.distance);

    // Return top N
    return hospitalsWithDistance.slice(0, Math.min(count, hospitalsWithDistance.length));
  }
};

console.log('✅ Prim\'s Algorithm module loaded');
