import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars as ThreeStars } from '@react-three/drei';
import { Stars } from 'lucide-react';
import * as THREE from 'three';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
  layer?: string;
}

interface StarField3DProps {
  stars: StarData[];
  settings: {
    motionType?: string;
    speed?: number;
    duration?: number;
    fieldOfView?: number;
    depthMultiplier?: number;
  };
  isAnimating: boolean;
  isRecording: boolean;
  backgroundImage?: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const StarPoints: React.FC<{ stars: StarData[]; settings: any; isAnimating: boolean }> = ({ 
  stars, 
  settings, 
  isAnimating 
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    stars.forEach((star, i) => {
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;

      const color = new THREE.Color(star.color3d);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Enhanced star sizing for better visibility
      const distanceScale = Math.max(0.5, 1.5 - (Math.abs(star.z) / 100));
      const brightnessScale = Math.pow(star.brightness, 0.5); // Less aggressive brightness scaling
      const sizeScale = Math.max(1.5, Math.min(6, star.size)); // Larger base sizes
      
      sizes[i] = sizeScale * distanceScale * brightnessScale * 3; // Increased multiplier
    });

    return [positions, colors, sizes];
  }, [stars]);

  useFrame((state) => {
    if (!pointsRef.current || !isAnimating) return;

    const { motionType = 'zoom_in', speed = 1 } = settings;
    const positions = pointsRef.current.geometry.attributes.position;
    
    // Apply motion based on type
    if (motionType === 'zoom_in') {
      // Fly forward - stars get closer
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        let newZ = z - speed * 0.5;
        
        // Reset stars that pass by
        if (newZ < -50) newZ = 100;
        
        positions.setZ(i, newZ);
      }
    } else if (motionType === 'zoom_out') {
      // Fly backward - stars get farther
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        let newZ = z + speed * 0.5;
        
        // Reset stars that go too far
        if (newZ > 100) newZ = -50;
        
        positions.setZ(i, newZ);
      }
    } else if (motionType === 'pan_left') {
      // Pan left - move camera right, stars left
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const depthFactor = (100 - z) / 100;
        
        let newX = x - speed * 0.3 * depthFactor;
        
        // Wrap around
        if (newX < -100) newX = 100;
        
        positions.setX(i, newX);
      }
    } else if (motionType === 'pan_right') {
      // Pan right - move camera left, stars right
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const depthFactor = (100 - z) / 100;
        
        let newX = x + speed * 0.3 * depthFactor;
        
        // Wrap around
        if (newX > 100) newX = -100;
        
        positions.setX(i, newX);
      }
    }
    
    positions.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={stars.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={stars.length}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={stars.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={5}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={1.0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={true}
      />
    </points>
  );
};

const CameraController: React.FC<{ fov: number }> = ({ fov }) => {
  const { camera } = useThree();

  useEffect(() => {
    if ('fov' in camera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  return null;
};

const StarField3D: React.FC<StarField3DProps> = ({ 
  stars, 
  settings, 
  isAnimating,
  isRecording,
  backgroundImage,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Find the canvas element created by React Three Fiber
    const canvas = document.querySelector('canvas');
    if (canvas && onCanvasReady) {
      canvasRef.current = canvas;
      onCanvasReady(canvas);
    }
  }, [onCanvasReady]);

  if (stars.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cosmic-950 rounded-b-lg">
        <p className="text-cosmic-400">
          Upload both images and process to generate 3D star field
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-cosmic-950 rounded-b-lg overflow-hidden">
      {/* Background layer (starless nebula) */}
      {backgroundImage && (
        <div className="absolute inset-0 overflow-hidden z-0">
          <img 
            src={backgroundImage} 
            alt="Background nebula"
            className="w-full h-full object-cover"
            style={{ 
              mixBlendMode: 'screen',
              filter: 'brightness(0.8) contrast(1.2)'
            }}
          />
        </div>
      )}

      {/* 3D Star layer */}
      <div className="absolute inset-0 z-10">
        <Canvas 
          camera={{ position: [0, 0, 50], fov: settings.fieldOfView || 75 }}
          gl={{ preserveDrawingBuffer: true, alpha: true }}
        >
          <color attach="background" args={['#000000']} />
          
          {/* Camera controls */}
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            enableRotate={!isAnimating}
            autoRotate={false}
          />
          
          {/* Main star field - stars preserved exactly as they are */}
          <StarPoints stars={stars} settings={settings} isAnimating={isAnimating} />
          
          <CameraController fov={settings.fieldOfView || 75} />
        </Canvas>
      </div>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-300 text-sm font-medium">Recording</span>
        </div>
      )}
      
      {/* Animation indicator */}
      {isAnimating && !isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-300 text-sm font-medium">Animating</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;