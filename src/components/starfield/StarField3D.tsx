import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
}

interface StarField3DProps {
  stars: StarData[];
  settings: {
    motionType?: string;
    speed?: number;
    duration?: number;
    fieldOfView?: number;
  };
  isAnimating: boolean;
  isRecording: boolean;
  backgroundImage?: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// Custom shader for circular star points
const starVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Create circular point with soft edges (star-like appearance)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    // Smooth circular falloff
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Add glow effect
    float glow = exp(-dist * 4.0);
    
    gl_FragColor = vec4(vColor * (0.8 + glow * 0.2), alpha);
  }
`;

const StarPoints: React.FC<{ stars: StarData[]; settings: any; isAnimating: boolean }> = ({ 
  stars, 
  settings, 
  isAnimating 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const initialPositions = useRef<Float32Array | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
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

      // Star size based on brightness and original size
      sizes[i] = star.size * (0.5 + star.brightness * 1.5);
    });

    return { positions, colors, sizes };
  }, [stars]);

  // Store initial positions for animation
  useEffect(() => {
    if (!initialPositions.current && positions) {
      initialPositions.current = new Float32Array(positions);
    }
  }, [positions]);

  useFrame((state) => {
    if (!pointsRef.current || !isAnimating || !initialPositions.current) return;

    const { motionType = 'zoom_in', speed = 1 } = settings;
    const positionsAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positionsAttr.count; i++) {
      const initialZ = initialPositions.current[i * 3 + 2];
      const currentZ = positionsAttr.getZ(i);
      
      // Calculate parallax factor based on depth (0 = far, 1 = near)
      const depthFactor = (initialZ + 100) / 200; // Normalize to 0-1
      
      if (motionType === 'zoom_in') {
        // Zoom in - stars get closer
        let newZ = currentZ - speed * 0.8 * depthFactor;
        
        // Reset stars that get too close
        if (newZ < -100) {
          newZ = initialZ + 200;
        }
        
        positionsAttr.setZ(i, newZ);
      } else if (motionType === 'zoom_out') {
        // Zoom out - stars get farther
        let newZ = currentZ + speed * 0.8 * depthFactor;
        
        // Reset stars that get too far
        if (newZ > 100) {
          newZ = initialZ - 200;
        }
        
        positionsAttr.setZ(i, newZ);
      } else if (motionType === 'pan_left') {
        // Pan left - closer stars move faster (parallax)
        const initialX = initialPositions.current[i * 3];
        let newX = positionsAttr.getX(i) - speed * 0.5 * depthFactor;
        
        // Wrap around
        if (newX < initialX - 150) {
          newX = initialX + 150;
        }
        
        positionsAttr.setX(i, newX);
      } else if (motionType === 'pan_right') {
        // Pan right - closer stars move faster (parallax)
        const initialX = initialPositions.current[i * 3];
        let newX = positionsAttr.getX(i) + speed * 0.5 * depthFactor;
        
        // Wrap around
        if (newX > initialX + 150) {
          newX = initialX - 150;
        }
        
        positionsAttr.setX(i, newX);
      }
    }
    
    positionsAttr.needsUpdate = true;
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
          attach="attributes-customColor"
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
      <shaderMaterial
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const BackgroundPlane: React.FC<{ 
  backgroundImage: string; 
  settings: any; 
  isAnimating: boolean 
}> = ({ backgroundImage, settings, isAnimating }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const offsetRef = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(backgroundImage, (texture) => {
      textureRef.current = texture;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
  }, [backgroundImage]);

  useFrame(() => {
    if (!meshRef.current || !isAnimating || !textureRef.current) return;

    const { motionType = 'zoom_in', speed = 1 } = settings;
    const material = meshRef.current.material as THREE.MeshBasicMaterial;

    if (motionType === 'zoom_in') {
      offsetRef.current.scale += speed * 0.001;
      if (offsetRef.current.scale > 1.5) offsetRef.current.scale = 1;
    } else if (motionType === 'zoom_out') {
      offsetRef.current.scale -= speed * 0.001;
      if (offsetRef.current.scale < 0.5) offsetRef.current.scale = 1;
    } else if (motionType === 'pan_left') {
      offsetRef.current.x -= speed * 0.002;
      if (offsetRef.current.x < -0.3) offsetRef.current.x = 0;
    } else if (motionType === 'pan_right') {
      offsetRef.current.x += speed * 0.002;
      if (offsetRef.current.x > 0.3) offsetRef.current.x = 0;
    }

    // Apply transformations to texture
    if (textureRef.current) {
      textureRef.current.offset.set(offsetRef.current.x, offsetRef.current.y);
      textureRef.current.repeat.set(offsetRef.current.scale, offsetRef.current.scale);
      textureRef.current.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -150]}>
      <planeGeometry args={[300, 300]} />
      <meshBasicMaterial 
        map={textureRef.current}
        transparent={true}
        opacity={0.7}
        depthWrite={false}
      />
    </mesh>
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
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas && onCanvasReady) {
        onCanvasReady(canvas);
      }
    }, 500);
    
    return () => clearTimeout(timer);
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
    <div className="w-full h-full relative bg-black rounded-b-lg overflow-hidden">
      <Canvas 
        camera={{ position: [0, 0, 50], fov: settings.fieldOfView || 75 }}
        gl={{ 
          preserveDrawingBuffer: true, 
          antialias: true,
          alpha: false
        }}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Background nebula layer */}
        {backgroundImage && (
          <BackgroundPlane 
            backgroundImage={backgroundImage} 
            settings={settings} 
            isAnimating={isAnimating}
          />
        )}
        
        {/* 3D Star field with exact star preservation */}
        <StarPoints stars={stars} settings={settings} isAnimating={isAnimating} />
        
        <CameraController fov={settings.fieldOfView || 75} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          enableRotate={!isAnimating}
          autoRotate={false}
        />
      </Canvas>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-300 text-sm font-medium">Recording</span>
        </div>
      )}
      
      {/* Animation indicator */}
      {isAnimating && !isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-300 text-sm font-medium">Animating</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;
