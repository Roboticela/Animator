import * as THREE from "three";

/**
 * Thin wrapper around THREE.AnimationMixer that the Viewport drives every
 * frame (imperatively, outside React) and the transport UI drives via the
 * zustand `animationStore` actions. Kept out of React state on purpose so
 * per-frame updates never trigger component re-renders.
 */
export class AnimationEngine {
  readonly mixer: THREE.AnimationMixer;
  private action: THREE.AnimationAction | null = null;
  private clip: THREE.AnimationClip | null = null;

  constructor(root: THREE.Object3D) {
    this.mixer = new THREE.AnimationMixer(root);
  }

  get duration() {
    return this.clip?.duration ?? 0;
  }

  get time() {
    return this.action?.time ?? 0;
  }

  setClip(clip: THREE.AnimationClip | null, loop: boolean) {
    if (this.action) {
      this.action.stop();
    }
    if (this.clip) {
      this.mixer.uncacheClip(this.clip);
    }
    this.clip = clip;
    if (!clip) {
      this.action = null;
      return;
    }
    const action = this.mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.play();
    action.paused = true;
    action.time = 0;
    this.mixer.update(0);
    this.action = action;
  }

  setLoop(loop: boolean) {
    if (!this.action) return;
    this.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    this.action.clampWhenFinished = !loop;
  }

  play() {
    if (!this.action) return;
    this.action.paused = false;
  }

  pause() {
    if (!this.action) return;
    this.action.paused = true;
  }

  seek(time: number) {
    if (!this.action) return;
    const clamped = Math.max(0, Math.min(time, this.duration));
    this.action.time = clamped;
    this.action.paused = true;
    this.mixer.update(0);
  }

  setSpeed(speed: number) {
    this.mixer.timeScale = speed;
  }

  /** Advances playback; returns the current playhead time. */
  update(delta: number): number {
    if (this.action && !this.action.paused) {
      this.mixer.update(delta);
    }
    return this.time;
  }

  dispose() {
    this.mixer.stopAllAction();
    if (this.clip) this.mixer.uncacheClip(this.clip);
  }
}
