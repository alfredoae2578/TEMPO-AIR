import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const StarField: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  
  // Generar posiciones aleatorias para las estrellas
  const positions = React.useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.0002;
      ref.current.rotation.y += 0.0002;
    }
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        color="#ffffff"
        size={0.02}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </Points>
  );
};

export default StarField;