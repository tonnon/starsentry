import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import axios from 'axios';
import * as satellite from 'satellite.js';

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
  collisionWith?: string[];
}

// Collision detection thresholds
const COLLISION_THRESHOLD = 0.15; // Immediate danger
const HIGH_RISK_DISTANCE = 0.25;
const MEDIUM_RISK_DISTANCE = 0.4;
const LOW_RISK_DISTANCE = 0.6;

interface SpaceObjectWithPhysics extends SpaceObject {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
}

async function fetchNASASatelliteData() {
  try {
    const response = await axios.get(
      'https://api.nasa.gov/DONKI/notifications?api_key=DEMO_KEY'
    );
    
    const nasaData = response.data.map((item: any) => ({
      id: item.messageID,
      name: item.messageType || 'NASA Object',
      lat: Math.random() * 180 - 90,
      lng: Math.random() * 360 - 180,
      status: ['operational', 'warning', 'danger'][Math.floor(Math.random() * 3)],
      type: Math.random() > 0.5 ? 'satellite' : 'debris',
      altitude: Math.random() * 2000 + 200,
      collisionRisk: 'Low'
    }));

    return nasaData;
  } catch (error) {
    console.error("Error fetching NASA data:", error);
    return [];
  }
}

async function fetchTLEData() {
  try {
    const response = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
    const tleData = response.data.split('\n');
    const satellites: SpaceObject[] = [];
    
    for (let i = 0; i < tleData.length; i += 3) {
      const name = tleData[i]?.trim() || `SAT-${i}`;
      const tleLine1 = tleData[i+1];
      const tleLine2 = tleData[i+2];
      
      if (tleLine1 && tleLine2) {
        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
        const positionAndVelocity = satellite.propagate(satrec, new Date());
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
          const gmst = satellite.gstime(new Date());
          const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
          
          satellites.push({
            id: `sat-${i}`,
            name,
            lat: satellite.degreesLat(positionGd.latitude),
            lng: satellite.degreesLong(positionGd.longitude),
            altitude: positionGd.height,
            status: 'operational',
            type: 'satellite',
            collisionRisk: 'Low'
          });
        }
      }
    }
    
    return satellites;
  } catch (error) {
    console.error("Error fetching TLE data:", error);
    return [];
  }
}



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

const AlertIcon = ({ position, riskLevel }: { 
  position: THREE.Vector3, 
  riskLevel: 'High' | 'Medium' | 'Low' 
}) => {
  const ref = useRef<THREE.Group>(null);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [innerScale, setInnerScale] = useState(1);

  useFrame(() => {
    if (ref.current) {
      const time = Date.now();
      
      let pulseSpeed, pulseIntensity;
      
      switch(riskLevel) {
        case 'High':
          pulseSpeed = 500;
          pulseIntensity = 0.9;
          break;
        case 'Medium':
          pulseSpeed = 800;
          pulseIntensity = 0.7;
          break;
        case 'Low':
          pulseSpeed = 1200;
          pulseIntensity = 0.5;
          break;
        default:
          pulseSpeed = 1000;
          pulseIntensity = 0.6;
      }

      const newOpacity = 0.4 + pulseIntensity * Math.sin(time * Math.PI / pulseSpeed);
      const newScale = 1 + (pulseIntensity * 0.4 * Math.sin(time * Math.PI / (pulseSpeed * 1.3)));
      const newInnerScale = 0.8 + (pulseIntensity * 0.4 * Math.sin(time * Math.PI / (pulseSpeed * 0.8)));
      
      setOpacity(newOpacity);
      setScale(newScale);
      setInnerScale(newInnerScale);
    }
  });

  const colors = {
    High: '#ff3366',
    Medium: '#ffaa33',
    Low: '#ffff00'
  };

  return (
    <group ref={ref} position={[position.x, position.y, position.z]}>
      <Html center>
        <div 
          className="flex items-center justify-center"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div 
            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center relative"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${opacity * 0.3})`,
              boxShadow: `0 0 20px ${colors[riskLevel]}`,
              transition: 'all 0.1s ease-out'
            }}
          >
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: colors[riskLevel],
                opacity: opacity * 0.7,
                transform: `scale(${innerScale})`,
                transition: 'all 0.2s ease-out'
              }}
            />
            <div 
              className="w-2 h-2 rounded-full bg-white absolute"
              style={{
                opacity: opacity,
                transform: `scale(${innerScale * 1.5})`
              }}
            />
          </div>
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

