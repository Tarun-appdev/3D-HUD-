import * as THREE from './vendor/three.module.js';
import { createTerrainRenderer } from './terrain-renderer.js';

const EYE_HEIGHT = 1.7;

export async function startHudTerrain() {
  const app = await createTerrainRenderer();

  const canvas = app.renderer.domElement;

  canvas.id = 'mars-terrain-layer';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';

  document.body.prepend(canvas);

  const camera = app.camera;
  const renderer = app.renderer;

  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const back = new THREE.Vector3();

  const orientation = new THREE.Matrix4();
  const terrainHeight = app.heightAt;

  function update(position, basis, eyeShift = 0) {
    const groundHeight = terrainHeight(position.x, position.y);

    if (groundHeight === null) {
      return false;
    }

    // Convert the HUD's east/north/up basis into
    // Three.js east/up/south coordinates.
    right.set(
      basis.r[0],
      basis.r[2],
      -basis.r[1]
    ).normalize();

    up.set(
      basis.u[0],
      basis.u[2],
      -basis.u[1]
    ).normalize();

    back.set(
      -basis.f[0],
      -basis.f[2],
      basis.f[1]
    ).normalize();

    orientation.makeBasis(right, up, back);

    camera.position.set(
      position.x - basis.r[0] * eyeShift,
      groundHeight + EYE_HEIGHT - basis.r[2] * eyeShift,
      -position.y + basis.r[1] * eyeShift
    );

    camera.quaternion.setFromRotationMatrix(orientation);
    camera.updateMatrixWorld();

    return true;
  }

  function render(position, basis, eyeShift = 0) {
    if (!update(position, basis, eyeShift)) return;
    renderer.render(app.scene, camera);
  }

  function resize(width, height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  return {
    render,
    resize,
    heightAt: terrainHeight,
    meta: app.meta,
    dispose() {
      canvas.remove();
      app.dispose();
    }
  };
}
