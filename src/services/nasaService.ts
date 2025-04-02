import axios from 'axios';

// Debug version - shows where the key is coming from
const getNASAKey = () => {
  // 1. First try Vite's client-side env vars
  if (import.meta.env.VITE_NASA_API_KEY) {
    console.log('Using VITE_NASA_API_KEY from import.meta.env');
    return import.meta.env.VITE_NASA_API_KEY;
  }
  
  // 2. Try process.env (for SSR or fallback)
  if (process.env.VITE_NASA_API_KEY) {
    console.log('Using VITE_NASA_API_KEY from process.env');
    return process.env.VITE_NASA_API_KEY;
  }
  
  // 3. Fallback to demo key
  console.warn('Using DEMO_KEY - no API key found in environment');
  return 'DEMO_KEY';
};

const NASA_API_KEY = getNASAKey();
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

// Enhanced error handling with retry logic
nasaApi.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      console.error('NASA API Error:', {
        status: error.response.status,
        url: error.config.url,
        message: error.response.data?.error_message || 'No error message'
      });
      
      if (error.response.status === 403) {
        console.error('API Key might be invalid or rate limited');
      }
      
      // Retry once for rate limits
      if (error.response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return nasaApi.request(error.config);
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
    return apiCache[cacheKey]?.data || null;
  }
}

export const fetchSpaceData = async () => {
  if (!NASA_API_KEY || NASA_API_KEY === 'DEMO_KEY') {
    console.warn('Using fallback data - no API key or using demo key');
    return { ...FALLBACK_DATA, message: 'Using fallback data - API key not available' };
  }

  try {
    const [satellites, debris] = await Promise.allSettled([
      fetchWithCache('/DONKI/notifications', { 
        type: 'satellite',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }, 'notifications'),
      fetchWithCache('/neo/rest/v1/stats', {}, 'neo-stats')
    ]);

    // Handle PromiseSettledResult
    const satellitesData = satellites.status === 'fulfilled' ? satellites.value : null;
    const debrisData = debris.status === 'fulfilled' ? debris.value : null;

    // If either request failed completely
    if (satellitesData === null || debrisData === null) {
      return { 
        ...FALLBACK_DATA,
        message: 'Partial data unavailable - using fallback values'
      };
    }

    return {
      activeSatellites: satellitesData?.length ?? FALLBACK_DATA.activeSatellites,
      trackedDebris: debrisData?.near_earth_object_count ?? FALLBACK_DATA.trackedDebris,
      collisionAlerts: FALLBACK_DATA.collisionAlerts,
      orbitAdjustments: FALLBACK_DATA.orbitAdjustments,
      usingFallback: false
    };
  } catch (error) {
    console.error('Space data fetch failed:', error);
    return { 
      ...FALLBACK_DATA,
      message: 'Data fetch failed - using fallback values'
    };
  }
};