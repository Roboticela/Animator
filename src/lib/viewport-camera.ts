import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function frameBoxOnCamera(box: THREE.Box3, camera: THREE.Camera, controls: OrbitControlsImpl | null, padding = 1.6) {
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.05) * padding;

  if (camera instanceof THREE.PerspectiveCamera) {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = maxDim / (2 * Math.tan(fov / 2));
    const dir = new THREE.Vector3(0.55, 0.45, 0.75).normalize();
    camera.position.copy(center).add(dir.multiplyScalar(distance));
    camera.near = Math.max(distance / 200, 0.01);
    camera.far = distance * 30;
    camera.updateProjectionMatrix();
  } else if (camera instanceof THREE.OrthographicCamera) {
    const aspect = (camera.right - camera.left) / Math.max(camera.top - camera.bottom, 0.001);
    const frustum = maxDim;
    camera.left = (-frustum * aspect) / 2;
    camera.right = (frustum * aspect) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.position.set(center.x + maxDim * 0.55, center.y + maxDim * 0.45, center.z + maxDim * 0.75);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }

  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
}
