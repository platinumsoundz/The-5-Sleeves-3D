// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Render world: procedural arena, placeholder fighters, drag-orbit camera and feedback tints.
// Presentation only — no gameplay rules. main.js pushes feedback state and pulse events in.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createWorld(host) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9eb6b2);
  scene.fog = new THREE.Fog(0x9eb6b2, 24, 65);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  host.prepend(renderer.domElement);

  const loading = document.querySelector('#loading');
  if (loading) loading.hidden = true;

  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  window.addEventListener('resize', resize);

  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    if (loading) {
      loading.hidden = false;
      loading.textContent = 'Graphics context lost — reload to continue.';
    }
  });

  scene.add(new THREE.HemisphereLight(0xe6f1ec, 0x465344, 2));
  const sun = new THREE.DirectionalLight(0xffe3b1, 2);
  sun.position.set(-5, 10, 7);
  scene.add(sun);

  const mat = color => new THREE.MeshStandardMaterial({ color });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat(0x71846c));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, .08, 48), mat(0xb79e70));
  ring.position.y = .05;
  scene.add(ring);

  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const x = Math.cos(angle) * 9;
    const z = Math.sin(angle) * 9;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 2.2, 6), mat(0x594534));
    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), mat(0x587657));
    trunk.position.set(x, 1.1, z);
    canopy.position.set(x, 2.6, z);
    scene.add(trunk, canopy);
  }

  function fighter(color, staff = false) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.38, .85, 4, 8), mat(color));
    body.position.y = 1.1;
    root.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 8), mat(0xe0b794));
    head.position.y = 1.85;
    root.add(head);
    let stick;
    if (staff) {
      stick = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 2.2, 8), mat(0x7b5030));
      stick.rotation.x = Math.PI / 2;
      stick.position.set(.45, 1.2, .4);
      root.add(stick);
    }
    scene.add(root);
    return { root, body, stick };
  }

  const playerFighter = fighter(0x385f70, true);
  const senseiFighter = fighter(0x985b45);
  playerFighter.root.position.set(0, 0, 2.5);
  senseiFighter.root.position.set(0, 0, -2.5);

  let yaw = 0;
  let locked = true;
  let dragging = false;
  let lastX = 0;
  renderer.domElement.addEventListener('pointerdown', event => {
    dragging = true;
    lastX = event.clientX;
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    yaw -= (event.clientX - lastX) * .006;
    lastX = event.clientX;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    renderer.domElement.addEventListener(name, () => { dragging = false; });
  }

  // Short-lived colour flashes on a landed hit, parry or block.
  const flashUntil = { player: 0, sensei: 0 };
  const flashColor = { player: new THREE.Color(), sensei: new THREE.Color() };

  return {
    player: playerFighter.root,
    sensei: senseiFighter.root,
    playerParts: playerFighter,
    senseiParts: senseiFighter,
    camera,
    renderer,

    setLocked(value) { locked = value; },

    // Called once per frame by main.js. Pure presentation: tint and lean only.
    setFeedback({ senseiWindingUp = false, playerBlocking = false } = {}) {
      senseiFighter.body.material.emissive.setHex(senseiWindingUp ? 0xffb347 : 0x000000);
      senseiFighter.body.material.emissiveIntensity = senseiWindingUp ? .45 : 0;
      senseiFighter.root.rotation.x = senseiWindingUp ? .14 : 0;

      playerFighter.body.material.emissive.setHex(playerBlocking ? 0x35d0b8 : 0x000000);
      playerFighter.body.material.emissiveIntensity = playerBlocking ? .3 : 0;
      playerFighter.stick.rotation.x = playerBlocking ? 0 : Math.PI / 2;
    },

    pulse(who, color = 0xff6b4a) {
      if (!(who in flashUntil)) return;
      flashUntil[who] = performance.now() + 140;
      flashColor[who].setHex(color);
    },

    render(dt = 1 / 60) {
      const now = performance.now();
      if (flashUntil.player > now) {
        playerFighter.body.material.emissive.copy(flashColor.player);
        playerFighter.body.material.emissiveIntensity = .85;
      }
      if (flashUntil.sensei > now) {
        senseiFighter.body.material.emissive.copy(flashColor.sensei);
        senseiFighter.body.material.emissiveIntensity = .85;
      }

      const p = playerFighter.root.position;
      const e = senseiFighter.root.position;
      const mid = p.clone().lerp(e, locked ? 0.5 : 0);
      const angle = locked ? Math.atan2(p.x - e.x, p.z - e.z) : yaw;
      const target = new THREE.Vector3(mid.x + Math.sin(angle) * 10, 6, mid.z + Math.cos(angle) * 10);
      camera.position.lerp(target, 1 - Math.exp(-dt * 8));
      camera.lookAt(mid.x, 1, mid.z);
      renderer.render(scene, camera);
    }
  };
}
