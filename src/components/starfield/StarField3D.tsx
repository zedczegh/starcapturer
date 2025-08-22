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
  color: string;
}

interface StarField3DProps {
  stars: StarData[];
  settings: {
    speed: number;
    direction: string;
    movement: string;
    duration: number;
    depth: number;
    starCount: number;
    brightness: number;
    fieldOfView: number;
  };
  isAnimating: boolean;
  isRecording: boolean;
}

const StarPoints: React.FC<{ stars: StarData[]; settings: any; isAnimating: boolean }> = ({ 
  stars, 
  settings, 
  isAnimating 
}) => {
  const meshRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    stars.forEach((star, i) => {
      positions[i * 3] = star.x;
      positions[i * 3 + 1] = star.y;
      positions[i * 3 + 2] = star.z;

      // Convert HSL color to RGB
      const color = new THREE.Color(star.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = star.size * settings.brightness;
    });

    return [positions, colors, sizes];
  }, [stars, settings.brightness]);

  useFrame((state) => {
    if (!meshRef.current || !isAnimating) return;

    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    stars.forEach((star, i) => {
      const baseIndex = i * 3;
      
      switch (settings.movement) {
        case 'zoom':
          // Move stars toward camera for zoom effect
          const direction = settings.direction === 'forward' ? 1 : -1;
          positions[baseIndex + 2] = star.z - (time * settings.speed * 10 * direction) % settings.depth;
          
          // Reset star position when it goes too far
          if (positions[baseIndex + 2] < -50) {
            positions[baseIndex + 2] = settings.depth;
          } else if (positions[baseIndex + 2] > settings.depth) {
            positions[baseIndex + 2] = -50;
          }
          break;
          
        case 'orbit':
          // Rotate stars around center
          const angle = time * settings.speed * 0.1;
          const radius = Math.sqrt(star.x * star.x + star.y * star.y);
          const originalAngle = Math.atan2(star.y, star.x);
          positions[baseIndex] = Math.cos(originalAngle + angle) * radius;
          positions[baseIndex + 1] = Math.sin(originalAngle + angle) * radius;
          break;
          
        case 'drift':
          // Slow drift movement
          positions[baseIndex] = star.x + Math.sin(time * settings.speed * 0.1 + i) * 2;
          positions[baseIndex + 1] = star.y + Math.cos(time * settings.speed * 0.1 + i) * 2;
          break;
          
        default:
          break;
      }
    });

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
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
        size={2}
        sizeAttenuation={true}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const CameraController: React.FC<{ settings: any }> = ({ settings }) => {
  const { camera } = useThree();

  useEffect(() => {
    if ('fov' in camera) {
      camera.fov = settings.fieldOfView;
      camera.updateProjectionMatrix();
    }
  }, [camera, settings.fieldOfView]);

  return null;
};

const StarField3D: React.FC<StarField3DProps> = ({ stars, settings, isAnimating, isRecording }) => {
  if (stars.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cosmic-950 to-cosmic-900 rounded-b-lg">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
            <Stars className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-cosmic-400">Upload an image and detect stars to see the 3D preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 50], fov: settings.fieldOfView }}
        style={{ background: 'radial-gradient(ellipse at center, #0f0f23 0%, #000 100%)' }}
      >
        <CameraController settings={settings} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        
        {/* Background stars */}
        <ThreeStars 
          radius={300} 
          depth={50} 
          count={2000} 
          factor={4} 
          saturation={0} 
          fade={true}
          speed={0.5}
        />
        
        {/* Detected stars */}
        <StarPoints stars={stars} settings={settings} isAnimating={isAnimating} />
        
        {/* Ambient light */}
        <ambientLight intensity={0.1} />
      </Canvas>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-2 rounded-full">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording</span>
        </div>
      )}
      
      {/* Animation status */}
      {isAnimating && !isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-600/90 text-white px-3 py-2 rounded-full">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Playing</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;