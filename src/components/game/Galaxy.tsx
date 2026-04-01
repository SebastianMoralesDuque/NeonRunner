import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, THEMES } from '../../store/gameStore';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute float aScale;
  attribute vec3 aRandomness;

  varying vec3 vColor;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / max(distanceToCenter, 0.5)) * uTime * 0.15;
    angle += angleOffset;

    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;

    modelPosition.xyz += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = uSize * aScale * (200.0 / -viewPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 80.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    float strength = exp(-dist * dist * 10.0);
    gl_FragColor = vec4(vColor * (1.0 + strength * 2.0), strength * 0.9);
  }
`;

export const Galaxy = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const themeIndex = useGameStore((s) => s.themeIndex);
  const theme = THEMES[themeIndex];

  const { geometry, uniforms, colorBuffer } = useMemo(() => {
    const count = 60000;
    const radius = 60;
    const branches = 5;
    const randomness = 0.25;
    const randomnessPower = 3;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomnessArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 0.5) * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;

      positions[i3] = Math.cos(branchAngle) * r;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = Math.sin(branchAngle) * r;

      randomnessArr[i3] = (Math.random() - 0.5) * randomness * r * 2;
      randomnessArr[i3 + 1] = (Math.random() - 0.5) * randomness * r * 0.5;
      randomnessArr[i3 + 2] = (Math.random() - 0.5) * randomness * r * 2;

      colors[i3] = 1;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1;

      scales[i] = Math.pow(1.0 - r / radius, 1.5) * 0.8 + 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aRandomness', new THREE.BufferAttribute(randomnessArr, 3));

    return {
      geometry: geo,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 35 },
      },
      colorBuffer: colors,
      count,
      radius,
    };
  }, []);

  useEffect(() => {
    const insideColor = new THREE.Color(theme.primary);
    const outsideColor = new THREE.Color(theme.nebula[0]);

    for (let i = 0; i < 60000; i++) {
      const i3 = i * 3;
      const pos = geometry.attributes.position.array as Float32Array;
      const r = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 2] * pos[i3 + 2]);
      const ratio = Math.min(r / 60, 1);

      colorBuffer[i3] = insideColor.r + (outsideColor.r - insideColor.r) * ratio;
      colorBuffer[i3 + 1] = insideColor.g + (outsideColor.g - insideColor.g) * ratio;
      colorBuffer[i3 + 2] = insideColor.b + (outsideColor.b - insideColor.b) * ratio;
    }

    geometry.attributes.color.needsUpdate = true;
  }, [themeIndex, theme.primary, theme.nebula]);

  useFrame((state) => {
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
        state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, 25, -5]} rotation={[Math.PI * 0.15, 0, 0]} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        transparent
        fog={false}
      />
    </points>
  );
};
