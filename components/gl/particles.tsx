"use client";

import * as THREE from "three";
import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal, useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";

import { DofPointsMaterial } from "./shaders/pointMaterial";
import { SimulationMaterial } from "./shaders/simulationMaterial";

type ParticlesProps = {
  speed?: number;
  aperture?: number;
  focus?: number;
  size?: number;
  noiseScale?: number;
  noiseIntensity?: number;
  timeScale?: number;
  pointSize?: number;
  opacity?: number;
  planeScale?: number;
  tint?: string;
};

export function Particles({
  speed = 1.0,
  aperture = 1.79,
  focus = 3.8,
  size = 512,
  noiseScale = 0.6,
  noiseIntensity = 0.52,
  timeScale = 1,
  pointSize = 10.0,
  opacity = 0.8,
  planeScale = 10.0,
  tint = "#E8E3D6",
}: ParticlesProps) {
  const revealStartTime = useRef<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(true);
  const revealDuration = 3.5;

  const simulationMaterial = useMemo(
    () => new SimulationMaterial(planeScale),
    [planeScale],
  );

  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  const dofPointsMaterial = useMemo(() => {
    const m = new DofPointsMaterial();
    m.uniforms.positions.value = target.texture;
    m.uniforms.initialPositions.value =
      simulationMaterial.uniforms.positions.value;
    m.uniforms.uTint.value = new THREE.Color(tint);
    return m;
  }, [simulationMaterial, target, tint]);

  // Update tint on resolved-theme change without recreating the material
  useEffect(() => {
    dofPointsMaterial.uniforms.uTint.value = new THREE.Color(tint);
  }, [tint, dofPointsMaterial]);

  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1),
  );
  const [positions] = useState(
    () =>
      new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
      ]),
  );
  const [uvs] = useState(
    () => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]),
  );

  const particles = useMemo(() => {
    const length = size * size;
    const data = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      data[i3 + 0] = (i % size) / size;
      data[i3 + 1] = i / size / size;
    }
    return data;
  }, [size]);

  useFrame((state) => {
    if (!dofPointsMaterial || !simulationMaterial) return;

    state.gl.setRenderTarget(target);
    state.gl.clear();
    state.gl.render(scene, camera);
    state.gl.setRenderTarget(null);

    const t = state.clock.elapsedTime;
    if (revealStartTime.current === null) revealStartTime.current = t;
    const elapsed = t - revealStartTime.current;
    const progress = Math.min(elapsed / revealDuration, 1.0);
    const eased = 1 - Math.pow(1 - progress, 3);
    const factor = eased * 4.0;

    if (progress >= 1.0 && isRevealing) setIsRevealing(false);

    dofPointsMaterial.uniforms.uTime.value = t;
    dofPointsMaterial.uniforms.uFocus.value = focus;
    dofPointsMaterial.uniforms.uBlur.value = aperture;
    dofPointsMaterial.uniforms.uPointSize.value = pointSize;
    dofPointsMaterial.uniforms.uOpacity.value = opacity;
    dofPointsMaterial.uniforms.uRevealFactor.value = factor;
    dofPointsMaterial.uniforms.uRevealProgress.value = eased;

    simulationMaterial.uniforms.uTime.value = t;
    simulationMaterial.uniforms.uNoiseScale.value = noiseScale;
    simulationMaterial.uniforms.uNoiseIntensity.value = noiseIntensity;
    simulationMaterial.uniforms.uTimeScale.value = timeScale * speed;
  });

  return (
    <>
      {createPortal(
        <mesh material={simulationMaterial}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
            <bufferAttribute attach="attributes-uv" args={[uvs, 2]} />
          </bufferGeometry>
        </mesh>,
        scene,
      )}
      <points material={dofPointsMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
      </points>
    </>
  );
}
