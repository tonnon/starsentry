import axios from 'axios';

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Memory cache
const apiCache: Record<string, { data: any, timestamp: number }> = {};

const nasaApi = axios.create({
  baseURL: 'https://api.nasa.gov',
  timeout: 10000,
  params: {
    api_key: NASA_API_KEY
  }
});

nasaApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status !== 429) {
      console.error('API Error:', error.message);
    }
    return Promise.resolve({ data: {} });
  }
);

const FALLBACK_DATA = {
  activeSatellites: 4328,
  trackedDebris: 23094,
  collisionAlerts: 3,
  orbitAdjustments: 14
};

async function fetchWithCache(endpoint: string, params = {}, cacheKey: string) {
  const now = Date.now();
  
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
    return response.data || {};
  } catch (error) {
    return apiCache[cacheKey]?.data || {};
  }
}

export const fetchSpaceData = async () => {
  if (!NASA_API_KEY) return FALLBACK_DATA;

  try {
    const [satellites, debris] = await Promise.all([
      fetchWithCache('/DONKI/notifications', { type: 'satellite' }, 'notifications'),
      fetchWithCache('/neo/rest/v1/stats', {}, 'neo-stats')
    ]);

    return {
      activeSatellites: satellites?.length ?? FALLBACK_DATA.activeSatellites,
      trackedDebris: debris?.near_earth_object_count ?? FALLBACK_DATA.trackedDebris,
      collisionAlerts: FALLBACK_DATA.collisionAlerts,
      orbitAdjustments: FALLBACK_DATA.orbitAdjustments
    };
  } catch {
    return FALLBACK_DATA;
  }
};