import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Nebula from './Nebula';
import StarField from './StarField';
import EarthMaterial from './EarthMaterial';

const EarthMesh: React.FC = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const glowRef1 = useRef<THREE.Mesh>(null);
  const glowRef2 = useRef<THREE.Mesh>(null);
  const glowRef3 = useRef<THREE.Mesh>(null);
  
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

  return (
    <group 
      rotation-z={THREE.MathUtils.degToRad(23.5)}
      position={[-6, 0, -1]} // Más hacia la izquierda
      scale={[6.75, 6.75, 6.75]} // MUCHO MÁS GRANDE (6.75x)
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
  return (
    <div className="fixed inset-0 z-0" style={{ opacity: 0.7 }}>
      <Canvas camera={{ position: [2, 1, 6], fov: 75 }}>
        {/* Luces optimizadas para la nueva posición */}
        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 8]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-8, -6, -4]} intensity={0.8} color="#87CEEB" />
        <spotLight 
          position={[-10, 4, 6]} 
          angle={0.4} 
          intensity={1.2} 
          color="#98D8C8"
          target-position={[-6, 0, -1]}
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
          target={[-6, 0, -1]} // Enfocar en la nueva posición de la Tierra
        />
      </Canvas>
    </div>
  );
};

export default EarthBackground;