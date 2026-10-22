// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated pose)

// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (over-the-shoulder aim)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Render world: training yard, wilderness track, character whiteboxes and raiders, camera and
// feedback tints. Presentation only — no gameplay rules. main.js pushes state and pulse events in.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from './config.js';
import { clamp } from './controls.js';
import { buildTrainingGround, buildWilderness } from './scenery.js';
import { createFighter } from './characters.js';

function blobShadow(size = 1.9) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 7, 64, 64, 62);
  gradient.addColorStop(0, 'rgba(0,0,0,.62)');
  gradient.addColorStop(.6, 'rgba(0,0,0,.24)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size * .68),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .8 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = .043;
  return mesh;
}

export function createWorld(host) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x88948e);
  scene.fog = new THREE.Fog(0x8e9a94, 28, 118);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 180);
  camera.position.set(0, 5.4, 8.5);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
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

  const ground = buildTrainingGround(scene);
  const wilderness = buildWilderness(scene);

  scene.add(new THREE.HemisphereLight(0xb6cac5, 0x3b4033, 1.35));
  const sun = new THREE.DirectionalLight(0xffd0a0, 2.55);
  sun.position.set(-10, 14, 9);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x7899a8, .5);
  fill.position.set(9, 6, -12);
  scene.add(fill);

  const playerFighter = createFighter('ajaye');
  const senseiFighter = createFighter('sensei');
  playerFighter.root.position.set(0, 0, 2.5);
  senseiFighter.root.position.set(0, 0, -2.5);
  scene.add(playerFighter.root, senseiFighter.root);

  const playerShadow = blobShadow(1.75);
  const senseiShadow = blobShadow(2.05);
  scene.add(playerShadow, senseiShadow);

  const enemies = wilderness.enemySpawns.map((spawn, index) => {
    const parts = createFighter('raider', { weapon: spawn.weapon });
    parts.root.position.set(spawn.x, 0, spawn.z);
    parts.root.rotation.y = Math.PI;
    scene.add(parts.root);
    const shadow = blobShadow(1.85);
    scene.add(shadow);
    return {
      ...spawn,
      index,
      root: parts.root,
      parts,
      shadow,
      home: { x: spawn.x, z: spawn.z }
    };
  });
  const enemyPhases = enemies.map(() => 0);
  const previousEnemies = enemies.map(enemy => enemy.root.position.clone());
  let zone = 'training';

  let yaw = 0;
  let yawOffset = 0;
  let pitch = .46;
  let locked = true;
  let settings = { sensitivity: 1, invertY: false };
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastLook = 0;

  // Camera look. While locked, drags become an offset around the lock axis and ease back.
  function look(dx, dy) {
    const factor = CONFIG.lookSensitivity * settings.sensitivity;
    if (locked) yawOffset -= dx * factor;
    else yaw -= dx * factor;
    const invert = settings.invertY ? -1 : 1;
    pitch = clamp(pitch + dy * factor * .6 * invert, -.12, CONFIG.pitchLimit);
    lastLook = performance.now();
  }

  renderer.domElement.addEventListener('pointerdown', event => {
    // Touch: the left side belongs to the joystick; the rest of the screen is the look area.
    if (event.pointerType === 'touch' && event.clientX < innerWidth * .55) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    look(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    renderer.domElement.addEventListener(name, () => { dragging = false; });
  }

  // Short-lived colour flashes on a landed hit, parry or block.
  const flashUntil = { player: 0, sensei: 0 };
  const flashColor = { player: new THREE.Color(), sensei: new THREE.Color() };
  for (const enemy of enemies) {
    flashUntil[enemy.id] = 0;
    flashColor[enemy.id] = new THREE.Color();
  }
  let feedback = {
    senseiWindingUp: false, playerBlocking: false, aiming: false, crouching: false, swing: 0,
    weapon: 'staff', attackMove: null, attackProgress: 0
  };
  let wasWinding = false;
  let senseiFollowThrough = 0;
  const previousPlayer = playerFighter.root.position.clone();
  const previousSensei = senseiFighter.root.position.clone();
  let playerPhase = 0;
  let senseiPhase = 0;
  let playerCrouch = 0;

  return {
    player: playerFighter.root,
    sensei: senseiFighter.root,
    playerParts: playerFighter,
    senseiParts: senseiFighter,
    enemies,
    wilderness,
    camera,
    renderer,

    setLocked(value) { locked = value; },
    setZone(value) { zone = value === 'wilds' ? 'wilds' : 'training'; },

    // Gamepad look and programmatic drags arrive here; touch/mouse drags call it internally.
    look,

    setSettings(next = {}) {
      settings = {
        sensitivity: Number.isFinite(next.sensitivity) ? next.sensitivity : settings.sensitivity,
        invertY: next.invertY === true
      };
    },

    setQuality(name) {
      const ratio = name === 'performance' ? 1
        : name === 'sharp' ? Math.min(devicePixelRatio, 2.5)
          : Math.min(devicePixelRatio, 1.5);
      renderer.setPixelRatio(ratio);
      renderer.setSize(innerWidth, innerHeight);
    },

    // Called once per frame by main.js. Pure presentation: tint, lean, guard and aim zoom.
    setFeedback(next = {}) {
      const winding = next.senseiWindingUp === true;
      if (wasWinding && !winding) senseiFollowThrough = .2;
      wasWinding = winding;
      feedback = {
        senseiWindingUp: winding,
        playerBlocking: next.playerBlocking === true,
        aiming: next.aiming === true,
        crouching: next.crouching === true,
        swing: Number.isFinite(next.swing) ? next.swing : 0,
        weapon: typeof next.weapon === 'string' ? next.weapon : 'staff',
        attackMove: next.attackMove || null,
        attackProgress: Number.isFinite(next.attackProgress) ? next.attackProgress : 0
      };
    },

    pulse(who, color = 0xff6b4a) {
      if (!(who in flashUntil)) return;
      flashUntil[who] = performance.now() + 140;
      flashColor[who].setHex(color);
    },

    render(dt = 1 / 60) {
      const now = performance.now();
      const time = now * .001;
      senseiFollowThrough = Math.max(0, senseiFollowThrough - dt);
      ground.update(now, dt);
      wilderness.update(now, dt);

      const flashP = flashUntil.player > now;
      const flashE = flashUntil.sensei > now;
      playerFighter.setTint(
        flashP ? flashColor.player.getHex() : feedback.playerBlocking ? 0x35d0b8 : 0x000000,
        flashP ? .82 : feedback.playerBlocking ? .28 : 0
      );
      senseiFighter.setTint(
        flashE ? flashColor.sensei.getHex() : feedback.senseiWindingUp ? 0xffb347 : 0x000000,
        flashE ? .82 : feedback.senseiWindingUp ? .42 : 0
      );

      // Idle breathing, articulated gait, crouch and a small lift that keeps the body from
      // sinking through the ground while the gameplay root is rotated for a knockdown.
      playerFighter.setWeapon(feedback.weapon);
      senseiFighter.setWeapon('staff');
      for (const enemy of enemies) enemy.parts.setWeapon(enemy.weapon);

      for (const enemy of enemies) {
        const enemyFlash = flashUntil[enemy.id] > now;
        enemy.parts.setTint(
          enemyFlash ? flashColor[enemy.id].getHex() : 0x000000,
          enemyFlash ? .82 : 0
        );
      }

      const p = playerFighter.root.position;
      const e = senseiFighter.root.position;
      const pDown = Math.min(1, Math.abs(playerFighter.root.rotation.z) / (Math.PI / 2));
      const sDown = Math.min(1, Math.abs(senseiFighter.root.rotation.z) / (Math.PI / 2));
      const pSpeed = Math.hypot(p.x - previousPlayer.x, p.z - previousPlayer.z) / Math.max(dt, .001);
      const eSpeed = Math.hypot(e.x - previousSensei.x, e.z - previousSensei.z) / Math.max(dt, .001);
      playerPhase += pSpeed * dt * 2.45;
      senseiPhase += eSpeed * dt * 2.45;
      playerCrouch += ((feedback.crouching ? 1 : 0) - playerCrouch) * Math.min(1, dt * 10);
      previousPlayer.copy(p);
      previousSensei.copy(e);
      const pWalk = pDown ? 0 : Math.min(1.5, pSpeed / CONFIG.move);
      const eWalk = sDown ? 0 : Math.min(1.5, eSpeed / CONFIG.move);
      const pStep = playerFighter.pose({
        walk: pWalk, phase: playerPhase, crouch: pDown ? 0 : playerCrouch, swing: feedback.swing,
        guard: feedback.playerBlocking, weapon: feedback.weapon,
        attackMove: feedback.attackMove, attackProgress: feedback.attackProgress
      });
      const eStep = senseiFighter.pose({ walk: eWalk, phase: senseiPhase });

      enemies.forEach((enemy, index) => {
        const enemyDown = Math.min(1, Math.abs(enemy.root.rotation.z) / (Math.PI / 2));
        const ep = enemy.root.position;
        const speed = Math.hypot(ep.x - previousEnemies[index].x, ep.z - previousEnemies[index].z) / Math.max(dt, .001);
        enemyPhases[index] += speed * dt * 2.45;
        previousEnemies[index].copy(ep);
        const step = enemy.parts.pose({
          walk: enemyDown ? 0 : Math.min(1.5, speed / CONFIG.move),
          phase: enemyPhases[index], weapon: enemy.weapon
        });
        enemy.parts.visual.position.y = Math.sin(time * 1.5 + index) * .006 + enemyDown * .55 + step;
        enemy.parts.root.rotation.x = 0;
        enemy.shadow.position.set(ep.x, .043, ep.z);
        const lift = Math.max(.55, 1 - Math.max(0, ep.y) * .42);
        enemy.shadow.scale.set(lift, lift, 1);
      });
      playerFighter.visual.position.y = Math.sin(time * 1.7) * .007 + pDown * .55 + pStep;
      senseiFighter.visual.position.y = Math.sin(time * 1.45 + 1.8) * .007 + sDown * .55 + eStep;
      const ease = Math.min(1, dt * 10);
      const pLean = pDown ? 0 : feedback.playerBlocking ? -.06 : -playerCrouch * .16;
      playerFighter.upper.rotation.x += (pLean - playerFighter.upper.rotation.x) * ease;
      playerFighter.upper.rotation.y += (feedback.swing * .16 - playerFighter.upper.rotation.y) * ease;
      senseiFighter.upper.rotation.x += ((feedback.senseiWindingUp ? .1 : 0) - senseiFighter.upper.rotation.x) * ease;

      const weaponNode = feedback.weapon === 'katana' ? playerFighter.katana
        : feedback.weapon === 'staff' ? playerFighter.stick : null;
      if (weaponNode) {
        const weaponX = feedback.playerBlocking ? 0 : Math.PI / 2;
        weaponNode.rotation.x += (weaponX - weaponNode.rotation.x) * Math.min(1, dt * 16);
        weaponNode.rotation.z += (feedback.swing - weaponNode.rotation.z) * Math.min(1, dt * 24);
      }
      const senseiStaffX = feedback.senseiWindingUp ? .82 : Math.PI / 2;
      const senseiStaffZ = feedback.senseiWindingUp ? .5 : senseiFollowThrough > 0 ? -.28 : 0;
      senseiFighter.stick.rotation.x += (senseiStaffX - senseiFighter.stick.rotation.x) * Math.min(1, dt * 11);
      senseiFighter.stick.rotation.z += (senseiStaffZ - senseiFighter.stick.rotation.z) * Math.min(1, dt * 14);

      // Recentre behind the lock axis shortly after the player stops dragging.
      if (locked && now - lastLook > 450) yawOffset *= Math.max(0, 1 - dt * 1.8);

      if (feedback.aiming) {
        // Over-the-shoulder: derive the camera from the player's facing and shoulder, not the
        // fighter midpoint. Horizontal look is a small clamped offset that recentres.
        const aimYaw = playerFighter.root.rotation.y + clamp(yawOffset, -.32, .32);
        const forwardX = Math.sin(aimYaw);
        const forwardZ = Math.cos(aimYaw);
        const rightX = Math.cos(aimYaw);
        const rightZ = -Math.sin(aimYaw);
        const aimPitch = clamp(pitch - .46, -.38, .55);
        const crouchDrop = playerCrouch * .18;
        const aimPosition = new THREE.Vector3(
          p.x - forwardX * CONFIG.aimCameraDistance + rightX * CONFIG.aimShoulderOffset,
          p.y + CONFIG.aimHeight + aimPitch * .65 - crouchDrop,
          p.z - forwardZ * CONFIG.aimCameraDistance + rightZ * CONFIG.aimShoulderOffset
        );
        const aimFocus = new THREE.Vector3(
          p.x + forwardX * 8,
          p.y + CONFIG.aimFocusHeight - aimPitch * 3.1 - crouchDrop * .65,
          p.z + forwardZ * 8
        );
        camera.position.lerp(aimPosition, 1 - Math.exp(-dt * 14));
        camera.lookAt(aimFocus);
      } else {
        const mid = zone === 'wilds' ? p.clone() : p.clone().lerp(e, locked ? 0.5 : 0);
        const lockAngle = zone === 'wilds'
          ? playerFighter.root.rotation.y + Math.PI
          : Math.atan2(p.x - e.x, p.z - e.z);
        const angle = locked ? lockAngle + yawOffset : yaw;
        const distance = zone === 'wilds' ? CONFIG.cameraDistance * .9 : CONFIG.cameraDistance;
        const focus = new THREE.Vector3(mid.x, 1.18, mid.z);
        const target = new THREE.Vector3(
          focus.x + Math.sin(angle) * Math.cos(pitch) * distance,
          focus.y + Math.sin(pitch) * distance,
          focus.z + Math.cos(angle) * Math.cos(pitch) * distance
        );
        camera.position.lerp(target, 1 - Math.exp(-dt * 8));
        camera.lookAt(focus);
      }

      const fov = feedback.aiming ? CONFIG.aimFov : CONFIG.fov;
      if (Math.abs(camera.fov - fov) > .1) {
        camera.fov += (fov - camera.fov) * Math.min(1, dt * 8);
        camera.updateProjectionMatrix();
      }

      playerShadow.position.set(p.x, .043, p.z);
      senseiShadow.position.set(e.x, .043, e.z);
      const pLift = Math.max(.55, 1 - Math.max(0, p.y) * .42);
      const eLift = Math.max(.55, 1 - Math.max(0, e.y) * .42);
      playerShadow.scale.set(pLift, pLift, 1);
      senseiShadow.scale.set(eLift, eLift, 1);

      renderer.render(scene, camera);
    }
  };
}
