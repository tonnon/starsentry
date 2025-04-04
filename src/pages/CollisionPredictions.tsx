import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AlertPanel from '../components/dashboard/AlertPanel';
import { AlertTriangle, ChevronDown, Filter, Info, Orbit, Radar, ShieldAlert, Loader2, Move3D } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { jsPDF } from 'jspdf';
import { gsap } from 'gsap';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

const CollisionPredictions: React.FC = () => {
  // State and ref declarations
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const beforeCanvasRef = useRef<HTMLDivElement>(null);
  const afterCanvasRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isManeuvering, setIsManeuvering] = useState(false);
  const [mitigationHistory, setMitigationHistory] = useState<Array<{
    id: string;
    predictionId: string;
    action: string;
    timestamp: string;
    success: boolean;
    newProbability?: number;
  }>>([]);
  const [showMitigationDialog, setShowMitigationDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState<'before' | 'after'>('before');
  const [maneuverCompleted, setManeuverCompleted] = useState<Record<string, boolean>>({});
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  // Scene objects refs for before and after scenes
  const beforeSceneRef = useRef<THREE.Scene | null>(null);
  const beforeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const beforeCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const beforeControlsRef = useRef<OrbitControls | null>(null);
  const beforeAnimationRef = useRef<number | null>(null);
  const beforeSatelliteRef = useRef<THREE.Mesh | null>(null);
  const beforeDebrisRef = useRef<THREE.Mesh | null>(null);
  const beforeCollisionPointRef = useRef<THREE.Mesh | null>(null);

  const afterSceneRef = useRef<THREE.Scene | null>(null);
  const afterRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const afterCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const afterControlsRef = useRef<OrbitControls | null>(null);
  const afterAnimationRef = useRef<number | null>(null);
  const afterSatelliteRef = useRef<THREE.Mesh | null>(null);
  const afterDebrisRef = useRef<THREE.Mesh | null>(null);
  const afterCollisionPointRef = useRef<THREE.Mesh | null>(null);

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

  // Initialize Three.js scene for before/after visualization
  const initThreeJSScene = (
    prediction: typeof mockCollisionData[0],
    canvasRef: React.RefObject<HTMLDivElement>,
    isAfterScene: boolean
  ) => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    // If scene already exists, just update positions
    const sceneRef = isAfterScene ? afterSceneRef : beforeSceneRef;
    if (sceneRef.current) {
      const satelliteRef = isAfterScene ? afterSatelliteRef : beforeSatelliteRef;
      const debrisRef = isAfterScene ? afterDebrisRef : beforeDebrisRef;
      
      if (satelliteRef.current && debrisRef.current) {
        const distanceScale = Math.min(prediction.distance / 300, 3);
        
        if (isAfterScene && maneuverCompleted[prediction.id]) {
          satelliteRef.current.position.set(-2, 1.5, 0);
          debrisRef.current.position.set(distanceScale, 0.5, 0);
        } else {
          satelliteRef.current.position.set(-distanceScale, 0, 0);
          debrisRef.current.position.set(distanceScale, 0.5, 0);
        }
      }
      return;
    }

    // Clean up previous scene if it exists
    const cleanupScene = () => {
      const sceneRef = isAfterScene ? afterSceneRef : beforeSceneRef;
      const rendererRef = isAfterScene ? afterRendererRef : beforeRendererRef;
      const animationRef = isAfterScene ? afterAnimationRef : beforeAnimationRef;
      const controlsRef = isAfterScene ? afterControlsRef : beforeControlsRef;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (canvasRef.current?.contains(rendererRef.current.domElement)) {
          canvasRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
    };

    cleanupScene();

    // Scene setup
    const width = container.clientWidth;
    const height = 400;

    // Create scene with space background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020817);
    if (isAfterScene) {
      afterSceneRef.current = scene;
    } else {
      beforeSceneRef.current = scene;
    }

    // Create camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(2, 2, 5);
    camera.lookAt(0, 0, 0);
    if (isAfterScene) {
      afterCameraRef.current = camera;
    } else {
      beforeCameraRef.current = camera;
    }

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (isAfterScene) {
      afterRendererRef.current = renderer;
    } else {
      beforeRendererRef.current = renderer;
    }
    canvasRef.current.appendChild(renderer.domElement);

    

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    if (isAfterScene) {
      afterControlsRef.current = controls;
    } else {
      beforeControlsRef.current = controls;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Create satellite
    const satelliteGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const satelliteMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3b82f6,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
      specular: 0xffffff,
      shininess: 50
    });
    const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
    if (isAfterScene) {
      afterSatelliteRef.current = satellite;
    } else {
      beforeSatelliteRef.current = satellite;
    }
    
    // Add solar panels
    const panelGeometry = new THREE.BoxGeometry(0.6, 0.02, 0.3);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-0.5, 0, 0);
    satellite.add(leftPanel);
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(0.5, 0, 0);
    satellite.add(rightPanel);

    // Create debris
    const debrisGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
    const debrisMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.2,
      wireframe: false
    });
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    if (isAfterScene) {
      afterDebrisRef.current = debris;
    } else {
      beforeDebrisRef.current = debris;
    }

    // Position objects
    const distanceScale = Math.min(prediction.distance / 300, 3);
    
    if (isAfterScene && maneuverCompleted[prediction.id]) {
      // After maneuver positions - make the satellite clearly avoid the collision
      satellite.position.set(-2, 1.5, 0); // Move satellite up and to the side
      debris.position.set(distanceScale, 0.5, 0); // Debris continues on original path
      
      // Add visual indicator of successful avoidance
      const successIndicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7 })
      );
      successIndicator.position.set(0, 0.75, 0); // Midpoint of new path
      scene.add(successIndicator);

      // Add success path indicator
      const successPathGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-2, 1.5, 0), // New satellite position
        new THREE.Vector3(0, 0.75, 0),  // Midpoint
        new THREE.Vector3(distanceScale, 0.5, 0)      // Debris position
      ]);
      
      const successPathMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 2
      });
      
      const successPath = new THREE.Line(successPathGeometry, successPathMaterial);
      scene.add(successPath);
    } else {
      // Original positions heading toward collision
      satellite.position.set(-distanceScale, 0, 0);
      debris.position.set(distanceScale, 0.5, 0);
      
      // Add danger zone only in before scene for high risk
      if (!isAfterScene && prediction.severity === 'high') {
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
    }

    // Add trajectory paths
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

    // Add collision point marker (only for high risk in before scene)
    const collisionPointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const collisionPointMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    const collisionPoint = new THREE.Mesh(collisionPointGeometry, collisionPointMaterial);
    collisionPoint.position.set(0, 0, 0);
    collisionPoint.visible = !isAfterScene && prediction.severity === 'high';
    if (isAfterScene) {
      afterCollisionPointRef.current = collisionPoint;
    } else {
      beforeCollisionPointRef.current = collisionPoint;
    }

    // Add coordinate axes
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Add all objects to scene
    scene.add(satellite);
    scene.add(debris);
    scene.add(satTrajectory);
    scene.add(debrisTrajectory);
    scene.add(collisionPoint);

    // Animation loop
    const animate = () => {
      const animationRef = isAfterScene ? afterAnimationRef : beforeAnimationRef;
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate objects
      satellite.rotation.y += 0.005;
      debris.rotation.x += 0.01;
      debris.rotation.y += 0.007;
      
      // Move objects toward collision point only in before scene if maneuver not completed
      if (!isAfterScene && !maneuverCompleted[prediction.id] && satellite.position.distanceTo(debris.position) > 0.5) {
        satellite.position.lerp(new THREE.Vector3(0, 0, 0), 0.0005);
        debris.position.lerp(new THREE.Vector3(0, 0, 0), 0.0005);
      }
      
      // Pulse effect for collision point
      if (collisionPoint.visible) {
        let pulseDirection = 0.01;
        collisionPoint.scale.x += pulseDirection * 0.05;
        collisionPoint.scale.y += pulseDirection * 0.05;
        collisionPoint.scale.z += pulseDirection * 0.05;
        
        if (collisionPoint.scale.x > 1.2) pulseDirection = -0.01;
        if (collisionPoint.scale.x < 0.8) pulseDirection = 0.01;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
  };

  // Clean up Three.js resources
  useEffect(() => {
    return () => {
      // Clean up before scene
      if (beforeAnimationRef.current) cancelAnimationFrame(beforeAnimationRef.current);
      if (beforeControlsRef.current) beforeControlsRef.current.dispose();
      if (beforeRendererRef.current) {
        beforeRendererRef.current.dispose();
        if (beforeCanvasRef.current?.contains(beforeRendererRef.current.domElement)) {
          beforeCanvasRef.current.removeChild(beforeRendererRef.current.domElement);
        }
      }

      // Clean up after scene
      if (afterAnimationRef.current) cancelAnimationFrame(afterAnimationRef.current);
      if (afterControlsRef.current) afterControlsRef.current.dispose();
      if (afterRendererRef.current) {
        afterRendererRef.current.dispose();
        if (afterCanvasRef.current?.contains(afterRendererRef.current.domElement)) {
          afterCanvasRef.current.removeChild(afterRendererRef.current.domElement);
        }
      }
    };
  }, []);

  // Initialize scenes when prediction is selected or maneuver completed
  useEffect(() => {
    if (analysisResult && selectedPrediction) {
      const prediction = mockCollisionData.find(p => p.id === selectedPrediction);
      if (prediction) {
        // Initialize before scene only once
        if (!beforeSceneRef.current) {
          setTimeout(() => {
            initThreeJSScene(prediction, beforeCanvasRef, false);
          }, 0);
        }
  
        // Initialize after scene only if there's successful mitigation history
        const hasSuccessfulMitigation = mitigationHistory.some(
          m => m.predictionId === selectedPrediction && m.success
        );
        
        if (hasSuccessfulMitigation && !afterSceneRef.current) {
          setTimeout(() => {
            initThreeJSScene(prediction, afterCanvasRef, true);
          }, 0);
        }
      }
    }
  }, [analysisResult, selectedPrediction, maneuverCompleted, mitigationHistory]);

  // Handle row click
  const handleRowClick = (id: string) => {
    setSelectedPrediction(id === selectedPrediction ? null : id);
    if (id !== selectedPrediction) {
      setAnalysisResult(null);
    }
  };

  // Analyze trajectory function
  const analyzeTrajectory = (predictionId: string) => {
    setIsAnalyzing(true);
    setIsButtonDisabled(true);
    
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
      setIsButtonDisabled(false);
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

      // Capture Three.js canvas (using before scene for PDF)
      if (beforeCanvasRef.current && beforeRendererRef.current) {
        // Pause animation for stable capture
        if (beforeAnimationRef.current) {
          cancelAnimationFrame(beforeAnimationRef.current);
        }

        // Force final render
        beforeRendererRef.current.render(beforeSceneRef.current!, beforeCameraRef.current!);

        // Create temporary canvas for capture
        const canvas3D = beforeRendererRef.current.domElement;
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
        if (beforeSceneRef.current && beforeCameraRef.current && beforeRendererRef.current) {
          const animate = () => {
            beforeAnimationRef.current = requestAnimationFrame(animate);
            beforeRendererRef.current!.render(beforeSceneRef.current!, beforeCameraRef.current!);
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

  const simulateOrbitalManeuver = (predictionId: string) => {
    setIsManeuvering(true);
    setShowMitigationDialog(false);
    
    const prediction = mockCollisionData.find(p => p.id === predictionId);
    
    toast({
      title: "Orbital Maneuver Initiated",
      description: `Calculating burn parameters for ${prediction?.objectA}...`,
    });
  
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% chance of success
      const newProbability = success ? prediction!.probability * 0.2 : prediction!.probability * 1.1;
      
      if (success) {
        toast({
          title: "Maneuver Successful",
          description: `Orbit adjusted. New collision probability: ${newProbability.toFixed(4)}`,
          className: 'bg-green-500 text-white',
        });
        
        // Update maneuver state
        setManeuverCompleted(prev => ({...prev, [predictionId]: true}));
        
        // Force recreation of after scene with new positions
        if (afterCanvasRef.current && prediction) {
          // Clean up existing after scene
          if (afterAnimationRef.current) cancelAnimationFrame(afterAnimationRef.current);
          if (afterControlsRef.current) afterControlsRef.current.dispose();
          if (afterRendererRef.current) {
            afterRendererRef.current.dispose();
            if (afterCanvasRef.current.contains(afterRendererRef.current.domElement)) {
              afterCanvasRef.current.removeChild(afterRendererRef.current.domElement);
            }
          }
          afterSceneRef.current = null;
          
          // Create new after scene with maneuvered positions
          initThreeJSScene(prediction, afterCanvasRef, true);
        }
      } else {
        toast({
          title: "Maneuver Failed",
          description: "Insufficient fuel or thruster malfunction",
          variant: "destructive",
        });
      }
  
      // Add to history
      setMitigationHistory(prev => [...prev, {
        id: crypto.randomUUID(),
        predictionId,
        action: "Orbital Maneuver",
        timestamp: new Date().toISOString(),
        success,
        newProbability: success ? newProbability : undefined
      }]);
      
      setIsManeuvering(false);
      setCurrentTab('after');
    }, 3000);
  };  

  const issueCollisionWarning = (predictionId: string) => {
    setShowMitigationDialog(false);
    toast({
      title: "Collision Warning Issued",
      description: "All relevant operators have been notified",
    });
    
    setMitigationHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      predictionId,
      action: "Collision Warning",
      timestamp: new Date().toISOString(),
      success: true
    }]);
  };

  const handleMitigateClick = () => {
    if (!selectedPrediction) {
      toast({
        title: "No selection",
        description: "Please select a prediction first",
        variant: "destructive",
      });
      return;
    }
    setShowMitigationDialog(true);
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
                                  <Button 
                                    size="sm" 
                                    className="h-8 text-xs"
                                    onClick={handleMitigateClick}
                                    disabled={isButtonDisabled || isAnalyzing}
                                  >
                                    <ShieldAlert className="h-4 w-4 mr-1" />
                                    Mitigate Risk
                                  </Button>
                                </div>

                                {/* Analysis Results Section */}
                                {analysisResult && analysisResult.predictionId === prediction.id && (
                                  <div className="mt-6 border-t border-white/10 pt-4">
                                    <div className="space-y-4">
                                      {/* Enhanced 3D Visualization with Tabs */}
                                      <Tabs>
                                        <TabsContent value="before" forceMount>
                                          <div className="relative h-96 w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                                            <div ref={beforeCanvasRef} className="absolute inset-0 w-full" />
                                            
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
                                        </TabsContent>
                                        {maneuverCompleted[selectedPrediction] ?                                         
                                          <TabsContent value="after" forceMount>
                                            <div className="relative h-96 w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                                              <div ref={afterCanvasRef} className="absolute inset-0" />
                                              
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
                                                  <span>Original Path</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                  <span>Avoidance Path</span>
                                                </div>
                                                <div className="pt-2 text-white/60 text-[0.7rem]">
                                                  <p>• Rotate: Left mouse drag</p>
                                                  <p>• Zoom: Mouse wheel</p>
                                                  <p>• Pan: Right mouse drag</p>
                                                </div>
                                              </div>
                                            </div>
                                          </TabsContent> : null}
                                      </Tabs>

                                      {/* Mitigation History */}
                                      <div className="border-t border-white/10 pt-4">
                                        <h4 className="text-neon-blue text-sm mb-2">Mitigation History</h4>
                                        {mitigationHistory.filter(m => m.predictionId === analysisResult?.predictionId).length > 0 ? (
                                          <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {mitigationHistory
                                              .filter(m => m.predictionId === analysisResult?.predictionId)
                                              .map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-2 bg-space rounded">
                                                  <div className="flex items-center gap-2">
                                                    {item.success ? (
                                                      <ShieldAlert size={14} className="text-status-success" />
                                                    ) : (
                                                      <AlertTriangle size={14} className="text-status-danger" />
                                                    )}
                                                    <span className="text-sm">{item.action}</span>
                                                  </div>
                                                  <span className="text-xs text-white/60">
                                                    {new Date(item.timestamp).toLocaleTimeString()}
                                                  </span>
                                                </div>
                                              ))}
                                          </div>
                                        ) : (
                                          <p className="text-sm text-white/70">No mitigation actions recorded</p>
                                        )}
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
                                        <Button 
                                          size="sm" 
                                          onClick={generatePDF}
                                        >
                                          {isGeneratingPDF ? 'Generating PDF...' : 'View Detailed Report'}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
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

      {/* Mitigation Dialog */}
      <Dialog open={showMitigationDialog} onOpenChange={setShowMitigationDialog}>
        <DialogContent className="bg-space-dark border-white/10">
          <DialogHeader>
            <DialogTitle>Select Mitigation Strategy</DialogTitle>
            <DialogDescription className="text-white/70">
              Choose an action to reduce collision risk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                if (selectedPrediction) {
                  simulateOrbitalManeuver(selectedPrediction);
                }
              }}
              disabled={isManeuvering}
            >
              {isManeuvering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Move3D size={16} className="mr-2" />
              )}
              Perform Orbital Maneuver
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                if (selectedPrediction) {
                  issueCollisionWarning(selectedPrediction);
                }
              }}
            >
              <AlertTriangle size={16} className="mr-2" />
              Issue Collision Warning
            </Button>
          </div>
          
          {/* Cost Estimation Section */}
          <div className="mt-4 p-3 bg-space rounded-lg">
            <h4 className="text-sm font-medium mb-2">Maneuver Cost Estimation</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-white/70">Fuel Required</div>
                <div>{(Math.random() * 5 + 8).toFixed(1)} kg</div>
              </div>
              <div>
                <div className="text-white/70">ΔV</div>
                <div>{(Math.random() * 3 + 2).toFixed(1)} m/s</div>
              </div>
              <div>
                <div className="text-white/70">Duration</div>
                <div>{Math.floor(Math.random() * 30 + 15)} minutes</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollisionPredictions;