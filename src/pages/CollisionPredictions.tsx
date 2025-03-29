import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import AlertPanel from '../components/dashboard/AlertPanel';
import { AlertTriangle, ChevronDown, Filter, Info, Orbit, Radar, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Mock data for collision predictions
const mockCollisionData = [
  {
    id: 'cp1',
    objectA: 'Starlink-1234',
    objectB: 'SL-16 R/B (Debris)',
    probability: 0.0183,
    timeToClosestApproach: '6h 23m',
    distance: 192,
    severity: 'high',
    status: 'monitoring'
  },
  {
    id: 'cp2', 
    objectA: 'ISS',
    objectB: 'Cosmos-1408 Debris',
    probability: 0.0092,
    timeToClosestApproach: '12h 45m',
    distance: 324,
    severity: 'medium',
    status: 'monitoring'
  },
  {
    id: 'cp3',
    objectA: 'NOAA-18',
    objectB: 'Fengyun-1C Debris',
    probability: 0.0071,
    timeToClosestApproach: '22h 10m',
    distance: 510,
    severity: 'medium',
    status: 'monitoring'
  },
  {
    id: 'cp4',
    objectA: 'OneWeb-0276',
    objectB: 'Iridium-33 Debris',
    probability: 0.0047,
    timeToClosestApproach: '15h 32m',
    distance: 725,
    severity: 'low',
    status: 'monitoring'
  },
  {
    id: 'cp5',
    objectA: 'CubeSat-XI',
    objectB: 'Breeze-M Debris',
    probability: 0.0036,
    timeToClosestApproach: '28h 17m',
    distance: 892,
    severity: 'low',
    status: 'monitoring'
  }
];

interface CollisionPredictionCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

const CollisionPredictionCard: React.FC<CollisionPredictionCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  className = '' 
}) => {
  return (
    <Card className={`bg-space-light neo-border border-white/10 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-normal text-white/70">{title}</CardTitle>
          <div className="p-1.5 rounded-full bg-space-dark text-neon-blue">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {description && (
          <CardDescription className="text-white/60 text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

// ... (CollisionPredictionCard component remains the same)

const CollisionPredictions: React.FC = () => {
  // State and ref declarations
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [threeJSInitialized, setThreeJSInitialized] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Scene objects refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number | null>(null);
  const satelliteRef = useRef<THREE.Mesh | null>(null);
  const debrisRef = useRef<THREE.Mesh | null>(null);
  const collisionPointRef = useRef<THREE.Mesh | null>(null);

  // Statistics calculations
  const highRiskCount = mockCollisionData.filter(item => item.severity === 'high').length;
  const totalPredictions = mockCollisionData.length;
  const averageDistance = Math.round(
    mockCollisionData.reduce((acc, item) => acc + item.distance, 0) / mockCollisionData.length
  );

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-status-danger';
      case 'medium': return 'text-status-warning';
      case 'low': return 'text-neon-blue';
      default: return 'text-white';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <ShieldAlert size={16} className="text-status-danger" />;
      case 'medium': return <AlertTriangle size={16} className="text-status-warning" />;
      case 'low': return <Info size={16} className="text-neon-blue" />;
      default: return null;
    }
  };

  // Initialize Three.js scene with enhanced visualization
  const initThreeJSScene = (prediction: typeof mockCollisionData[0]) => {
    if (!canvasRef.current) return;

    // Clear previous scene
    if (rendererRef.current && canvasRef.current.contains(rendererRef.current.domElement)) {
      canvasRef.current.removeChild(rendererRef.current.domElement);
      sceneRef.current = null;
    }

    // Scene setup
    const width = canvasRef.current.clientWidth;
    const height = 400;

    // 1. Create scene with space background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020817);
    sceneRef.current = scene;

    // 2. Create camera with better initial position
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(2, 2, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Create renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    canvasRef.current.appendChild(renderer.domElement);

    // 4. Add orbit controls with damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // 5. Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // 6. Create satellite with more details
    const satelliteGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const satelliteMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
      specular: 0xffffff,
      shininess: 50
    });
    const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    satelliteRef.current = satellite;
    
    // Add solar panels to satellite
    const panelGeometry = new THREE.BoxGeometry(0.6, 0.02, 0.3);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.5, 0, 0);
    satellite.add(leftPanel);
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.5, 0, 0);
    satellite.add(rightPanel);

    // 7. Create debris with irregular shape
    const debrisGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
    const debrisMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.2,
      wireframe: false
    });
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debrisRef.current = debris;

    // 8. Position objects based on prediction data
    const distanceScale = Math.min(prediction.distance / 300, 3);
    satellite.position.set(-distanceScale, 0, 0);
    debris.position.set(distanceScale, 0.5, 0);

    // 9. Add trajectory paths (dashed lines)
    const trajectoryMaterial = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.2,
      gapSize: 0.1,
      linewidth: 1
    });
    
    // Satellite trajectory
    const satTrajectory = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-distanceScale * 2, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]),
      trajectoryMaterial
    );
    satTrajectory.computeLineDistances();
    
    // Debris trajectory
    const debrisTrajectory = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(distanceScale * 2, 0.5, 0),
        new THREE.Vector3(0, 0, 0)
      ]),
      trajectoryMaterial
    );
    debrisTrajectory.computeLineDistances();

    // 10. Add collision point marker (only for high risk)
    const collisionPointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const collisionPointMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    const collisionPoint = new THREE.Mesh(collisionPointGeometry, collisionPointMaterial);
    collisionPoint.position.set(0, 0, 0);
    collisionPoint.visible = prediction.severity === 'high';
    collisionPointRef.current = collisionPoint;

    // 11. Add danger zone (red sphere that pulses for high risk)
    if (prediction.severity === 'high') {
      const dangerZoneGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const dangerZoneMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const dangerZone = new THREE.Mesh(dangerZoneGeometry, dangerZoneMaterial);
      dangerZone.position.set(0, 0, 0);
      scene.add(dangerZone);
    }

    // 12. Add coordinate axes with labels
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Add all objects to scene
    scene.add(satellite);
    scene.add(debris);
    scene.add(satTrajectory);
    scene.add(debrisTrajectory);
    scene.add(collisionPoint);

    // 13. Animation loop
    let pulseDirection = 0.01;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate objects
      satellite.rotation.y += 0.005;
      debris.rotation.x += 0.01;
      debris.rotation.y += 0.007;
      
      // Move objects toward collision point
      if (satellite.position.distanceTo(debris.position) > 0.5) {
        satellite.position.lerp(new THREE.Vector3(0, 0, 0), 0.0005);
        debris.position.lerp(new THREE.Vector3(0, 0, 0), 0.0005);
      }
      
      // Pulse effect for collision point
      if (collisionPointRef.current && collisionPointRef.current.visible) {
        collisionPointRef.current.scale.x += pulseDirection * 0.05;
        collisionPointRef.current.scale.y += pulseDirection * 0.05;
        collisionPointRef.current.scale.z += pulseDirection * 0.05;
        
        if (collisionPointRef.current.scale.x > 1.2) pulseDirection = -0.01;
        if (collisionPointRef.current.scale.x < 0.8) pulseDirection = 0.01;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    setThreeJSInitialized(true);
  };

  // Clean up Three.js resources
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (canvasRef.current?.contains(rendererRef.current.domElement)) {
          canvasRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  // Handle row click
  const handleRowClick = (id: string) => {
    setSelectedPrediction(id === selectedPrediction ? null : id);
  };

  // Analyze trajectory function
  const analyzeTrajectory = (predictionId: string) => {
    setIsAnalyzing(true);
    setThreeJSInitialized(false);
    
    setTimeout(() => {
      const prediction = mockCollisionData.find(p => p.id === predictionId);
      
      const result = {
        predictionId,
        objects: [prediction?.objectA, prediction?.objectB],
        analysisTime: new Date().toLocaleTimeString(),
        trajectoryData: {
          closestApproach: prediction?.timeToClosestApproach,
          missDistance: prediction?.distance,
          relativeVelocity: `${(Math.random() * 5 + 10).toFixed(1)} km/s`,
          approachAngle: `${Math.floor(Math.random() * 90)}°`,
          probabilityChange: (Math.random() * 0.01 - 0.005).toFixed(4)
        },
        riskAssessment: {
          currentRisk: prediction?.probability.toFixed(4),
          projectedRisk: (parseFloat(prediction?.probability.toFixed(4)) + parseFloat((Math.random() * 0.01 - 0.005).toFixed(4))).toFixed(4),
          confidenceLevel: `${Math.floor(Math.random() * 30) + 70}%`
        },
        recommendations: [
          "Monitor continuously",
          "Prepare contingency plan",
          "Consider orbital adjustment if probability increases"
        ]
      };
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setIsAnalysisModalOpen(true);
      
      // Initialize Three.js after modal opens
      setTimeout(() => {
        if (prediction) initThreeJSScene(prediction);
      }, 100);
    }, 1500);
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Title and metadata
      pdf.setFontSize(20);
      pdf.setTextColor(40, 53, 147);
      pdf.text('Collision Analysis Report', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

      // Capture Three.js canvas
      if (canvasRef.current && rendererRef.current) {
        // Pause animation for stable capture
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Force final render
        rendererRef.current.render(sceneRef.current!, cameraRef.current!);

        // Create temporary canvas for capture
        const canvas3D = rendererRef.current.domElement;
        const canvas2D = document.createElement('canvas');
        canvas2D.width = canvas3D.width;
        canvas2D.height = canvas3D.height;
        
        const ctx = canvas2D.getContext('2d');
        if (ctx) {
          // Fill background
          ctx.fillStyle = '#020817';
          ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);
          
          // Copy WebGL content
          ctx.drawImage(canvas3D, 0, 0);
          
          // Add to PDF
          const imgData = canvas2D.toDataURL('image/png');
          const imgWidth = 180; // mm
          const imgHeight = (canvas2D.height * imgWidth) / canvas2D.width;
          
          pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
        }

        // Restart animation
        if (sceneRef.current && cameraRef.current && rendererRef.current) {
          const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
          };
          animate();
        }
      }

      // Collision details
      pdf.setFontSize(14);
      pdf.setTextColor(40, 53, 147);
      pdf.text('Collision Details', 15, pdf.internal.pageSize.getHeight() - 80);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      if (analysisResult) {
        pdf.text(`Objects: ${analysisResult.objects.join(' and ')}`, 15, pdf.internal.pageSize.getHeight() - 70);
        pdf.text(`Probability: ${analysisResult.riskAssessment.currentRisk}`, 15, pdf.internal.pageSize.getHeight() - 60);
        pdf.text(`Time to Closest Approach: ${analysisResult.trajectoryData.closestApproach}`, 15, pdf.internal.pageSize.getHeight() - 50);
        pdf.text(`Miss Distance: ${analysisResult.trajectoryData.missDistance} m`, 15, pdf.internal.pageSize.getHeight() - 40);
      }

      // Risk assessment
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setTextColor(40, 53, 147);
      pdf.text('Risk Assessment', 15, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      if (analysisResult) {
        pdf.text(`Current Probability: ${analysisResult.riskAssessment.currentRisk}`, 15, 30);
        pdf.text(`Projected Probability: ${analysisResult.riskAssessment.projectedRisk}`, 15, 40);
        pdf.text(`Confidence Level: ${analysisResult.riskAssessment.confidenceLevel}`, 15, 50);
      }

      // Recommendations
      pdf.setFontSize(14);
      pdf.setTextColor(40, 53, 147);
      pdf.text('Recommendations', 15, 70);
      
      pdf.setFontSize(12);
      if (analysisResult) {
        analysisResult.recommendations.forEach((rec: string, index: number) => {
          pdf.text(`• ${rec}`, 15, 80 + (index * 10));
        });
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Generated by Space Collision Monitoring System', 105, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

      // Save PDF
      pdf.save(`collision-report-${analysisResult?.predictionId || 'unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1">
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-glow">Collision Predictions</h1>
            <p className="text-white/70">Real-time analytics for potential orbital conflicts</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <CollisionPredictionCard 
              title="High Risk Collisions" 
              value={highRiskCount}
              icon={<AlertTriangle size={18} />}
              description="Probability > 0.01" 
            />
            <CollisionPredictionCard 
              title="Total Predictions" 
              value={totalPredictions}
              icon={<Radar size={18} />}
              description="Active monitoring" 
            />
            <CollisionPredictionCard 
              title="Average Miss Distance" 
              value={`${averageDistance} m`}
              icon={<Orbit size={18} />}
              description="Across all predictions" 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card className="neo-border border-white/10 bg-space-dark overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="font-semibold">Active Collision Predictions</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Filter size={14} />
                      Filter
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-space-light/50">
                        <TableHead className="text-white/70">Objects</TableHead>
                        <TableHead className="text-white/70 text-right">Probability</TableHead>
                        <TableHead className="text-white/70 text-right">Time to TCA</TableHead>
                        <TableHead className="text-white/70 text-right">Miss Distance</TableHead>
                        <TableHead className="text-white/70 text-right">Severity</TableHead>
                        <TableHead className="text-white/70 w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCollisionData.map((prediction) => (
                        <React.Fragment key={prediction.id}>
                          <TableRow 
                            className={`border-white/10 cursor-pointer ${
                              selectedPrediction === prediction.id ? 'bg-space-light/30' : 'hover:bg-space-light/20'
                            }`}
                            onClick={() => handleRowClick(prediction.id)}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">{prediction.objectA}</div>
                                <div className="text-white/60 text-xs">{prediction.objectB}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{prediction.probability.toFixed(4)}</TableCell>
                            <TableCell className="text-right">{prediction.timeToClosestApproach}</TableCell>
                            <TableCell className="text-right">{prediction.distance} m</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getSeverityIcon(prediction.severity)}
                                <span className={getSeverityColor(prediction.severity)}>
                                  {prediction.severity.charAt(0).toUpperCase() + prediction.severity.slice(1)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ChevronDown 
                                size={16} 
                                className={`transition-transform ${selectedPrediction === prediction.id ? 'rotate-180' : ''}`} 
                              />
                            </TableCell>
                          </TableRow>
                          {selectedPrediction === prediction.id && (
                            <TableRow className="border-white/10 bg-space-light/10">
                              <TableCell colSpan={6} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Primary Object Details</h4>
                                    <div className="text-xs text-white/70 mb-1">ID: SATCAT-{Math.floor(Math.random() * 90000) + 10000}</div>
                                    <div className="text-xs text-white/70 mb-1">Type: Active Satellite</div>
                                    <div className="text-xs text-white/70 mb-1">Altitude: 550 km</div>
                                    <div className="text-xs text-white/70">Inclination: 53.0°</div>
                                  </div>
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Secondary Object Details</h4>
                                    <div className="text-xs text-white/70 mb-1">ID: SATCAT-{Math.floor(Math.random() * 90000) + 10000}</div>
                                    <div className="text-xs text-white/70 mb-1">Type: Debris</div>
                                    <div className="text-xs text-white/70 mb-1">Size: 10 cm (est.)</div>
                                    <div className="text-xs text-white/70">Origin: 2007 ASAT test</div>
                                  </div>
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Conjunction Details</h4>
                                    <div className="text-xs text-white/70 mb-1">First detected: 12h ago</div>
                                    <div className="text-xs text-white/70 mb-1">Last updated: 35m ago</div>
                                    <div className="text-xs text-white/70 mb-1">Relative velocity: 14.2 km/s</div>
                                    <div className="text-xs text-white/70">Radial miss: 134 m</div>
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-xs"
                                    onClick={() => analyzeTrajectory(prediction.id)}
                                    disabled={isAnalyzing}
                                  >
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze Trajectory'}
                                  </Button>
                                  <Button size="sm" className="h-8 text-xs">Mitigate Risk</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
            <div>
              <AlertPanel className="h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analysis Results Modal */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="bg-space-dark border-white/10 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-glow">Trajectory Analysis Results</DialogTitle>
            <DialogDescription className="text-white/70">
              3D visualization of potential collision scenario
            </DialogDescription>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-4">
              {/* Enhanced 3D Visualization */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                <div ref={canvasRef} className="absolute inset-0" />
                
                {/* Improved Legend */}
                <div className="absolute bottom-4 left-4 z-10 bg-space-dark/90 p-3 rounded-lg text-xs space-y-2 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium">{analysisResult.objects[0]} (Satellite)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">{analysisResult.objects[1]} (Debris)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-green-500"></div>
                    <span>Trajectory Path</span>
                  </div>
                  {parseFloat(analysisResult.riskAssessment.currentRisk) > 0.01 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Potential Collision Point</span>
                    </div>
                  )}
                  <div className="pt-2 text-white/60 text-[0.7rem]">
                    <p>• Rotate: Left mouse drag</p>
                    <p>• Zoom: Mouse wheel</p>
                    <p>• Pan: Right mouse drag</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-neon-blue text-sm mb-2">Objects Analyzed</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.objects.map((obj: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-neon-blue text-sm mb-2">Analysis Time</h4>
                  <div className="text-sm">{analysisResult.analysisTime}</div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-neon-blue text-sm mb-2">Trajectory Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-white/70">Closest Approach</div>
                    <div className="text-sm">{analysisResult.trajectoryData.closestApproach}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Miss Distance</div>
                    <div className="text-sm">{analysisResult.trajectoryData.missDistance} m</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Relative Velocity</div>
                    <div className="text-sm">{analysisResult.trajectoryData.relativeVelocity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Approach Angle</div>
                    <div className="text-sm">{analysisResult.trajectoryData.approachAngle}</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-neon-blue text-sm mb-2">Risk Assessment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-white/70">Current Probability</div>
                    <div className="text-sm">{analysisResult.riskAssessment.currentRisk}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Projected Probability</div>
                    <div className="text-sm">
                      {analysisResult.riskAssessment.projectedRisk}
                      {parseFloat(analysisResult.riskAssessment.projectedRisk) > parseFloat(analysisResult.riskAssessment.currentRisk) ? (
                        <span className="text-status-danger ml-1">↑</span>
                      ) : (
                        <span className="text-status-success ml-1">↓</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/70">Confidence Level</div>
                    <div className="text-sm">{analysisResult.riskAssessment.confidenceLevel}</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-neon-blue text-sm mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button variant="outline" size="sm" onClick={() => setIsAnalysisModalOpen(false)}>
                  Close
                </Button>
                <Button 
                  size="sm" 
                  onClick={generatePDF}
                >
                  {isGeneratingPDF ? 'Generating PDF...' : 'View Detailed Report'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollisionPredictions;