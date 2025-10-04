import React from 'react';
import * as THREE from 'three';

interface EarthMaterialProps {
  map?: THREE.Texture;
}

const EarthMaterial: React.FC<EarthMaterialProps> = ({ map }) => {
  return (
    <>
      {/* Material principal con textura */}
      <meshStandardMaterial 
        map={map}
        roughness={0.3}
        metalness={0.2}
        transparent={true}
        opacity={0.9}
        emissive="#1a3a52"
        emissiveIntensity={0.1}
      />
      {/* Material adicional para brillo */}
      <meshBasicMaterial 
        color="#87CEEB"
        transparent={true}
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </>
  );
};

export default EarthMaterial;