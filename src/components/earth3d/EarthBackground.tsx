import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Nebula from './Nebula';
import StarField from './StarField';
import EarthMaterial from './EarthMaterial';

// Hook to detect screen size
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

const EarthMesh: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const glowRef1 = useRef<THREE.Mesh>(null);
  const glowRef2 = useRef<THREE.Mesh>(null);
  const glowRef3 = useRef<THREE.Mesh>(null);
  
  const screenSize = useScreenSize();

  // Cargamos la textura de la Tierra
  const earthTexture = useLoader(THREE.TextureLoader, '/images.jpg');

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
      earthRef.current.rotation.x += 0.0005;
    }
    // Rotación diferente para capas de brillo
    if (glowRef1.current) {
      glowRef1.current.rotation.y += 0.0008;
      glowRef1.current.rotation.x += 0.0003;
    }
    if (glowRef2.current) {
      glowRef2.current.rotation.y += 0.0012;
      glowRef2.current.rotation.x += 0.0007;
    }
    if (glowRef3.current) {
      glowRef3.current.rotation.y += 0.0006;
      glowRef3.current.rotation.x += 0.0004;
    }
  });

  // Responsive positioning and scaling
  const getResponsiveProps = () => {
    if (screenSize.isMobile) {
      return {
        position: [0, 0, 0] as [number, number, number], // Centered for mobile
        scale: [3.5, 3.5, 3.5] as [number, number, number] // Smaller scale
      };
    } else if (screenSize.isTablet) {
      return {
        position: [-3, 0, 0] as [number, number, number], // Slightly left for tablet
        scale: [5, 5, 5] as [number, number, number] // Medium scale
      };
    } else {
      return {
        position: [-6, 0, -1] as [number, number, number], // Original desktop position
        scale: [6.75, 6.75, 6.75] as [number, number, number] // Original desktop scale
      };
    }
  };

  const { position, scale } = getResponsiveProps();

  return (
    <group 
      rotation-z={THREE.MathUtils.degToRad(23.5)}
      position={position}
      scale={scale}
    >
      {/* Mesh principal con textura */}
      <mesh ref={earthRef}>
        <icosahedronGeometry args={[1, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          roughness={0.1}
          metalness={0.3}
          transparent={true}
          opacity={1.0}
          emissive="#2d5a7b"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Capa de brillo 1 - Más brillante */}
      <mesh ref={glowRef1} scale={[1.02, 1.02, 1.02]}>
        <icosahedronGeometry args={[1, 32]} />
        <meshBasicMaterial 
          color="#87CEEB"
          transparent={true}
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Capa de brillo 2 - Intermedio */}
      <mesh ref={glowRef2} scale={[1.05, 1.05, 1.05]}>
        <icosahedronGeometry args={[1, 24]} />
        <meshBasicMaterial 
          color="#98D8C8"
          transparent={true}
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Capa de brillo 3 - Exterior */}
      <mesh ref={glowRef3} scale={[1.08, 1.08, 1.08]}>
        <icosahedronGeometry args={[1, 16]} />
        <meshBasicMaterial 
          color="#B0E0E6"
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Capa de brillo 4 - Atmosférica */}
      <mesh scale={[1.12, 1.12, 1.12]}>
        <icosahedronGeometry args={[1, 12]} />
        <meshBasicMaterial 
          color="#ffffff"
          transparent={true}
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

const EarthBackground: React.FC = () => {
  const screenSize = useScreenSize();

  // Responsive camera and lighting settings
  const getCameraSettings = () => {
    if (screenSize.isMobile) {
      return {
        position: [0, 0, 8] as [number, number, number], // Further back and centered
        fov: 60 // Slightly wider field of view
      };
    } else if (screenSize.isTablet) {
      return {
        position: [1, 0.5, 7] as [number, number, number], // Slightly adjusted
        fov: 70
      };
    } else {
      return {
        position: [2, 1, 6] as [number, number, number], // Original desktop
        fov: 75
      };
    }
  };

  const getOrbitControlsTarget = (): [number, number, number] => {
    if (screenSize.isMobile) {
      return [0, 0, 0]; // Center target for mobile
    } else if (screenSize.isTablet) {
      return [-3, 0, 0]; // Adjusted for tablet
    } else {
      return [-6, 0, -1]; // Original desktop target
    }
  };

  const getLightingSettings = () => {
    if (screenSize.isMobile) {
      return {
        ambientIntensity: 0.6,
        pointLightIntensity: 1.2,
        directionalIntensity: 0.6,
        spotLightIntensity: 0.8
      };
    } else {
      return {
        ambientIntensity: 0.5,
        pointLightIntensity: 1.5,
        directionalIntensity: 0.8,
        spotLightIntensity: 1.2
      };
    }
  };

  const cameraSettings = getCameraSettings();
  const orbitTarget = getOrbitControlsTarget();
  const lighting = getLightingSettings();

  return (
    <div className="fixed inset-0 z-0" style={{ opacity: 0.7 }}>
      <Canvas camera={{ position: cameraSettings.position, fov: cameraSettings.fov }}>
        {/* Responsive lighting */}
        <ambientLight intensity={lighting.ambientIntensity} />
        <pointLight position={[6, 6, 8]} intensity={lighting.pointLightIntensity} color="#ffffff" />
        <directionalLight position={[-8, -6, -4]} intensity={lighting.directionalIntensity} color="#87CEEB" />
        <spotLight
          position={[-10, 4, 6]} 
          angle={0.4} 
          intensity={lighting.spotLightIntensity}
          color="#98D8C8"
          target-position={orbitTarget}
        />
        <pointLight position={[-6, 0, 4]} intensity={0.8} color="#B0E0E6" />

        <EarthMesh />
        <StarField />
        <Nebula />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.3}
          target={orbitTarget} // Use responsive target instead of hardcoded position
        />
      </Canvas>
    </div>
  );
};

export default EarthBackground;