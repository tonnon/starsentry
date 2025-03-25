
import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Line } from '@react-three/drei';
import { Satellite, AlertTriangle, ShieldAlert } from 'lucide-react';
import * as THREE from 'three';

interface MapProps {
  className?: string;
}

// Mock satellite data - same as before
const mockSatellites = [
  { id: 'sat1', name: 'ISS', lat: 28.5, lng: -80.5, status: 'operational', type: 'satellite' },
  { id: 'sat2', name: 'Starlink-1234', lat: 37.8, lng: -122.4, status: 'operational', type: 'satellite' },
  { id: 'sat3', name: 'Sentinel-2', lat: 45.5, lng: -73.6, status: 'operational', type: 'satellite' },
  { id: 'deb1', name: 'Debris 2022-301', lat: 30.3, lng: -92.2, status: 'warning', type: 'debris' },
  { id: 'deb2', name: 'Cosmos Debris', lat: 40.7, lng: -74.0, status: 'danger', type: 'debris' },
  { id: 'sat4', name: 'GPS-IIF-10', lat: 35.7, lng: -115.2, status: 'operational', type: 'satellite' },
  { id: 'deb3', name: 'SL-16 R/B', lat: 51.5, lng: -0.1, status: 'warning', type: 'debris' },
];

// Helper to convert lat/lng to 3D coordinates
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Earth component
const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // Create a basic material instead of using a texture
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005;
    }
  });
  
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial 
        color="#1a3a6a" 
        emissive="#103050"
        emissiveIntensity={0.3}
        roughness={0.8}
        metalness={0.4}
      />
    </mesh>
  );
};

// Trajectory line for satellites and debris
const TrajectoryLine = ({ position, color }: { position: THREE.Vector3, color: string }) => {
  // Create a circular trajectory path
  const points = useMemo(() => {
    const radius = position.length() + Math.random() * 0.4 - 0.2;
    const pointsArray = [];
    const segments = 64;
    const randomOffset = new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25
    );
    
    // Normalize the position vector to get the direction
    const direction = position.clone().normalize();
    
    // Create a perpendicular vector for the orbital plane
    const perpendicular = new THREE.Vector3(1, 0, 0);
    if (Math.abs(direction.dot(perpendicular)) > 0.9) {
      perpendicular.set(0, 1, 0);
    }
    
    const axis = direction.clone().cross(perpendicular).normalize();
    const start = direction.clone().multiplyScalar(radius);
    
    // Create points around the orbit
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const point = start.clone().applyAxisAngle(axis, angle);
      point.add(randomOffset);
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

// Satellite object
const SatelliteObject = ({ position, color }: { position: THREE.Vector3, color: string }) => {
  const satelliteRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <>
      <TrajectoryLine position={position} color={color} />
      <mesh ref={satelliteRef} position={position}>
        <boxGeometry args={[0.05, 0.05, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </>
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
      
      {/* Render all satellites */}
      {mockSatellites.map((sat) => {
        const pos = latLongToVector3(sat.lat, sat.lng, 2.2);
        const color = sat.status === 'danger' ? '#ff3366' : sat.status === 'warning' ? '#ffaa33' : '#33ff99';
        return <SatelliteObject key={sat.id} position={pos} color={color} />;
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
      
      {/* Map overlay showing status */}
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
    </div>
  );
};

export default Map;
