import axios from 'axios';

// Debugging - remove in production
console.log('NASA_API_KEY loaded:', !!import.meta.env.VITE_NASA_API_KEY);

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'; // Fallback to demo key
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

const apiCache: Record<string, CacheEntry> = {};

const nasaApi = axios.create({
  baseURL: 'https://api.nasa.gov',
  timeout: 10000,
  params: {
    api_key: NASA_API_KEY
  }
});

// Enhanced error handling
nasaApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('NASA API Error:', {
        status: error.response.status,
        url: error.config.url,
        message: error.response.data?.error_message || 'No error message'
      });
      
      if (error.response.status === 403) {
        console.error('API Key might be invalid or rate limited');
      }
    }
    return Promise.reject(error);
  }
);

const FALLBACK_DATA = {
  activeSatellites: 4328,
  trackedDebris: 23094,
  collisionAlerts: 3,
  orbitAdjustments: 14,
  usingFallback: true
};

async function fetchWithCache(endpoint: string, params = {}, cacheKey: string) {
  const now = Date.now();
  
  // Cache check
  if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_TTL) {
    return apiCache[cacheKey].data;
  }

  try {
    const response = await nasaApi.get(endpoint, { params });
    
    if (response.data) {
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: now
      };
    }
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return apiCache[cacheKey]?.data || null; // Return null to distinguish from empty data
  }
}

export const fetchSpaceData = async () => {
  if (!NASA_API_KEY || NASA_API_KEY === 'DEMO_KEY') {
    console.warn('Using fallback data - no API key or using demo key');
    return FALLBACK_DATA;
  }

  try {
    const [satellites, debris] = await Promise.all([
      fetchWithCache('/DONKI/notifications', { 
        type: 'satellite',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }, 'notifications'),
      fetchWithCache('/neo/rest/v1/stats', {}, 'neo-stats')
    ]);

    // If either request failed completely
    if (satellites === null || debris === null) {
      return FALLBACK_DATA;
    }

    return {
      activeSatellites: satellites?.length ?? FALLBACK_DATA.activeSatellites,
      trackedDebris: debris?.near_earth_object_count ?? FALLBACK_DATA.trackedDebris,
      collisionAlerts: FALLBACK_DATA.collisionAlerts,
      orbitAdjustments: FALLBACK_DATA.orbitAdjustments,
      usingFallback: false
    };
  } catch (error) {
    console.error('Space data fetch failed:', error);
    return FALLBACK_DATA;
  }
};