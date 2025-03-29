import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceMapProps {
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

const mockSatellites: SpaceObject[] = [
  // Collision group 1 (ISS and Anti-Sat Debris) - 2 degrees apart
  { 
    id: 'sat1', 
    name: 'ISS', 
    lat: 50, 
    lng: -2.0,
    status: 'danger',
    type: 'satellite',
    altitude: 408,
    collisionRisk: 'High',
    collisionWith: 'Anti-Sat Debris'
  },
  { 
    id: 'deb10', 
    name: 'Anti-Sat Debris', 
    lat: 51.0,
    lng: -1.0,
    status: 'danger', 
    type: 'debris',
    altitude: 408,
    collisionRisk: 'High',
    collisionWith: 'ISS'
  },

  // Collision group 2 (Starlink and Cosmos-1408) - 1 degree apart
  { 
    id: 'sat2', 
    name: 'Starlink-1234', 
    lat: 45, 
    lng: 80, 
    status: 'danger', 
    type: 'satellite',
    altitude: 550,
    collisionRisk: 'High',
    collisionWith: 'Cosmos-1408'
  },
  { 
    id: 'deb3', 
    name: 'Cosmos-1408', 
    lat: 46.0,
    lng: 81.0,
    status: 'danger',
    type: 'debris',
    altitude: 550,
    collisionRisk: 'High',
    collisionWith: 'Starlink-1234'
  },

  // Collision group 3 (Hubble and Falcon Debris) - 1 degree apart
  { 
    id: 'sat5', 
    name: 'Hubble', 
    lat: -30, 
    lng: -45, 
    status: 'danger', 
    type: 'satellite',
    altitude: 547,
    collisionRisk: 'High',
    collisionWith: 'Falcon Debris'
  },
  { 
    id: 'deb7', 
    name: 'Falcon Debris', 
    lat: -31.0,
    lng: -46.0,
    status: 'danger', 
    type: 'debris',
    altitude: 547,
    collisionRisk: 'High',
    collisionWith: 'Hubble'
  },

  // Warning objects (not part of collision groups)
  { 
    id: 'deb1', 
    name: 'Debris 2022-301', 
    lat: 60, 
    lng: -92.2, 
    status: 'warning', 
    type: 'debris',
    altitude: 850,
    collisionRisk: 'Medium'
  },
  { 
    id: 'deb2', 
    name: 'SL-16 R/B', 
    lat: -90, 
    lng: 0, 
    status: 'warning', 
    type: 'debris',
    altitude: 1200,
    collisionRisk: 'Medium'
  },
  { 
    id: 'deb4', 
    name: 'Fengyun Debris', 
    lat: -15, 
    lng: 120, 
    status: 'warning', 
    type: 'debris',
    altitude: 780,
    collisionRisk: 'Medium'
  },

  // Operational satellites
  { 
    id: 'sat3', 
    name: 'Sentinel-2', 
    lat: -33.87, 
    lng: 151.21, 
    status: 'operational', 
    type: 'satellite',
    altitude: 786,
    collisionRisk: 'Low'
  },
  { 
    id: 'sat4', 
    name: 'GPS-IIF-10', 
    lat: 35.68, 
    lng: 139.77, 
    status: 'operational', 
    type: 'satellite',
    altitude: 20200,
    collisionRisk: 'Low'
  },
  { 
    id: 'sat6', 
    name: 'Tiangong', 
    lat: 39.9, 
    lng: 116.4, 
    status: 'operational', 
    type: 'satellite',
    altitude: 380,
    collisionRisk: 'Low'
  },
  { 
    id: 'sat7', 
    name: 'GOES-16', 
    lat: 0, 
    lng: -75, 
    status: 'operational', 
    type: 'satellite',
    altitude: 35786,
    collisionRisk: 'Low'
  },
  { 
    id: 'sat8', 
    name: 'Landsat 9', 
    lat: -12.97, 
    lng: -38.5, 
    status: 'operational', 
    type: 'satellite',
    altitude: 705,
    collisionRisk: 'Low'
  },
  { 
    id: 'sat9', 
    name: 'MetOp-C', 
    lat: 55.75, 
    lng: 37.62, 
    status: 'operational', 
    type: 'satellite',
    altitude: 817,
    collisionRisk: 'Low'
  },

  // Other debris
  { 
    id: 'deb5', 
    name: 'Ariane Debris', 
    lat: 30, 
    lng: -30, 
    status: 'warning', 
    type: 'debris',
    altitude: 1500,
    collisionRisk: 'Low'
  },
  { 
    id: 'deb6', 
    name: 'Cosmos Debris', 
    lat: -34.6, 
    lng: -58.4, 
    status: 'danger', 
    type: 'debris',
    altitude: 600,
    collisionRisk: 'Medium'
  },
  { 
    id: 'deb8', 
    name: 'Delta IV Debris', 
    lat: 25, 
    lng: -80, 
    status: 'danger', 
    type: 'debris',
    altitude: 1200,
    collisionRisk: 'Medium'
  },
  { 
    id: 'deb9', 
    name: 'Soyuz Debris', 
    lat: -5, 
    lng: -150, 
    status: 'danger', 
    type: 'debris',
    altitude: 800,
    collisionRisk: 'Medium'
  }
];

const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const calculateDistance = (pos1: THREE.Vector3, pos2: THREE.Vector3) => {
  return pos1.distanceTo(pos2);
};

const AlertIcon = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);

  // Slow pulsing animation (2 second cycle)
  useFrame(() => {
    if (ref.current) {
      const time = Date.now() % 2000;
      // Smooth pulse using sine wave
      const newOpacity = 0.5 + 0.5 * Math.sin(time * Math.PI / 1000);
      setOpacity(newOpacity);
    }
  });

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <Html center>
        <div className="flex items-center justify-center">
          <div 
            className="w-5 h-5 rounded-full border-2 border-white"
            style={{
              backgroundColor: `rgba(255, 50, 50, ${opacity})`,
              boxShadow: `0 0 8px rgba(255, 50, 50, ${opacity * 0.8})`,
              transition: 'opacity 0.1s ease-out'
            }}
          />
        </div>
      </Html>
    </group>
  );
};

