import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Nebula: React.FC = () => {
  const nebulaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.x += 0.0001;
      nebulaRef.current.rotation.y += 0.0002;
      nebulaRef.current.rotation.z += 0.0001;
    }
  });

  return (
    <mesh ref={nebulaRef} position={[0, 0, -20]} scale={[50, 50, 50]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#4A90A4"
        transparent={true}
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

export default Nebula;