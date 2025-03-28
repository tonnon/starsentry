import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Line, Html } from '@react-three/drei';
import { Satellite, AlertTriangle, ShieldAlert } from 'lucide-react';
import * as THREE from 'three';

interface MapProps {
  className?: string;
}

interface SpaceObject {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'operational' | 'warning' | 'danger';
  type: 'satellite' | 'debris';
  altitude?: number;
  collisionRisk?: string;
  collisionWith?: string;
}

// Expanded mock satellite data with collision information
const mockSatellites: SpaceObject[] = [
  // Satellites - Operational
  { 
    id: 'sat1', 
    name: 'ISS', 
    lat: 51.51, 
    lng: -0.13, 
    status: 'operational', 
    type: 'satellite',
    altitude: 408,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat2', 
    name: 'Starlink-1234', 
    lat: 0, 
    lng: -122.4, 
    status: 'operational', 
    type: 'satellite',
    altitude: 550,
    collisionRisk: 'Medium',
    collisionWith: 'Cosmos-1408'
  },
  { 
    id: 'sat3', 
    name: 'Sentinel-2', 
    lat: -33.87, 
    lng: 151.21, 
    status: 'operational', 
    type: 'satellite',
    altitude: 786,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat4', 
    name: 'GPS-IIF-10', 
    lat: 35.68, 
    lng: 139.77, 
    status: 'operational', 
    type: 'satellite',
    altitude: 20200,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat5', 
    name: 'Hubble', 
    lat: 40.71, 
    lng: -74.01, 
    status: 'operational', 
    type: 'satellite',
    altitude: 547,
    collisionRisk: 'Medium',
    collisionWith: 'Falcon Debris'
  },
  { 
    id: 'sat6', 
    name: 'Tiangong', 
    lat: 39.9, 
    lng: 116.4, 
    status: 'operational', 
    type: 'satellite',
    altitude: 380,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat7', 
    name: 'GOES-16', 
    lat: 0, 
    lng: -75, 
    status: 'operational', 
    type: 'satellite',
    altitude: 35786,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat8', 
    name: 'Landsat 9', 
    lat: -12.97, 
    lng: -38.5, 
    status: 'operational', 
    type: 'satellite',
    altitude: 705,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  { 
    id: 'sat9', 
    name: 'MetOp-C', 
    lat: 55.75, 
    lng: 37.62, 
    status: 'operational', 
    type: 'satellite',
    altitude: 817,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },

  
  // Debris - Warning
  { 
    id: 'deb1', 
    name: 'Debris 2022-301', 
    lat: 60, 
    lng: -92.2, 
    status: 'warning', 
    type: 'debris',
    altitude: 850,
    collisionRisk: 'High',
    collisionWith: 'Starlink-1234'
  },
  { 
    id: 'deb2', 
    name: 'SL-16 R/B', 
    lat: -90, 
    lng: 0, 
    status: 'warning', 
    type: 'debris',
    altitude: 1200,
    collisionRisk: 'Medium',
    collisionWith: 'None'
  },
  { 
    id: 'deb3', 
    name: 'Cosmos-1408', 
    lat: 45, 
    lng: 80, 
    status: 'warning', 
    type: 'debris',
    altitude: 480,
    collisionRisk: 'High',
    collisionWith: 'Starlink-1234'
  },
  { 
    id: 'deb4', 
    name: 'Fengyun Debris', 
    lat: -15, 
    lng: 120, 
    status: 'warning', 
    type: 'debris',
    altitude: 780,
    collisionRisk: 'Medium',
    collisionWith: 'None'
  },
  { 
    id: 'deb5', 
    name: 'Ariane Debris', 
    lat: 30, 
    lng: -30, 
    status: 'warning', 
    type: 'debris',
    altitude: 1500,
    collisionRisk: 'Low',
    collisionWith: 'None'
  },
  
  // Debris - Danger
  { 
    id: 'deb6', 
    name: 'Cosmos Debris', 
    lat: -34.6, 
    lng: -58.4, 
    status: 'danger', 
    type: 'debris',
    altitude: 600,
    collisionRisk: 'Critical',
    collisionWith: 'Hubble'
  },
  { 
    id: 'deb7', 
    name: 'Falcon Debris', 
    lat: -22.91, 
    lng: -43.18, 
    status: 'danger', 
    type: 'debris',
    altitude: 550,
    collisionRisk: 'Critical',
    collisionWith: 'Hubble'
  },
  { 
    id: 'deb8', 
    name: 'Delta IV Debris', 
    lat: 25, 
    lng: -80, 
    status: 'danger', 
    type: 'debris',
    altitude: 1200,
    collisionRisk: 'High',
    collisionWith: 'None'
  },
  { 
    id: 'deb9', 
    name: 'Soyuz Debris', 
    lat: -5, 
    lng: -150, 
    status: 'danger', 
    type: 'debris',
    altitude: 800,
    collisionRisk: 'High',
    collisionWith: 'None'
  },
  { 
    id: 'deb10', 
    name: 'Anti-Sat Debris', 
    lat: 20, 
    lng: 100, 
    status: 'danger', 
    type: 'debris',
    altitude: 850,
    collisionRisk: 'Critical',
    collisionWith: 'ISS'
  }
];

// Helper to convert lat/lng to 3D coordinates
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
};

