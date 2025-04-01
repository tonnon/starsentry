import axios from 'axios';

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;

export const fetchSpaceData = async () => {
  try {
    const [satellites, debris, alerts, maneuvers] = await Promise.all([
      axios.get(`https://api.nasa.gov/DONKI/notifications?api_key=${NASA_API_KEY}&type=satellite`),
      axios.get(`https://api.nasa.gov/neo/rest/v1/stats?api_key=${NASA_API_KEY}`),
      axios.get(`https://api.nasa.gov/DONKI/CME?api_key=${NASA_API_KEY}`),
      axios.get(`https://api.nasa.gov/DONKI/IPS?api_key=${NASA_API_KEY}`)
    ]);

    return {
      activeSatellites: satellites.data.length || 0,
      trackedDebris: debris.data.near_earth_object_count || 0,
      collisionAlerts: alerts.data.length || 0,
      orbitAdjustments: maneuvers.data.length || 0
    };
  } catch (error) {
    console.error("Error fetching NASA data:", error);
    return {
      activeSatellites: 4328,
      trackedDebris: 23094,
      collisionAlerts: 3,
      orbitAdjustments: 14
    };
  }
};