const Earth = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const [colorMap] = useTexture(['https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg']);

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.00003;
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={colorMap} metalness={0.1} roughness={0.7} />
    </mesh>
  );
};

const TrajectoryLine = ({ position, color }: { position: THREE.Vector3, color: string }) => {
  const points = useMemo(() => {
    const segments = 64;
    const pointsArray = [];
    const radius = position.length();
    const direction = position.clone().normalize();
    const perpendicular = new THREE.Vector3(1, 0, 0);
    
    if (Math.abs(direction.dot(perpendicular)) > 0.9) perpendicular.set(0, 1, 0);

    const axis = direction.clone().cross(perpendicular).normalize();
    const start = direction.clone().multiplyScalar(radius);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pointsArray.push(start.clone().applyAxisAngle(axis, angle));
    }

    return pointsArray;
  }, [position]);

  return <Line points={points} color={color} lineWidth={1} opacity={0.6} transparent />;
};

const CollisionLine = ({ start, end, color = "#ff3366" }: { start: THREE.Vector3, end: THREE.Vector3, color?: string }) => {
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={2}
      dashed
      dashSize={0.2}
      gapSize={0.1}
      opacity={0.8}
      transparent
    />
  );
};

const SatelliteModel = ({ position, color, obj }: { position: THREE.Vector3, color: string, obj: SpaceObject }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.002;
  });
  
  return (
    <group ref={ref} position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 16]} />
        <meshStandardMaterial color="white" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.008, 0.08]} />
        <meshStandardMaterial color="black" emissive="blue" emissiveIntensity={0.3} />
      </mesh>
      
      {obj.collisionRisk === 'High' && (
        <AlertIcon position={new THREE.Vector3(0, 0.2, 0)} />
      )}
      
      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs min-w-max">
            <div className="font-bold">{obj.name}</div>
            <div>Type: {obj.type === 'satellite' ? 'Satellite' : 'Debris'}</div>
            <div>Status: {obj.status.toUpperCase()}</div>
            <div>Collision Risk: {obj.collisionRisk}</div>
            {obj.collisionWith && <div>Potential collision with: {obj.collisionWith}</div>}
          </div>
        </Html>
      )}
    </group>
  );
};

