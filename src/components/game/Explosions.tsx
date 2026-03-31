import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  decay: number;
}

interface Explosion {
  particles: Particle[];
}

const sceneExplosions: Explosion[] = [];
let globalScene: THREE.Scene | null = null;
const tmpColor = new THREE.Color();

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function triggerExplosionAt(x: number, y: number, z: number, color?: string) {
  if (!globalScene) return;
  const c = new THREE.Color(color ?? '#ff8800');
  const group: Particle[] = [];

  for (let i = 0; i < 18; i++) {
    const size = randRange(0.06, 0.18);
    const isFlat = Math.random() > 0.5;
    const geo = isFlat
      ? new THREE.BoxGeometry(size * 3, size * 0.4, size * 0.4)
      : new THREE.OctahedronGeometry(size, 0);

    const mat = new THREE.MeshBasicMaterial({
      color: tmpColor.copy(c).offsetHSL(randRange(-0.08, 0.08), 0, randRange(-0.15, 0.15)),
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    globalScene.add(mesh);

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const spd = randRange(4, 12);
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * spd,
      randRange(2, 7),
      Math.sin(phi) * Math.sin(theta) * spd
    );

    group.push({ mesh, vel, life: 1, decay: randRange(1.2, 2.2) });
  }

  sceneExplosions.push({ particles: group });
}

export const ExplosionSystem = () => {
  useFrame(({ scene }, delta) => {
    if (!globalScene) globalScene = scene;

    const dt = Math.min(delta, 0.1);

    for (let i = sceneExplosions.length - 1; i >= 0; i--) {
      const exp = sceneExplosions[i];
      let allDead = true;

      for (const p of exp.particles) {
        if (p.life <= 0) continue;
        allDead = false;

        p.life -= p.decay * dt;
        p.mesh.position.x += p.vel.x * dt;
        p.mesh.position.y += p.vel.y * dt;
        p.mesh.position.z += p.vel.z * dt;
        p.vel.y -= 12 * dt;

        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
        p.mesh.scale.setScalar(Math.max(0.01, p.life));

        if (p.life <= 0) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
        }
      }

      if (allDead) {
        sceneExplosions.splice(i, 1);
      }
    }
  });

  return null;
};
