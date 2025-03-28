import React from "react";

// useSettings.ts
type Settings = {
      ui: {
        activeTab: string;
    };
    appearance: {
      theme: 'dark' | 'light' | 'system';
      accentColor: string;
      animationsEnabled: boolean;
      reduceTransparency: boolean;
      satelliteLabelSize: number;
      interfaceZoom: number;
      showSatelliteTrails: boolean;
    };
    notifications: {
      collisionAlerts: boolean;
      systemUpdates: boolean;
      missionProgress: boolean;
      alertVolume: number;
      testAlerts: boolean;
    };
    security: {
      sessionTimeout: number;
    };
    system: {
      dataRefreshRate: number;
      mapProjection: string;
      collisionThreshold: number;
      autoTrajectory: boolean;
      remoteTelemetry: boolean;
      language: string;
      units: string;
      use24hFormat: boolean;
    };
    account: {
      fullName: string;
      email: string;
    };
  };
  
  const defaultSettings: Settings = {
    ui: {
        activeTab: 'appearance',
      },
    appearance: {
      theme: 'dark',
      accentColor: 'neon-blue',
      animationsEnabled: true,
      reduceTransparency: false,
      satelliteLabelSize: 75,
      interfaceZoom: 100,
      showSatelliteTrails: true,
    },
    notifications: {
      collisionAlerts: true,
      systemUpdates: true,
      missionProgress: true,
      alertVolume: 75,
      testAlerts: false,
    },
    security: {
      sessionTimeout: 30,
    },
    system: {
      dataRefreshRate: 5,
      mapProjection: 'Mercator',
      collisionThreshold: 25,
      autoTrajectory: true,
      remoteTelemetry: false,
      language: 'English (US)',
      units: 'Metric (km, kg)',
      use24hFormat: true,
    },
    account: {
      fullName: 'Luke Operator',
      email: 'lukeoperator@starsentry.com',
    },
  };
  
  export function useSettings() {
    const [settings, setSettings] = React.useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = React.useState(false);
  
    React.useEffect(() => {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({
            ...defaultSettings,
            ...parsedSettings,
            security: {
              ...defaultSettings.security,
              ...(parsedSettings.security || {}),
            },
          });
        } catch (e) {
          console.error('Failed to parse saved settings', e);
        }
      }
      setIsLoaded(true);
    }, []);
  
    React.useEffect(() => {
      if (isLoaded) {
        localStorage.setItem('appSettings', JSON.stringify(settings));
      }
    }, [settings, isLoaded]);
  
    const updateSettings = (category: keyof Settings, newSettings: Partial<Settings[keyof Settings]>) => {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          ...newSettings,
        },
      }));
    };
  
    return { settings, updateSettings, isLoaded };
  }