// Earth component with realistic textures
const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const [colorMap] = useTexture([
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
  ]);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        metalness={0.1}
        roughness={0.7}
      />
    </mesh>
  );
};

// Trajectory line for each satellite/debris
const TrajectoryLine = ({ position, color }: { position: THREE.Vector3, color: string }) => {
  const points = useMemo(() => {
    const segments = 64;
    const pointsArray = [];
    const radius = position.length();
    
    const direction = position.clone().normalize();
    const perpendicular = new THREE.Vector3(1, 0, 0);
    
    if (Math.abs(direction.dot(perpendicular)) > 0.9) {
      perpendicular.set(0, 1, 0);
    }

    const axis = direction.clone().cross(perpendicular).normalize();
    const start = direction.clone().multiplyScalar(radius);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const point = start.clone().applyAxisAngle(axis, angle);
      pointsArray.push(point);
    }

    return pointsArray;
  }, [position]);

  return (
    <Line 
      points={points}
      color={color}
      lineWidth={1}
      opacity={0.6}
      transparent={true}
    />
  );
};

// Satellite component with hover tooltip
const SatelliteModel = ({ position, color, obj }: { position: THREE.Vector3, color: string, obj: SpaceObject }) => {
  const [hovered, setHovered] = useState(false);
  const satelliteRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group 
      ref={satelliteRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 16]} />
        <meshStandardMaterial color="white" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.08]} />
        <meshStandardMaterial color="black" emissive="blue" emissiveIntensity={0.3} />
      </mesh>
      
      {hovered && (
        <Html distanceFactor={5}>
           <div className="bg-black bg-opacity-80 text-white p-2 rounded text-[10px] w-auto min-w-max">
            <div className="font-bold">{obj.name}</div>
            <div>Latitude: {obj.lat.toFixed(2)}°</div>
            <div>Longitude: {obj.lng.toFixed(2)}°</div>
            <div>Altitude: {obj.altitude} km</div>
            <div>Type: {obj.type === 'satellite' ? 'Satellite' : 'Debris'}</div>
            <div>Status: {obj.status === 'operational' ? 'Operational' : obj.status === 'warning' ? 'Warning' : 'Danger'}</div>
            <div>Collision Risk: {obj.collisionRisk}</div>
            {obj.collisionWith && obj.collisionWith !== 'None' && (
              <div>Potential collision with: {obj.collisionWith}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// Debris component with hover tooltip
const DebrisModel = ({ position, color, obj }: { position: THREE.Vector3, color: string, obj: SpaceObject }) => {
  const [hovered, setHovered] = useState(false);
  const debrisRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (debrisRef.current) {
      debrisRef.current.rotation.x += 0.01;
      debrisRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh 
      ref={debrisRef} 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.3} 
        roughness={0.8}
        metalness={0.2}
      />
      
      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-[10px] w-auto min-w-max">
            <div className="font-bold">{obj.name}</div>
            <div>Latitude: {obj.lat.toFixed(2)}°</div>
            <div>Longitude: {obj.lng.toFixed(2)}°</div>
            <div>Altitude: {obj.altitude} km</div>
            <div>Type: {obj.type === 'satellite' ? 'Satellite' : 'Debris'}</div>
            <div>Status: {obj.status === 'operational' ? 'Operational' : obj.status === 'warning' ? 'Warning' : 'Danger'}</div>
            <div>Collision Risk: {obj.collisionRisk}</div>
            {obj.collisionWith && obj.collisionWith !== 'None' && (
              <div>Potential collision with: {obj.collisionWith}</div>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
};

// Atmosphere glow effect
const Atmosphere = () => {
  return (
    <mesh>
      <sphereGeometry args={[2.1, 64, 64]} />
      <meshStandardMaterial 
        color="#00a8ff" 
        transparent={true} 
        opacity={0.1} 
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Main scene
const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0070ff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Atmosphere />
      
      {mockSatellites.map((obj) => {
        const pos = latLongToVector3(obj.lat, obj.lng, 2.2);
        const color = obj.status === 'danger' ? '#ff3366' : 
                     obj.status === 'warning' ? '#ffaa33' : '#33ff99';
        
        return (
          <React.Fragment key={obj.id}>
            <TrajectoryLine position={pos} color={color} />
            {obj.type === 'satellite' ? (
              <SatelliteModel position={pos} color={color} obj={obj} />
            ) : (
              <DebrisModel position={pos} color={color} obj={obj} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const Map: React.FC<MapProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-xl overflow-hidden relative ${className}`}>
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }}
        className="h-full w-full"
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true} 
          zoomSpeed={0.6}
          autoRotate={false}
          autoRotateSpeed={0.5}
          minDistance={3}
          maxDistance={10}
        />
      </Canvas>
      
      <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-xl"></div>
      
      <div className="absolute bottom-4 left-4 bg-space-dark/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-success"></div>
          <span className="text-xs text-white/80">Operational</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-warning"></div>
          <span className="text-xs text-white/80">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-status-danger"></div>
          <span className="text-xs text-white/80">Danger</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-space-dark/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
          <span className="text-xs text-white/80">Debris</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-1.5 rounded-sm bg-white"></div>
          </div>
          <span className="text-xs text-white/80">Satellite</span>
        </div>
      </div>
    </div>
  );
};

export default Map;