const CollisionLine = ({ start, end, riskLevel }: { 
  start: THREE.Vector3, 
  end: THREE.Vector3, 
  riskLevel: 'High' | 'Medium' | 'Low'
}) => {
  const color = {
    High: "#ff3366",
    Medium: "#ffaa33",
    Low: "#ffff00"
  }[riskLevel];

  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={riskLevel === 'High' ? 3 : 2}
      dashed={riskLevel !== 'High'}
      dashSize={0.2}
      gapSize={0.1}
      opacity={riskLevel === 'High' ? 0.9 : 0.7}
      transparent
    />
  );
};

const SatelliteModel = ({ position, color, obj, onAlertClick }: { 
  position: THREE.Vector3, 
  color: string, 
  obj: SpaceObject,
  onAlertClick: () => void 
}) => {
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
      
      {hovered && (
        <Html distanceFactor={5}>
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs min-w-max">
            <div className="font-bold">{obj.name}</div>
            <div>Type: {obj.type === 'satellite' ? 'Satellite' : 'Debris'}</div>
            <div>Status: {obj.status.toUpperCase()}</div>
            <div>Collision Risk: {obj.collisionRisk}</div>
            {obj.collisionWith && (
              <div>Potential collisions with: {obj.collisionWith.join(', ')}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

const DebrisModel = ({ position, color, obj, onAlertClick }: { 
  position: THREE.Vector3, 
  color: string, 
  obj: SpaceObject,
  onAlertClick?: () => void 
}) => {
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
            {obj.collisionWith && (
              <div>Potential collisions with: {obj.collisionWith.join(', ')}</div>
            )}
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

const Scene = ({ orbitControlsRef, spaceObjects }: { 
  orbitControlsRef: React.RefObject<any>,
  spaceObjects: SpaceObject[]
}) => {
  const [enhancedObjects, setEnhancedObjects] = useState<SpaceObject[]>([]);
  const [collisionPairs, setCollisionPairs] = useState<{
    obj1: SpaceObject,
    obj2: SpaceObject,
    distance: number,
    timeToCollision: number | null,
    risk: 'High' | 'Medium' | 'Low'
  }[]>([]);

  useEffect(() => {
    // Calculate all positions and velocities
    const objectsWithPhysics: SpaceObjectWithPhysics[] = spaceObjects.map(obj => {
      const position = latLongToVector3(obj.lat, obj.lng, 2.2);
      
      // Simulate velocity - in a real app, this would come from TLE data
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      
      return {
        ...obj,
        position,
        velocity,
        radius: obj.type === 'satellite' ? 0.1 : 0.06
      };
    });

    // Detect collisions considering trajectories
    const newCollisionPairs: typeof collisionPairs = [];
    const collisionMap: Record<string, {names: string[], maxRisk: 'High' | 'Medium' | 'Low' | null}> = {};

    // Initialize collision map
    spaceObjects.forEach(obj => {
      collisionMap[obj.id] = { names: [], maxRisk: null };
    });

    // Check all pairs of objects
    for (let i = 0; i < objectsWithPhysics.length; i++) {
      for (let j = i + 1; j < objectsWithPhysics.length; j++) {
        const obj1 = objectsWithPhysics[i];
        const obj2 = objectsWithPhysics[j];
        
        // Calculate current distance
        const currentDistance = calculateDistance(obj1.position, obj2.position);
        
        // Calculate relative velocity
        const relativeVelocity = new THREE.Vector3().subVectors(obj2.velocity, obj1.velocity);
        
        // Calculate time to closest approach
        const relativePosition = new THREE.Vector3().subVectors(obj2.position, obj1.position);
        const tca = -relativePosition.dot(relativeVelocity) / relativeVelocity.lengthSq();
        
        // If tca is in the future
        if (tca > 0) {
          // Calculate positions at time of closest approach
          const futurePos1 = new THREE.Vector3().copy(obj1.position).addScaledVector(obj1.velocity, tca);
          const futurePos2 = new THREE.Vector3().copy(obj2.position).addScaledVector(obj2.velocity, tca);
          
          const futureDistance = calculateDistance(futurePos1, futurePos2);
          const combinedRadius = obj1.radius + obj2.radius;
          
          // Only consider if objects will be close enough
          if (futureDistance < combinedRadius * 5) {
            // Calculate miss distance (minimum distance between trajectories)
            const d = relativePosition.clone().addScaledVector(relativeVelocity, tca).length();
            
            let risk: 'High' | 'Medium' | 'Low' | null = null;
            let timeToCollision: number | null = null;
            
            // Check for actual collision (d < combined radii)
            if (d < combinedRadius) {
              risk = 'High';
              timeToCollision = tca;
            } 
            // Check for near misses
            else if (d < combinedRadius * 2) {
              risk = 'High';
            } 
            else if (d < combinedRadius * 3) {
              risk = 'Medium';
            } 
            else if (d < combinedRadius * 5) {
              risk = 'Low';
            }
            
            if (risk) {
              newCollisionPairs.push({ 
                obj1, 
                obj2, 
                distance: d,
                timeToCollision,
                risk 
              });
              
              // Update collision partners
              collisionMap[obj1.id].names.push(obj2.name);
              collisionMap[obj2.id].names.push(obj1.name);
              
              // Update max risk
              if (!collisionMap[obj1.id].maxRisk || risk === 'High') {
                collisionMap[obj1.id].maxRisk = risk;
              } else if (risk === 'Medium' && collisionMap[obj1.id].maxRisk !== 'High') {
                collisionMap[obj1.id].maxRisk = risk;
              } else if (risk === 'Low' && !collisionMap[obj1.id].maxRisk) {
                collisionMap[obj1.id].maxRisk = risk;
              }
              
              if (!collisionMap[obj2.id].maxRisk || risk === 'High') {
                collisionMap[obj2.id].maxRisk = risk;
              } else if (risk === 'Medium' && collisionMap[obj2.id].maxRisk !== 'High') {
                collisionMap[obj2.id].maxRisk = risk;
              } else if (risk === 'Low' && !collisionMap[obj2.id].maxRisk) {
                collisionMap[obj2.id].maxRisk = risk;
              }
            }
          }
        }
      }
    }

    // Sort by most critical collisions first
    newCollisionPairs.sort((a, b) => {
      if (a.risk === b.risk) {
        // Prefer actual collisions over near misses
        if (a.timeToCollision !== null && b.timeToCollision === null) return -1;
        if (b.timeToCollision !== null && a.timeToCollision === null) return 1;
        // Then by distance
        return a.distance - b.distance;
      }
      return a.risk === 'High' ? -1 : b.risk === 'High' ? 1 : a.risk === 'Medium' ? -1 : 1;
    });

    // Enhance objects with collision data
    const newEnhancedObjects = spaceObjects.map(obj => {
      const collisionData = collisionMap[obj.id];
      return {
        ...obj,
        collisionRisk: collisionData.maxRisk || obj.collisionRisk || 'None',
        collisionWith: collisionData.names.length > 0 ? collisionData.names : undefined
      };
    });

    setEnhancedObjects(newEnhancedObjects);
    setCollisionPairs(newCollisionPairs.slice(0, 15)); // Limit to 15 most critical collisions
  }, [spaceObjects]);

  const focusOnObject = (position: THREE.Vector3) => {
    if (orbitControlsRef.current) {
      const earthCenter = new THREE.Vector3(0, 0, 0);
      const direction = position.clone().sub(earthCenter).normalize();
      
      const cameraDistance = 6;
      const cameraPosition = direction.clone().multiplyScalar(cameraDistance);
      cameraPosition.y += 1.5;
      
      gsap.to(orbitControlsRef.current.object.position, {
        duration: 1.5,
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z,
        ease: "power2.inOut",
        onUpdate: () => {
          orbitControlsRef.current!.target.set(0, 0, 0);
        }
      });
    }
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0070ff" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Earth />
      <Atmosphere />
      
      {enhancedObjects.map((obj) => {
        const pos = latLongToVector3(obj.lat, obj.lng, 2.2);
        const showAlert = obj.collisionRisk && obj.collisionRisk !== 'None';
        
        let color;
        if (obj.type === 'debris') {
          color = obj.collisionRisk === 'High' ? '#ff3366' : 
                 obj.collisionRisk === 'Medium' ? '#ffaa33' : 
                 obj.collisionRisk === 'Low' ? '#ffff00' : '#33ff99';
        } else {
          color = obj.status === 'danger' 
            ? (obj.collisionRisk === 'High' ? '#ff3366' : 
               obj.collisionRisk === 'Medium' ? '#ffaa33' : '#ffff00')
            : obj.status === 'warning' ? '#ffaa33' : '#33ff99';
        }
        
        return (
          <React.Fragment key={obj.id}>
            <TrajectoryLine position={pos} color={color} />
            {obj.type === 'satellite' ? (
              <SatelliteModel 
                position={pos} 
                color={color} 
                obj={obj} 
                onAlertClick={() => focusOnObject(pos)}
              />
            ) : (
              <DebrisModel 
                position={pos} 
                color={color} 
                obj={obj} 
                onAlertClick={() => focusOnObject(pos)}
              />
            )}
            
            {showAlert && (
              <AlertIcon 
                position={new THREE.Vector3(pos.x * 1.1, pos.y * 1.1, pos.z * 1.1)}
                riskLevel={obj.collisionRisk as 'High' | 'Medium' | 'Low'}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {collisionPairs.map((pair, i) => {
        const pos1 = latLongToVector3(pair.obj1.lat, pair.obj1.lng, 2.2);
        const pos2 = latLongToVector3(pair.obj2.lat, pair.obj2.lng, 2.2);
        
        return (
          <CollisionLine 
            key={`collision-${i}`}
            start={pos1}
            end={pos2}
            riskLevel={pair.risk}
          />
        );
      })}
    </>
  );
};

const SpaceMap: React.FC<SpaceMapProps> = ({ className = '' }) => {
  const orbitControlsRef = useRef<any>(null);
  const [spaceObjects, setSpaceObjects] = useState<SpaceObject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Try NASA API first
        let data = await fetchNASASatelliteData();
        
        // Fall back to Celestrak
        if (data.length === 0) {
          data = await fetchTLEData();
        }
        

        
        setSpaceObjects(data);
      } catch (error) {
        console.error("Error loading space data:", error);
  
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`rounded-xl overflow-hidden relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Loading space data...</div>
        </div>
      )}
      
      <Canvas 
        camera={{ 
          position: [0, 0, 6], 
          fov: 45,
          near: 0.1,
          far: 1000,
          up: [0, 0, 1]
        }} 
        className="h-full w-full"
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene orbitControlsRef={orbitControlsRef} spaceObjects={spaceObjects} />
        </Suspense>
        <OrbitControls 
          ref={orbitControlsRef}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          autoRotate={false}
          minDistance={3}
          maxDistance={20}
          target={[0, 0, 0]}
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