const DebrisModel = ({ position, color, obj }: { position: THREE.Vector3, color: string, obj: SpaceObject }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.01;
      ref.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh ref={ref} position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.8} metalness={0.2} />
      
      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs min-w-max">
            <div className="font-bold">{obj.name}</div>
            <div>Type: {obj.type === 'satellite' ? 'Satellite' : 'Debris'}</div>
            <div>Status: {obj.status.toUpperCase()}</div>
            <div>Collision Risk: {obj.collisionRisk}</div>
            {obj.collisionWith && <div>Potential collision with: {obj.collisionWith}</div>}
          </div>
        </Html>
      )}
    </mesh>
  );
};

const Atmosphere = () => (
  <mesh>
    <sphereGeometry args={[2.1, 64, 64]} />
    <meshStandardMaterial color="#00a8ff" transparent opacity={0.1} side={THREE.BackSide} />
  </mesh>
);

const Scene = () => {
  const collisionPairs = useMemo(() => {
    const pairs: {obj1: SpaceObject, obj2: SpaceObject}[] = [];
    
    mockSatellites.forEach(obj => {
      if (obj.collisionWith) {
        const otherObj = mockSatellites.find(o => o.name === obj.collisionWith);
        if (otherObj && 
            (obj.status === 'danger' || obj.status === 'warning') && 
            (otherObj.status === 'danger' || otherObj.status === 'warning')) {
          if (!pairs.some(p => 
            (p.obj1.id === obj.id && p.obj2.id === otherObj.id) || 
            (p.obj1.id === otherObj.id && p.obj2.id === obj.id)
          )) {
            pairs.push({obj1: obj, obj2: otherObj});
          }
        }
      }
    });
    
    return pairs;
  }, []);

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
        
        let color;
        if (obj.type === 'debris') {
          color = obj.collisionRisk === 'High' ? '#ff3366' : 
                 obj.collisionRisk === 'Medium' ? '#ffaa33' : '#33ff99';
        } else {
          color = obj.status === 'danger' 
            ? (obj.collisionRisk === 'High' ? '#ff3366' : '#ffaa33')
            : obj.status === 'warning' ? '#ffaa33' : '#33ff99';
        }
        
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
      
      {collisionPairs.map((pair, i) => {
        const pos1 = latLongToVector3(pair.obj1.lat, pair.obj1.lng, 2.2);
        const pos2 = latLongToVector3(pair.obj2.lat, pair.obj2.lng, 2.2);
        const distance = calculateDistance(pos1, pos2);
        
        if (distance < 2.0) {
          const isHighRisk = pair.obj1.collisionRisk === 'High' && pair.obj2.collisionRisk === 'High';
          return (
            <CollisionLine 
              key={`collision-${i}`}
              start={pos1}
              end={pos2}
              color={isHighRisk ? "#ff3366" : "#ffaa33"}
            />
          );
        }
        return null;
      })}
    </>
  );
};

const SpaceMap: React.FC<SpaceMapProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-xl overflow-hidden relative ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} className="h-full w-full">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls 
          enableZoom enablePan enableRotate 
          zoomSpeed={0.6} autoRotate={false}
          minDistance={3} maxDistance={10}
        />
      </Canvas>
      
      <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-xl"></div>
      
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-white/80">Operational</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-white/80">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-white/80">Danger</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex flex-col gap-2">
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
        <div className="flex items-center gap-2 mt-1">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-px bg-red-500"></div>
          </div>
          <span className="text-xs text-white/80">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-px bg-yellow-500"></div>
          </div>
          <span className="text-xs text-white/80">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-px bg-green-500"></div>
          </div>
          <span className="text-xs text-white/80">Low Risk</span>
        </div>
      </div>
    </div>
  );
};

export default SpaceMap;