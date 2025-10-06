// ================================================
// AI ANALYTICS MODULE - DBSCAN + LLM ANALYSIS
// ================================================

const AIAnalytics = {
  config: {
    currentProvider: 'gemini', // 'gemini' or 'openai'
    dbscan: {
      epsilon: 0.05, // Distance threshold (in km, ~5km radius)
      minPoints: 3    // Minimum reports to form a cluster
    }
  },

  // Load API keys from localStorage
  loadAPIKeys() {
    return {
      gemini: localStorage.getItem('ai_gemini_key') || '',
      openai: localStorage.getItem('ai_openai_key') || ''
    };
  },

  // Save API keys to localStorage
  setAPIKeys(geminiKey, openaiKey) {
    if (geminiKey) localStorage.setItem('ai_gemini_key', geminiKey);
    if (openaiKey) localStorage.setItem('ai_openai_key', openaiKey);
    console.log('✓ API keys saved');
  },

  // Set AI provider
  setProvider(provider) {
    if (['gemini', 'openai'].includes(provider)) {
      this.config.currentProvider = provider;
      localStorage.setItem('ai_provider', provider);
      console.log('✓ AI provider set to:', provider);
    }
  },

  // Main analysis function
  async analyzeAllReports(reports) {
    try {
      console.log('🤖 Starting AI analysis on', reports.length, 'reports');

      if (reports.length === 0) {
        throw new Error('No reports to analyze');
      }

      // Step 1: DBSCAN Clustering
      console.log('📊 Running DBSCAN clustering...');
      const clustering = this.dbscanClustering(reports);
      console.log('✓ Found', clustering.clusters.length, 'clusters');

      // Step 2: Prepare data for LLM
      const analysisData = this.prepareAnalysisData(reports, clustering);

      // Step 3: Get LLM insights
      console.log('🧠 Requesting LLM analysis...');
      const llmInsights = await this.getLLMAnalysis(analysisData);

      // Step 4: Combine results
      const finalAnalysis = {
        timestamp: new Date().toISOString(),
        totalReports: reports.length,
        clustering: clustering,
        ...llmInsights
      };

      console.log('✅ AI Analysis complete');
      return finalAnalysis;

    } catch (error) {
      console.error('AI Analysis error:', error);
      throw error;
    }
  },

  // DBSCAN Clustering Algorithm
  dbscanClustering(reports) {
    const { epsilon, minPoints } = this.config.dbscan;
    
    // Filter reports with valid locations
    const validReports = reports.filter(r => 
      r.location && r.location.isReal && 
      r.location.latitude && r.location.longitude
    );

    if (validReports.length === 0) {
      return { clusters: [], noise: [] };
    }

    console.log('📍 Processing', validReports.length, 'reports with locations');

    // Initialize
    const visited = new Set();
    const clusters = [];
    const noise = [];

    // DBSCAN algorithm
    for (let i = 0; i < validReports.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);

      // Find neighbors
      const neighbors = this.findNeighbors(i, validReports, epsilon);

      if (neighbors.length < minPoints) {
        noise.push(validReports[i]);
      } else {
        // Create new cluster
        const cluster = {
          id: clusters.length + 1,
          reports: [validReports[i]],
          reportIds: [validReports[i].id]
        };

        // Expand cluster
        this.expandCluster(cluster, neighbors, validReports, visited, epsilon, minPoints);
        
        // Calculate cluster statistics
        cluster.centroid = this.calculateCentroid(cluster.reports);
        cluster.size = cluster.reports.length;
        cluster.severity = this.calculateClusterSeverity(cluster.reports);
        cluster.types = this.getClusterTypes(cluster.reports);

        clusters.push(cluster);
      }
    }

    console.log('✓ DBSCAN complete:', clusters.length, 'clusters,', noise.length, 'noise points');

    return { clusters, noise };
  },

  // Find neighbors within epsilon distance
  findNeighbors(index, reports, epsilon) {
    const neighbors = [];
    const report = reports[index];

    for (let i = 0; i < reports.length; i++) {
      if (i === index) continue;

      const distance = this.calculateDistance(
        report.location.latitude,
        report.location.longitude,
        reports[i].location.latitude,
        reports[i].location.longitude
      );

      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }

    return neighbors;
  },

  // Expand cluster with density-reachable points
  expandCluster(cluster, neighbors, reports, visited, epsilon, minPoints) {
    let i = 0;
    while (i < neighbors.length) {
      const neighborIndex = neighbors[i];

      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);

        const newNeighbors = this.findNeighbors(neighborIndex, reports, epsilon);

        if (newNeighbors.length >= minPoints) {
          neighbors.push(...newNeighbors);
        }
      }

      // Add to cluster if not already added
      if (!cluster.reportIds.includes(reports[neighborIndex].id)) {
        cluster.reports.push(reports[neighborIndex]);
        cluster.reportIds.push(reports[neighborIndex].id);
      }

      i++;
    }
  },

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  },

  // Calculate cluster centroid
  calculateCentroid(reports) {
    const sum = reports.reduce((acc, r) => {
      acc.lat += r.location.latitude;
      acc.lng += r.location.longitude;
      return acc;
    }, { lat: 0, lng: 0 });

    return {
      latitude: sum.lat / reports.length,
      longitude: sum.lng / reports.length
    };
  },

  // Calculate cluster severity score
  calculateClusterSeverity(reports) {
    let score = 0;
    
    reports.forEach(r => {
      // Base score
      score += 1;

      // Type weighting
      if (r.type === 'medical') score += 2;
      if (r.type === 'police') score += 1.5;
      if (r.type === 'infrastructure') score += 0.5;

      // Severity weighting
      if (r.severity === 'high') score += 2;
      if (r.problem?.escalation === 'high') score += 2;

      // Status penalty
      if (r.status === 'resolved') score -= 0.5;
    });

    return score / reports.length;
  },

  // Get cluster report types
  getClusterTypes(reports) {
    const types = {};
    reports.forEach(r => {
      types[r.type] = (types[r.type] || 0) + 1;
    });
    return types;
  },

  // Prepare data for LLM analysis
  prepareAnalysisData(reports, clustering) {
    const summary = {
      total_reports: reports.length,
      by_type: {
        police: reports.filter(r => r.type === 'police').length,
        medical: reports.filter(r => r.type === 'medical').length,
        infrastructure: reports.filter(r => r.type === 'infrastructure').length
      },
      by_status: {
        pending: reports.filter(r => r.status === 'pending').length,
        'in-progress': reports.filter(r => r.status === 'in-progress').length,
        resolved: reports.filter(r => r.status === 'resolved').length
      },
      clusters: clustering.clusters.map(c => ({
        id: c.id,
        size: c.size,
        severity: c.severity.toFixed(2),
        types: c.types,
        location: `${c.centroid.latitude.toFixed(4)}, ${c.centroid.longitude.toFixed(4)}`
      })),
      high_severity_clusters: clustering.clusters
        .filter(c => c.severity > 2)
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 5)
    };

    return summary;
  },

  // Get LLM analysis
  async getLLMAnalysis(data) {
    const keys = this.loadAPIKeys();
    const provider = this.config.currentProvider;

    if (provider === 'gemini' && keys.gemini) {
      return await this.getGeminiAnalysis(data, keys.gemini);
    } else if (provider === 'openai' && keys.openai) {
      return await this.getOpenAIAnalysis(data, keys.openai);
    } else {
      console.warn('No API key configured, using fallback analysis');
      return this.getFallbackAnalysis(data);
    }
  },

  // Google Gemini Analysis
  async getGeminiAnalysis(data, apiKey) {
    try {
      const prompt = this.buildPrompt(data);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return this.parseAIResponse(text);

    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackAnalysis(data);
    }
  },

  // OpenAI ChatGPT Analysis
  async getOpenAIAnalysis(data, apiKey) {
    try {
      const prompt = this.buildPrompt(data);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a public safety analyst specializing in incident clustering and resource allocation.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || '';

      return this.parseAIResponse(text);

    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackAnalysis(data);
    }
  },

  // Build prompt for LLM
  buildPrompt(data) {
    return `Analyze this citizen safety report data and provide insights:

**Report Summary:**
- Total Reports: ${data.total_reports}
- Police: ${data.by_type.police}, Medical: ${data.by_type.medical}, Infrastructure: ${data.by_type.infrastructure}
- Pending: ${data.by_status.pending}, In Progress: ${data.by_status['in-progress']}, Resolved: ${data.by_status.resolved}

**DBSCAN Clustering Results:**
- Clusters Found: ${data.clusters.length}
- High Severity Clusters: ${data.high_severity_clusters.length}

${data.high_severity_clusters.map(c => 
  `Cluster ${c.id}: ${c.size} reports, severity ${c.severity}, types: ${JSON.stringify(c.types)}`
).join('\n')}

Please provide a structured JSON response with:
1. "overall_safety_assessment": Brief assessment of community safety
2. "high_priority_areas": Array of {area, reason} objects for top 3 priority areas
3. "resource_allocation": Array of 3-5 specific recommendations
4. "trends": Key patterns observed

Keep responses concise and actionable.`;
  },

  // Parse AI response
  parseAIResponse(text) {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON, create structured response from text
      return {
        overall_safety_assessment: text.split('\n')[0] || 'Analysis completed',
        high_priority_areas: [],
        resource_allocation: text.split('\n').filter(line => line.trim().startsWith('-')),
        trends: []
      };
    } catch (error) {
      console.error('Parse AI response error:', error);
      return {
        overall_safety_assessment: text.substring(0, 200),
        high_priority_areas: [],
        resource_allocation: [],
        trends: []
      };
    }
  },

  // Fallback analysis (no API)
  getFallbackAnalysis(data) {
    const priorityAreas = data.high_severity_clusters.slice(0, 3).map(c => ({
      area: `Cluster ${c.id} (${c.location})`,
      reason: `${c.size} incidents with severity ${c.severity}. Types: ${Object.keys(c.types).join(', ')}`
    }));

    const recommendations = [];

    if (data.by_type.medical > data.total_reports * 0.3) {
      recommendations.push('Increase medical response units in high-incident areas');
    }
    if (data.by_type.police > data.total_reports * 0.3) {
      recommendations.push('Deploy additional police patrols to identified clusters');
    }
    if (data.by_type.infrastructure > data.total_reports * 0.3) {
      recommendations.push('Prioritize infrastructure maintenance in affected zones');
    }
    if (data.by_status.pending > data.total_reports * 0.5) {
      recommendations.push('Increase response team capacity to address pending reports');
    }

    return {
      overall_safety_assessment: `Analysis of ${data.total_reports} reports reveals ${data.clusters.length} incident clusters. ${priorityAreas.length > 0 ? 'Several high-priority areas require immediate attention.' : 'No critical hotspots detected.'}`,
      high_priority_areas: priorityAreas,
      resource_allocation: recommendations.length > 0 ? recommendations : ['Continue monitoring current trends', 'Maintain existing resource allocation'],
      trends: [
        `${data.clusters.length} geographic clusters identified using DBSCAN`,
        `${Math.round((data.by_status.resolved / data.total_reports) * 100)}% resolution rate`
      ]
    };
  }
};

// Make available globally
window.AIAnalytics = AIAnalytics;

console.log('✅ AI Analytics module loaded (DBSCAN + LLM)');
