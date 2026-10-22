// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost)
// Procedural settlement training yard plus the wilderness track and enemy-outpost silhouette.
// Everything is built from low-poly primitives, shared materials and canvas textures so the
// scene stays cheap on a phone. Presentation plus simple collider data: story triggers and
// gameplay state still live outside this module.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from './config.js';
import { circleCollider, boxCollider } from './collision.js';

const C = {
  ground: 0x6d735f,
  earth: 0x8d795e,
  path: 0x827157,
  chalk: 0xa8946d,
  hill: 0x5d6b64,
  skyTop: 0x5a6b73,
  skyMid: 0x899690,
  skyHorizon: 0xcbb08c,
  wood: 0x6f563d,
  woodDark: 0x4b392b,
  woodPale: 0x8b7658,
  metal: 0x66706e,
  metalDark: 0x475150,
  leather: 0x4a392c,
  rust: 0x8b533b,
  rustDark: 0x6f4131,
  olive: 0x5e644b,
  oliveDark: 0x474d3e,
  khaki: 0x9b8b6e,
  canvas: 0xa38d6b,
  canvasRust: 0x966148,
  charcoal: 0x303735,
  window: 0x5a4632,
  lamp: 0xffb570,
  tree: 0x566552,
  treeDark: 0x3f5044,
  cyan: 0x63c1bc
};

const materialCache = new Map();

function mat(color, options = {}) {
  const key = `${color}|${options.roughness ?? .9}|${options.metalness ?? 0}|${options.flatShading ?? true}|${options.emissive ?? 0}|${options.emissiveIntensity ?? 0}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({
      color,
      roughness: .9,
      metalness: 0,
      flatShading: true,
      ...options
    }));
  }
  return materialCache.get(key);
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const node = new THREE.Mesh(geometry, material);
  node.position.set(x, y, z);
  return node;
}

function box(parent, w, h, d, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const node = mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
  node.rotation.set(rx, ry, rz);
  parent.add(node);
  return node;
}

function cylinder(parent, top, bottom, height, segments, material, x = 0, y = 0, z = 0) {
  const node = mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
  parent.add(node);
  return node;
}

function sphere(parent, radius, material, x = 0, y = 0, z = 0, detail = 7) {
  const node = mesh(new THREE.SphereGeometry(radius, detail, Math.max(5, detail - 1)), material, x, y, z);
  parent.add(node);
  return node;
}

function group(parent, x = 0, y = 0, z = 0, ry = 0) {
  const node = new THREE.Group();
  node.position.set(x, y, z);
  node.rotation.y = ry;
  parent.add(node);
  return node;
}

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function canvasTexture(draw, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function groundTexture() {
  return canvasTexture((ctx, size) => {
    const random = rng(20361022);
    ctx.fillStyle = '#6d735f';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 180; i++) {
      const x = random() * size;
      const y = random() * size;
      const r = 4 + random() * 22;
      ctx.fillStyle = random() > .55 ? 'rgba(54,63,51,.10)' : 'rgba(154,137,104,.08)';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * .45, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 1500; i++) {
      const tone = random();
      ctx.fillStyle = tone > .72 ? 'rgba(190,174,137,.11)'
        : tone > .4 ? 'rgba(56,65,52,.12)' : 'rgba(112,101,76,.13)';
      const r = .4 + random() * 1.5;
      ctx.fillRect(random() * size, random() * size, r, r);
    }
    ctx.strokeStyle = 'rgba(52,59,48,.13)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = random() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * .3, y + random() * 10 - 5, size * .7, y + random() * 10 - 5, size, y);
      ctx.stroke();
    }
  });
}

function addSky(scene) {
  const texture = canvasTexture((ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#55666f');
    gradient.addColorStop(.42, '#7f8e8a');
    gradient.addColorStop(.69, '#b6aa90');
    gradient.addColorStop(1, '#d0af87');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }, 128);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 24, 14),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false })
  );
  sky.renderOrder = -20;
  scene.add(sky);
}

function addHills(scene) {
  const random = rng(717);
  const hillMatA = mat(C.hill, { flatShading: true });
  const hillMatB = mat(0x53615b, { flatShading: true });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + random() * .25;
    const radius = 31 + random() * 14;
    const hill = mesh(new THREE.DodecahedronGeometry(1, 0), i % 2 ? hillMatA : hillMatB);
    hill.position.set(Math.sin(angle) * radius, -.3 + random() * 1.2, Math.cos(angle) * radius);
    hill.scale.set(7 + random() * 7, 2.5 + random() * 3.5, 5 + random() * 6);
    hill.rotation.y = random() * Math.PI;
    scene.add(hill);
  }
}

function addGround(scene) {
  const texture = groundTexture();
  // The ground and sky must cover the wilderness route past the enemy outpost at z -63,
  // not just the original training-yard footprint.
  texture.repeat.set(27, 27);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const ringTexture = texture.clone();
  ringTexture.repeat.set(2.4, 2.4);
  ringTexture.needsUpdate = true;
  const ring = new THREE.Mesh(
    new THREE.CircleGeometry(6.15, 64),
    new THREE.MeshStandardMaterial({ map: ringTexture, color: 0xb49a74, roughness: 1 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .018;
  scene.add(ring);

  const boundary = new THREE.Mesh(
    new THREE.RingGeometry(5.78, 5.94, 64),
    new THREE.MeshStandardMaterial({ color: C.chalk, roughness: 1, transparent: true, opacity: .72 })
  );
  boundary.rotation.x = -Math.PI / 2;
  boundary.position.y = .03;
  scene.add(boundary);

  const pathMat = mat(C.path, { flatShading: false });
  box(scene, 2.7, .025, 7.2, pathMat, 0, .012, -8.4);
  box(scene, 6.4, .022, 1.8, pathMat, -4.2, .011, -5.2, 0, .24, 0);
  box(scene, 5.6, .022, 1.6, pathMat, 4.3, .011, -4.4, 0, -.18, 0);

  const random = rng(1888);
  for (let i = 0; i < 16; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 7 + random() * 13;
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(.55 + random() * 1.8, 12),
      mat(random() > .5 ? 0x656b56 : 0x7b6f57, { flatShading: false })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(Math.sin(angle) * radius, .014, Math.cos(angle) * radius);
    scene.add(patch);
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + .2;
    const x = Math.sin(angle) * 6.45;
    const z = Math.cos(angle) * 6.45;
    const post = cylinder(scene, .055, .07, .42, 5, mat(C.woodDark), x, .21, z);
    post.rotation.z = (random() - .5) * .12;
    box(scene, .12, .16, .03, mat(i % 2 ? C.rust : C.olive), x, .36, z, 0, angle, (random() - .5) * .3);
  }
}

function fenceRun(scene, ax, az, bx, bz, height = 1.35) {
  const dx = bx - ax;
  const dz = bz - az;
  const length = Math.hypot(dx, dz);
  const fence = group(scene, (ax + bx) / 2, 0, (az + bz) / 2, Math.atan2(dx, dz));
  const count = Math.max(1, Math.round(length / 2.4));
  const segment = length / count;
  const panelColors = [C.wood, C.rust, C.metal, C.olive, C.woodPale];

  for (let i = 0; i <= count; i++) {
    const z = -length / 2 + i * segment;
    const post = cylinder(fence, .07, .09, height, 5, mat(C.woodDark), 0, height / 2, z);
    post.rotation.z = (i % 3 - 1) * .018;
    if (i === count) break;

    box(fence, .06, .075, segment - .06, mat(C.woodDark), 0, height * .64, z + segment / 2);
    box(fence, .055, .065, segment - .06, mat(C.woodDark), 0, height * .94, z + segment / 2);
    const offset = i % 2 ? .04 : 0;
    box(fence, .055, height * .61, segment * .47, mat(panelColors[i % panelColors.length]),
      offset, height * .46, z + segment * .25);
    box(fence, .05, height * .52, segment * .41, mat(panelColors[(i + 1) % panelColors.length]),
      -offset, height * .44, z + segment * .74);
    const brace = box(fence, .045, .055, segment * .88, mat(C.woodDark), 0, height * .55, z + segment / 2);
    brace.rotation.x = i % 2 ? .27 : -.27;
  }
  return fence;
}

function addGate(scene) {
  const gate = group(scene, 0, 0, -11.4);
  for (const side of [-1, 1]) {
    box(gate, .5, .18, .55, mat(C.earth), side * 2.62, .09, 0);
    cylinder(gate, .15, .19, 2.45, 6, mat(C.woodDark), side * 2.55, 1.24, 0);
  }
  box(gate, 5.65, .2, .3, mat(C.woodDark), 0, 2.42, 0);
  const roof = box(gate, 6.05, .09, .95, mat(C.metalDark), 0, 2.68, 0, -.08, 0, 0);
  roof.rotation.x = -.12;
  for (let i = -2; i <= 2; i++) {
    box(gate, .05, .025, .95, mat(C.metal), i, 2.74, 0, -.12, 0, 0);
  }

  for (const side of [-1, 1]) {
    const hinge = group(gate, side * 2.38, 0, .08, side * 1.18);
    box(hinge, 2.05, 1.12, .07, mat(C.wood), side * 1.04, .7, 0);
    box(hinge, .07, 1.12, .09, mat(C.woodDark), side * .08, .7, 0);
    const brace = box(hinge, 2.0, .06, .09, mat(C.woodDark), side * 1.04, .7, 0);
    brace.rotation.z = side * .34;
    box(hinge, .12, .12, .12, mat(C.metal), side * 2.02, .35, 0);
    box(hinge, .12, .12, .12, mat(C.metal), side * 2.02, 1.05, 0);
  }

  const lampPost = cylinder(gate, .035, .035, .5, 5, mat(C.metalDark), -2.55, 2.15, .15);
  lampPost.rotation.z = .08;
  cylinder(gate, .1, .17, .16, 6, mat(C.metal), -2.55, 1.86, .23);
  const bulb = sphere(gate, .06, mat(0xffc27d, { emissive: C.lamp, emissiveIntensity: 2, flatShading: false }), -2.55, 1.82, .24, 6);
  bulb.scale.y = .8;
}

function addWorkshop(scene) {
  const shop = group(scene, -8.7, 0, -5.3, .34);
  box(shop, 4.1, .08, 3.25, mat(C.earth), 0, .04, 0);
  box(shop, 3.8, 2.2, .09, mat(C.woodDark), 0, 1.15, -1.55);
  box(shop, .09, 2.2, 3.1, mat(C.woodDark), -1.9, 1.15, 0);
  box(shop, .09, 2.2, 3.1, mat(C.woodDark), 1.9, 1.15, 0);
  cylinder(shop, .1, .13, 2.2, 6, mat(C.woodDark), -1.78, 1.1, 1.5);
  cylinder(shop, .1, .13, 2.15, 6, mat(C.woodDark), 1.78, 1.08, 1.5);

  const roof = box(shop, 4.35, .1, 3.65, mat(C.metalDark), 0, 2.3, 0);
  roof.rotation.x = .055;
  for (let i = -2; i <= 2; i++) {
    const rib = box(shop, .055, .035, 3.6, mat(C.metal), i * .82, 2.38, 0);
    rib.rotation.x = .055;
  }
  box(shop, 1.35, .05, 1.0, mat(C.rust), 1.25, 2.39, .5, .055, 0, 0);

  box(shop, 2.15, .11, .72, mat(C.wood), 0, .84, .78);
  for (const x of [-.88, .88]) {
    for (const z of [.55, 1.0]) cylinder(shop, .05, .06, .78, 5, mat(C.woodDark), x, .41, z);
  }
  box(shop, 1.9, .08, .5, mat(C.wood), 0, .42, .8);
  box(shop, 1.3, .55, .055, mat(C.woodDark), 0, 1.35, -1.47);
  box(shop, .04, .3, .04, mat(C.metalDark), -.35, 1.23, -1.4);
  box(shop, .16, .06, .06, mat(C.metal), -.35, 1.4, -1.4);
  box(shop, .035, .3, .04, mat(C.metal), 0, 1.28, -1.4);
  box(shop, .035, .22, .035, mat(C.metal), .32, 1.22, -1.4);
  box(shop, .28, .15, .025, mat(C.metal), .32, 1.36, -1.4);
  box(shop, .08, .18, .035, mat(C.leather), .7, 1.27, -1.4);

  const cord = cylinder(shop, .012, .012, .45, 5, mat(C.metalDark), .2, 2.0, .45);
  cord.rotation.z = .1;
  cylinder(shop, .11, .18, .15, 6, mat(C.metal), .17, 1.76, .45);
  sphere(shop, .055, mat(0xffc17a, { emissive: C.lamp, emissiveIntensity: 2.2, flatShading: false }), .17, 1.7, .45, 6);
  const lamp = new THREE.PointLight(0xffb375, 9, 7, 2);
  lamp.position.set(0, 1.55, .75);
  shop.add(lamp);

  crate(scene, -7.4, -3.4, .62, .25);
  crate(scene, -6.8, -3.9, .45, -.2);
  barrel(scene, -6.5, -2.4, .78);
  return lamp;
}

function addHouse(scene, smoke) {
  const house = group(scene, 9.4, 0, -6.6, -.3);
  box(house, 3.9, .09, 3.9, mat(C.earth), 0, .045, 0);
  box(house, 3.6, 2.35, .09, mat(C.woodPale), 0, 1.22, -1.75);
  box(house, .09, 2.35, 3.35, mat(C.woodPale), -1.75, 1.22, 0);
  box(house, .09, 2.35, 3.35, mat(C.woodPale), 1.75, 1.22, 0);
  box(house, 1.22, 2.35, .09, mat(C.woodPale), -1.18, 1.22, 1.72);
  box(house, 1.22, 2.35, .09, mat(C.woodPale), 1.18, 1.22, 1.72);
  box(house, 3.6, .38, .09, mat(C.woodPale), 0, 2.16, 1.72);
  box(house, .78, 1.8, .07, mat(C.woodDark), 0, .9, 1.78);
  box(house, .12, .12, .08, mat(C.metal), .3, .92, 1.83);

  const roof = box(house, 4.1, .12, 3.95, mat(C.metalDark), 0, 2.55, 0);
  roof.rotation.z = .025;
  box(house, 1.45, .025, 1.15, mat(C.rust), .8, 2.63, .55, 0, .05, 0);
  box(house, .9, .025, .65, mat(C.metal), -1.15, 2.62, -.5, 0, -.08, 0);

  for (const side of [-1, 1]) {
    const windowFrame = box(house, .62, .55, .05, mat(C.woodDark), side * 1.23, 1.5, 1.79);
    box(house, .5, .43, .025, mat(C.window, { emissive: 0xd08a48, emissiveIntensity: 1.4, flatShading: false }), side * 1.23, 1.5, 1.825);
    box(house, .025, .43, .035, mat(C.woodDark), side * 1.23, 1.5, 1.84);
    box(house, .5, .025, .035, mat(C.woodDark), side * 1.23, 1.5, 1.84);
  }

  cylinder(house, .12, .12, 1.2, 6, mat(C.metalDark), 1.18, 3.0, -.82);
  cylinder(house, .18, .16, .08, 6, mat(C.metal), 1.18, 3.64, -.82);
  for (let i = 0; i < 4; i++) {
    const puff = sphere(house, .13, new THREE.MeshBasicMaterial({
      color: 0xc8c1ae, transparent: true, opacity: .14, depthWrite: false
    }), 1.18, 3.72, -.82, 6);
    puff.userData.noBatch = true;
    smoke.push({
      node: puff,
      baseX: 1.18,
      baseY: 3.72,
      baseZ: -.82,
      age: i * .24,
      phase: i * 1.7
    });
  }

  for (const side of [-1, 1]) cylinder(house, .075, .09, 2.15, 5, mat(C.woodDark), side * 1.65, 1.07, 2.15);
  box(house, 3.8, .07, 1.05, mat(C.canvasRust), 0, 2.32, 2.38, .04, 0, 0);
  box(house, 1.12, .11, .42, mat(C.woodPale), 0, .06, 2.08);
  box(house, 1.35, .16, .55, mat(C.wood), 0, .62, 2.25);
  box(house, .08, .11, .08, mat(C.metalDark), -.58, 1.15, 2.62);
  box(house, .08, .11, .08, mat(C.metalDark), .58, 1.15, 2.62);
}

function addAwning(scene) {
  const stall = group(scene, -8.4, 0, 5.0, -.2);
  for (const x of [-1.55, 1.55]) {
    for (const z of [-1.0, 1.0]) cylinder(stall, .075, .09, 2.2, 5, mat(C.woodDark), x, 1.1, z);
  }
  const canopy = box(stall, 3.55, .06, 2.55, mat(C.canvas), 0, 2.15, 0);
  canopy.rotation.x = -.035;
  for (let i = -1; i <= 1; i++) {
    box(stall, 1.0, .22, .035, mat(i % 2 ? C.canvasRust : C.khaki), i * 1.18, 1.97, 1.28);
  }
  box(stall, 2.0, .1, .75, mat(C.wood), 0, .82, .32);
  for (const x of [-.85, .85]) {
    for (const z of [0, .62]) cylinder(stall, .045, .055, .78, 5, mat(C.woodDark), x, .41, z);
  }
  box(stall, .65, .18, .42, mat(C.woodDark), -.55, .95, .3);
  box(stall, .62, .18, .4, mat(C.woodPale), .55, .95, .3);
  for (const [x, z] of [[-.55, .32], [.55, .32]]) {
    cylinder(stall, .1, .13, .09, 8, mat(C.khaki), x, 1.08, z);
  }
  crate(scene, -9.2, 6.5, .55, .4);
  crate(scene, -7.3, 6.25, .42, -.25);
  sack(scene, -7.8, 4.1, .9);
}

function addWater(scene) {
  const water = group(scene, 7.4, 0, 4.7);
  box(water, 1.4, .08, 1.4, mat(C.earth), 0, .04, 0);
  cylinder(water, .5, .46, 1.05, 10, mat(C.wood), 0, .56, 0);
  for (const y of [.22, .78]) {
    const band = mesh(new THREE.TorusGeometry(.505, .022, 4, 12), mat(C.metalDark), 0, y, 0);
    band.rotation.x = Math.PI / 2;
    water.add(band);
  }
  cylinder(water, .52, .52, .055, 10, mat(C.woodDark), 0, 1.1, 0);
  cylinder(water, .11, .11, .82, 6, mat(C.metal), .02, 1.36, 0);
  const handle = box(water, .72, .055, .055, mat(C.woodDark), .26, 1.55, 0);
  handle.rotation.z = -.24;
  box(water, .055, .055, .33, mat(C.metalDark), -.38, 1.2, 0);
  const spout = cylinder(water, .042, .042, .48, 6, mat(C.metal), .08, 1.08, .25);
  spout.rotation.x = Math.PI / 2;
  cylinder(water, .16, .12, .22, 8, mat(C.woodDark), .08, .12, .48);
}

function addSolar(scene) {
  const array = group(scene, -10.4, 0, 1.2, .18);
  for (const x of [-.82, .82]) {
    for (const z of [-.72, .72]) cylinder(array, .035, .045, .8, 5, mat(C.metalDark), x, .4, z);
    const panel = box(array, 1.5, .055, 2.0, mat(0x35434a, { metalness: .28, roughness: .48, flatShading: false }), x, .88, 0);
    panel.rotation.x = -.3;
    for (let i = -1; i <= 1; i++) {
      const line = box(array, .018, .012, 2.0, mat(0x768785, { flatShading: false }), x + i * .38, .92, 0);
      line.rotation.x = -.3;
    }
  }
  box(array, .86, .95, .56, mat(C.metalDark), 0, .48, 1.35);
  box(array, .66, .06, .025, mat(C.metal), 0, .75, 1.64);
  box(array, .66, .06, .025, mat(C.metal), 0, .55, 1.64);
  sphere(array, .045, mat(0xffbc75, { emissive: C.lamp, emissiveIntensity: 2, flatShading: false }), .28, .88, 1.64, 6);
  const conduit = cylinder(array, .045, .045, 2.5, 5, mat(C.metalDark), -.3, .45, 2.6);
  conduit.rotation.x = Math.PI / 2;
}

function addFan(scene, fans) {
  const stand = group(scene, 5.8, 0, -3.4);
  cylinder(stand, .09, .13, 1.35, 5, mat(C.metalDark), 0, .67, 0);
  box(stand, .42, .08, .42, mat(C.metalDark), 0, .04, 0);

  const housing = group(stand, 0, 1.45, 0);
  const shell = cylinder(housing, .52, .52, .2, 12, mat(C.metal), 0, 0, 0);
  shell.rotation.x = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(.5, .055, 5, 16), mat(C.metalDark), 0, 0, .11);
  housing.add(rim);
  const blades = group(housing, 0, 0, .045);
  for (let i = 0; i < 3; i++) {
    const blade = box(blades, .34, .09, .025, mat(C.metalDark), 0, .21, 0);
    blade.rotation.z = (i / 3) * Math.PI * 2;
    blade.position.set(Math.sin((i / 3) * Math.PI * 2) * .2, Math.cos((i / 3) * Math.PI * 2) * .2, 0);
    blade.rotation.z += .35;
  }
  blades.traverse(node => { node.userData.noBatch = true; });
  fans.push(blades);
  box(stand, .3, .28, .08, mat(C.rust), 0, 1.13, .12);
}

function addLaundry(scene, cloths) {
  const line = group(scene, 8.2, 0, 3.4, Math.atan2(4.2, -.15));
  for (const z of [-2.2, 2.2]) cylinder(line, .06, .075, 1.8, 5, mat(C.woodDark), 0, .9, z);
  const rope = cylinder(line, .012, .012, 4.35, 4, mat(C.khaki), 0, 1.64, 0);
  rope.rotation.x = Math.PI / 2;
  const colors = [C.canvas, C.olive, C.canvasRust];
  for (let i = 0; i < 3; i++) {
    const pivot = group(line, 0, 1.64, -1.3 + i * 1.3);
    const cloth = box(pivot, .62, .62, .025, mat(colors[i]), 0, -.32, 0);
    cloth.userData.base = .02;
    cloth.userData.phase = i * 1.8;
    cloth.userData.noBatch = true;
    cloths.push(cloth);
  }
}

function crate(scene, x, z, size = .55, rotation = 0) {
  const boxGroup = group(scene, x, 0, z, rotation);
  box(boxGroup, size, size * .8, size, mat(C.wood), 0, size * .4, 0);
  box(boxGroup, size * 1.02, .045, .045, mat(C.woodDark), 0, size * .22, size * .5);
  box(boxGroup, size * 1.02, .045, .045, mat(C.woodDark), 0, size * .58, size * .5);
  box(boxGroup, .045, size * .8, .045, mat(C.woodDark), size * .5, size * .4, 0);
  return boxGroup;
}

function barrel(scene, x, z, scale = 1) {
  const barrelGroup = group(scene, x, 0, z);
  cylinder(barrelGroup, .42 * scale, .38 * scale, .95 * scale, 10, mat(C.wood), 0, .48 * scale, 0);
  for (const y of [.22, .72]) {
    const band = mesh(new THREE.TorusGeometry(.405 * scale, .018 * scale, 4, 12), mat(C.metalDark), 0, y * scale, 0);
    band.rotation.x = Math.PI / 2;
    barrelGroup.add(band);
  }
  cylinder(barrelGroup, .43 * scale, .43 * scale, .045, 10, mat(C.woodDark), 0, .96 * scale, 0);
  return barrelGroup;
}

function sack(scene, x, z, scale = 1) {
  const bag = group(scene, x, 0, z);
  const body = sphere(bag, .3 * scale, mat(C.khaki), 0, .32 * scale, 0, 7);
  body.scale.set(1, 1.18, .8);
  sphere(bag, .1 * scale, mat(C.woodDark), 0, .63 * scale, 0, 6);
  return bag;
}

function addStaffRack(scene) {
  const rack = group(scene, -6.0, 0, -3.0);
  for (const x of [-.8, .8]) cylinder(rack, .06, .075, 1.25, 5, mat(C.woodDark), x, .62, 0);
  box(rack, 1.75, .09, .09, mat(C.wood), 0, 1.12, 0);
  for (let i = 0; i < 3; i++) {
    const staff = cylinder(rack, .032, .032, 2.1, 5, mat(C.wood), -.55 + i * .55, 1.03, .28);
    staff.rotation.z = .12 + i * .03;
    staff.rotation.x = .08;
  }
}

function addTrees(scene, colliders) {
  const random = rng(5521);
  const positions = [
    [-14.5, -10.5, 1.15], [14.8, -9.6, 1.05], [-16.8, 4.8, .92],
    [16.2, 4.0, 1.18], [-11.8, 12.4, .82], [12.8, 11.6, .96],
    [1.8, -19.5, 1.35], [-20.2, -2.2, 1.25], [19.5, -2.8, 1.1]
  ];
  for (const [x, z, scale] of positions) {
    const tree = group(scene, x, 0, z, random() * Math.PI);
    cylinder(tree, .1 * scale, .17 * scale, 1.5 * scale, 5, mat(C.woodDark), 0, .75 * scale, 0);
    const canopyA = sphere(tree, .88 * scale, mat(C.tree), 0, 1.7 * scale, 0, 7);
    canopyA.scale.set(1.15, .9, 1);
    sphere(tree, .62 * scale, mat(C.treeDark), -.42 * scale, 1.95 * scale, .12 * scale, 7);
    sphere(tree, .57 * scale, mat(C.tree), .45 * scale, 1.82 * scale, -.1 * scale, 7);
    colliders.push(circleCollider(x, z, .3 * scale));
  }
  for (let i = 0; i < 10; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 8 + random() * 8;
    const size = .32 + random() * .3;
    const bush = mesh(new THREE.IcosahedronGeometry(size, 0), mat(C.oliveDark), Math.sin(angle) * radius, .2, Math.cos(angle) * radius);
    bush.scale.y = .7;
    scene.add(bush);
    colliders.push(circleCollider(bush.position.x, bush.position.z, size * .72));
  }
}

function addDistantStructure(scene, colliders) {
  const relay = group(scene, -18.5, 0, -21);
  for (const x of [-1.4, 1.4]) {
    for (const z of [-1.4, 1.4]) cylinder(relay, .12, .18, 7.2, 5, mat(C.metalDark), x, 3.6, z);
  }
  for (const y of [2.3, 4.6]) {
    box(relay, 3.2, .1, .1, mat(C.metalDark), 0, y, -1.4);
    box(relay, .1, .1, 3.2, mat(C.metalDark), -1.4, y, 0);
  }
  cylinder(relay, 2.15, 2.15, 2.5, 12, mat(C.metal), 0, 8.1, 0);
  cylinder(relay, 2.25, 2.25, .16, 12, mat(C.metalDark), 0, 9.4, 0);
  cylinder(relay, .2, 2.2, 1.4, 12, mat(C.metalDark), 0, 10.15, 0);
  for (let i = 0; i < 8; i++) {
    box(relay, .08, .08, 2.6, mat(C.metalDark), 0, 3 + i * .55, 1.55);
  }
  colliders.push(boxCollider(-18.5, -21, 1.75, 1.75));

  const mast = group(scene, 19, 0, -18);
  cylinder(mast, .09, .16, 10.5, 5, mat(C.metalDark), 0, 5.25, 0);
  for (const y of [5.8, 7.3, 8.7]) box(mast, 2.2, .06, .06, mat(C.metalDark), 0, y, 0);
  box(mast, .06, .06, 1.4, mat(C.metalDark), 0, 9.5, 0);
  cylinder(mast, .035, .035, .5, 5, mat(C.metal), 0, 10.5, 0);
  colliders.push(circleCollider(19, -18, .28));

  const random = rng(8842);
  for (let i = 0; i < 7; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 24 + random() * 11;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const rotation = random() * Math.PI;
    const width = 3 + random() * 2;
    const depth = 3 + random() * 2;
    const house = group(scene, x, 0, z, rotation);
    box(house, width, 2 + random() * 1.3, depth, mat(i % 2 ? C.woodPale : C.oliveDark), 0, 1.2, 0);
    const roof = box(house, 3.6, .18, 3.6, mat(C.metalDark), 0, 2.55, 0);
    roof.rotation.z = (random() - .5) * .1;
    colliders.push(boxCollider(x, z, width / 2, depth / 2, rotation));
  }
}

// The First Tower: ancient, monumental and purposeful, with an open lower doorway and a
// walkable control chamber. Five channels ring a central dais. Nothing here decides the exact
// activation effect or gives Cipher a voice; the geometry is the documented space only.
function addFirstTower(scene, colliders) {
  const cx = CONFIG.towerX;
  const cz = CONFIG.towerZ;
  const outer = CONFIG.towerRadius;
  const inner = CONFIG.towerInteriorRadius;
  const height = CONFIG.towerHeight;
  const tower = group(scene, cx, 0, cz);
  const stone = mat(0x4a4f4a, { flatShading: true });
  const stoneDark = mat(0x343936, { flatShading: true });
  const floorMat = mat(0x3f4441, { flatShading: false });
  const seam = mat(0x8ff4ec, { emissive: 0x2fa7a5, emissiveIntensity: 1.8, flatShading: false });
  const seamDark = mat(0x2f6f6c, { emissive: 0x1b4a48, emissiveIntensity: .9, flatShading: false });

  const wallRing = (radius, segments, wallHeight, wallY, material, depth = 1.1) => {
    const arc = Math.PI * 2 / segments;
    const width = 2 * radius * Math.sin(arc / 2) * 1.07;
    for (let i = 0; i < segments; i++) {
      if (i === 0) continue; // open doorway faces south (+Z), toward the wilderness road
      const angle = i * arc;
      const px = Math.sin(angle) * radius;
      const pz = Math.cos(angle) * radius;
      const panel = group(tower, px, 0, pz, angle);
      box(panel, width, wallHeight, depth, material, 0, wallY, 0);
      colliders.push(boxCollider(cx + px, cz + pz, width / 2, depth / 2, angle));
    }
  };

  wallRing(outer, 16, height, height / 2, stone, 1.2);
  wallRing(inner, 12, 16, 8, stoneDark, .9);

  // Buttresses and ring bands give the tower weight without expensive geometry.
  for (let i = 0; i < 8; i++) {
    if (i === 0) continue;
    const angle = i * Math.PI / 4 + Math.PI / 8;
    const px = Math.sin(angle) * (outer + 1.1);
    const pz = Math.cos(angle) * (outer + 1.1);
    const buttress = group(tower, px, 0, pz, angle);
    box(buttress, 1.5, height * .78, 2.3, stoneDark, 0, height * .39, 0);
    box(buttress, 1.9, .5, 2.7, stone, 0, height * .78, 0);
    colliders.push(boxCollider(cx + px, cz + pz, .85, 1.25, angle));
  }
  for (const y of [10, 20, 30, height - 3]) {
    cylinder(tower, outer + .35, outer + .35, .55, 16, stoneDark, 0, y, 0);
  }
  cylinder(tower, outer + .8, outer - .3, 1.6, 16, stone, 0, height + .6, 0);
  cylinder(tower, 1.1, 2.4, 5.6, 8, stoneDark, 0, height + 3.6, 0);
  cylinder(tower, .22, .5, 3.2, 8, seam, 0, height + 7.6, 0);

  // Floors: an exterior apron, the interior chamber floor and a raised control dais.
  const apron = mesh(new THREE.CircleGeometry(outer + 1.2, 32), floorMat, cx, .022, cz);
  apron.rotation.x = -Math.PI / 2;
  scene.add(apron);
  const chamberFloor = mesh(new THREE.CircleGeometry(inner + .6, 32), floorMat, cx, .038, cz);
  chamberFloor.rotation.x = -Math.PI / 2;
  scene.add(chamberFloor);
  cylinder(tower, 2.5, 2.8, .42, 24, stoneDark, 0, .21, 0);

  // Five channels: quiet pylons around the dais, each with a dim cyan band.
  const channelR = 6.1;
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5 + Math.PI / 5;
    const px = Math.sin(angle) * channelR;
    const pz = Math.cos(angle) * channelR;
    const channel = group(tower, px, 0, pz, angle);
    cylinder(channel, .46, .62, 7.1, 6, stoneDark, 0, 3.55, 0);
    cylinder(channel, .52, .52, .3, 6, seam, 0, 1.35, 0);
    cylinder(channel, .5, .5, .22, 6, seam, 0, 5.1, 0);
    cylinder(channel, .58, .46, 1.0, 6, stone, 0, 7.6, 0);
    for (let rib = 0; rib < 4; rib++) {
      const ribAngle = rib * Math.PI / 2 + Math.PI / 4;
      box(channel, .09, 6.3, .09, stone, Math.sin(ribAngle) * .48, 3.4, Math.cos(ribAngle) * .48);
    }
    colliders.push(circleCollider(cx + px, cz + pz, .78));
  }

  // Overhead ring and radial floor grooves point at the dais without implying a finished effect.
  for (const y of [8.4, 15.5]) {
    const ring = mesh(new THREE.RingGeometry(inner - 1.3, inner - .55, 32), seamDark, cx, y, cz);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
  }
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5 + Math.PI / 5;
    const groove = box(tower, .12, .05, channelR - 2.4, seamDark, Math.sin(angle) * (channelR - 2.4) / 2, .06, Math.cos(angle) * (channelR - 2.4) / 2, 0, angle, 0);
    groove.userData.noBatch = true;
  }

  // The control console sits at the south side of the dais, matching Game.nearTowerConsole().
  const consoleNode = group(tower, 0, 0, 2.2);
  cylinder(consoleNode, .52, .62, 1.0, 10, stoneDark, 0, .5, 0);
  box(consoleNode, 1.05, .16, .62, stone, 0, 1.05, 0);
  box(consoleNode, .72, .42, .07, seam, 0, 1.32, -.24, -.34, 0, 0);
  colliders.push(circleCollider(cx, cz + 2.2, .72));

  // A cold local light makes the interior readable without lighting the whole wilderness.
  const light = new THREE.PointLight(0x7de8df, 2.2, 28, 2);
  light.position.set(cx, 6.2, cz);
  scene.add(light);

  return { x: cx, z: cz, radius: outer, interiorRadius: inner, console: { x: cx, z: cz + 2.2 } };
}

function addWilderness(scene) {
  const random = rng(77421);
  const colliders = [];
  const pathMat = mat(C.path, { flatShading: false });
  const earthMat = mat(C.earth, { flatShading: false });

  // Worn track running from the training gate past the enemy outpost to the First Tower door.
  for (let z = -12.2; z > -80; z -= 3.2) {
    const width = 2.6 + random() * 1.2;
    const segment = box(scene, width, .018, 3.5, pathMat, Math.sin(z * .07) * 1.15, .014, z, 0, random() * .08 - .04, 0);
    segment.rotation.y += (random() - .5) * .06;
  }

  // Open scrub and disturbed earth around the route.
  for (let i = 0; i < 28; i++) {
    const x = (random() - .5) * 56;
    const z = -16 - random() * 46;
    if (Math.abs(x) < 5 && z > -20) continue;
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(.5 + random() * 2.6, 10),
      mat(random() > .5 ? 0x666c57 : 0x7d7058, { flatShading: false })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, .013, z);
    patch.scale.y = .55 + random() * .5;
    scene.add(patch);
  }

  // Broken boundary posts and rocks frame the open area without blocking the path.
  for (let i = 0; i < 18; i++) {
    const side = i % 2 ? -1 : 1;
    const z = -17 - i * 2.8;
    const x = side * (7.5 + random() * 15);
    const post = cylinder(scene, .04, .07, .55 + random() * .8, 5, mat(C.woodDark), x, .28, z);
    post.rotation.z = (random() - .5) * .35;
    colliders.push(circleCollider(x, z, .12));
  }
  for (let i = 0; i < 22; i++) {
    const x = (random() - .5) * 54;
    const z = -18 - random() * 43;
    const base = .35 + random() * 1.4;
    const rock = mesh(new THREE.DodecahedronGeometry(base, 0), mat(random() > .4 ? 0x5e645b : 0x77705f));
    rock.position.set(x, -.02, z);
    const sx = 1 + random();
    const sy = .55 + random() * .45;
    const sz = .8 + random() * .8;
    rock.scale.set(sx, sy, sz);
    rock.rotation.set(random(), random() * Math.PI, random());
    scene.add(rock);
    colliders.push(circleCollider(x, z, Math.max(.22, base * Math.max(sx, sz) * .62)));
  }

  // Sparse dead trees keep sightlines open.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? -1 : 1;
    const x = side * (9 + random() * 18);
    const z = -17 - random() * 44;
    const tree = group(scene, x, 0, z, random() * Math.PI);
    cylinder(tree, .08, .14, 1.9 + random() * 1.4, 5, mat(C.woodDark), 0, .95, 0);
    for (let b = 0; b < 3; b++) {
      const branch = box(tree, .05, .75, .05, mat(C.woodDark), (random() - .5) * .9, 1.5 + random() * .7, (random() - .5) * .5);
      branch.rotation.z = (random() - .5) * 1.1;
    }
    colliders.push(circleCollider(x, z, .24));
  }

  // Enemy outpost silhouette: a practical scavenger-held relay/guard structure, not a story
  // tower. The geometry stays as the wilderness landmark and end-of-slice marker.
  const outpost = group(scene, 0, 0, -63);
  for (const x of [-2.2, 2.2]) {
    for (const z of [-2.2, 2.2]) cylinder(outpost, .18, .28, 11.5, 6, mat(C.metalDark), x, 5.75, z);
  }
  for (const y of [3.4, 6.7, 9.8]) {
    box(outpost, 5.1, .12, .12, mat(C.metalDark), 0, y, -2.2);
    box(outpost, .12, .12, 5.1, mat(C.metalDark), -2.2, y, 0);
    box(outpost, 5.1, .12, .12, mat(C.metalDark), 0, y, 2.2);
  }
  box(outpost, 6.8, .18, 6.8, mat(C.metal), 0, 11.35, 0);
  box(outpost, 5.6, .85, 5.6, mat(C.oliveDark), 0, 11.9, 0);
  const beaconMat = mat(0x6de6dd, { emissive: 0x2fa7a5, emissiveIntensity: 2.2, flatShading: false });
  cylinder(outpost, .55, .72, 1.0, 8, mat(C.metalDark), 0, 12.8, 0);
  const beacon = sphere(outpost, .22, beaconMat, 0, 13.45, 0, 7);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    box(outpost, .1, 1.8, .1, mat(C.metalDark), Math.sin(angle) * 2.8, 12.05, Math.cos(angle) * 2.8);
  }
  box(outpost, 1.2, 2.5, .1, mat(C.metalDark), 0, 1.25, -2.25);
  box(outpost, .7, 1.1, .05, mat(C.window), 0, 1.8, -2.31);

  // Scavenger banner and barricade marks read as an occupied outpost rather than a clean tower.
  box(outpost, 1.7, 1.0, .035, mat(C.canvasRust), 0, 6.0, 2.25);
  box(outpost, 1.9, .07, .06, mat(C.metalDark), 0, 6.55, 2.23);
  for (const side of [-1, 1]) {
    box(scene, .12, .9, 1.6, mat(C.woodDark), side * 4.7, .45, -60.6, 0, side * .22, 0);
    colliders.push(boxCollider(side * 4.7, -60.6, .12, .8, side * .22));
  }
  colliders.push(boxCollider(0, -63, 3.35, 3.35));

  // A visible end-of-slice marker and a small supply cache at the outpost.
  box(scene, 4.2, .02, 3.8, earthMat, 0, .012, -59.2);
  crate(scene, -2.6, -59.8, .55, .2);
  crate(scene, 2.3, -59.2, .45, -.3);
  barrel(scene, 2.9, -60.2, .8);
  colliders.push(
    circleCollider(-2.6, -59.8, .35),
    circleCollider(2.3, -59.2, .3),
    circleCollider(2.9, -60.2, .36)
  );

  // The first tower sits beyond the outpost. Its doorway faces south so the road leads straight in.
  const tower = addFirstTower(scene, colliders);
  box(scene, 7.6, .02, 5.4, earthMat, 0, .013, -78.2);

  return {
    colliders,
    outpost: { x: 0, z: -63 },
    tower,
    enemySpawns: [
      {
        id: 'raider-1', x: -5.5, z: -22.5, weapon: 'staff', name: 'RAIDER · SCAVENGER',
        level: 2, maxHp: 45, loot: 'scout-boots', cash: 25, xp: 60,
        abilities: ['STAFF SWEEP', 'GUARD', 'PARRY', 'DODGE'],
        weaknesses: ['Slow to turn after a missed sweep.', 'Guard breaks after repeated blocks.']
      },
      {
        id: 'raider-2', x: 6.5, z: -33, weapon: 'katana', name: 'RAIDER · BLADE',
        level: 3, maxHp: 48, loot: 'field-katana', cash: 30, xp: 70,
        abilities: ['QUICK SLASH', 'GUARD', 'PARRY', 'DODGE'],
        weaknesses: ['Light armour and a short recovery after the slash.']
      },
      {
        id: 'raider-3', x: -8.5, z: -45, weapon: 'staff', name: 'RAIDER · LOOKOUT',
        level: 3, maxHp: 48, loot: 'filter-coat', cash: 30, xp: 70,
        abilities: ['STAFF SWEEP', 'GUARD', 'PARRY', 'DODGE'],
        weaknesses: ['Keeps watch on the road, poor at close guard pressure.']
      },
      {
        id: 'raider-4', x: 5.5, z: -55, weapon: 'katana', name: 'RAIDER · GATEKEEPER',
        level: 4, maxHp: 54, loot: 'reinforced-staff', cash: 40, xp: 85,
        abilities: ['HEAVY SLASH', 'GUARD', 'PARRY', 'DODGE'],
        weaknesses: ['Heavy guard, slower feet.', 'Punish after the second blocked hit.']
      }
    ],
    update(now) {
      beacon.scale.setScalar(1 + Math.sin(now * .003) * .12);
    }
  };
}

function addDust(scene) {
  const random = rng(991);
  const positions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 3 + random() * 20;
    positions[i * 3] = Math.sin(angle) * radius;
    positions[i * 3 + 1] = .15 + random() * 3.8;
    positions[i * 3 + 2] = Math.cos(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xd6c9b1, size: .035, transparent: true, opacity: .32, depthWrite: false
  }));
  scene.add(dust);
  return dust;
}

// Combine static primitives that share a material into one mesh. This keeps the settlement
// readable without hundreds of draw calls; animated props (fan blades, cloth, smoke) are excluded.
function mergeNonIndexed(geometries) {
  const merged = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const attributes = geometries.map(geometry => geometry.getAttribute(name));
    if (attributes.some(attribute => !attribute)) continue;
    const itemSize = attributes[0].itemSize;
    const array = new Float32Array(attributes.reduce((sum, attribute) => sum + attribute.array.length, 0));
    let offset = 0;
    for (const attribute of attributes) {
      array.set(attribute.array, offset);
      offset += attribute.array.length;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  }
  merged.computeBoundingSphere();
  return merged;
}

function batchStatic(scene) {
  scene.updateMatrixWorld(true);
  const batches = new Map();
  scene.traverse(node => {
    if (!node.isMesh || node.userData.noBatch) return;
    if (Array.isArray(node.material) || node.material.transparent || node.material.map) return;
    let parent = node.parent;
    while (parent) {
      if (parent.userData.noBatch) return;
      parent = parent.parent;
    }
    const key = node.material.uuid;
    if (!batches.has(key)) batches.set(key, { material: node.material, meshes: [] });
    batches.get(key).meshes.push(node);
  });

  for (const { material, meshes } of batches.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map(node => {
      const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      return geometry;
    });
    for (const node of meshes) node.parent?.remove(node);
    scene.add(new THREE.Mesh(mergeNonIndexed(geometries), material));
  }
  scene.updateMatrixWorld(true);
}

export function buildTrainingGround(scene) {
  const fans = [];
  const cloths = [];
  const smoke = [];
  const colliders = [];

  addSky(scene);
  addHills(scene);
  addGround(scene);
  addDistantStructure(scene, colliders);

  fenceRun(scene, -12, -11.4, -2.75, -11.4);
  fenceRun(scene, 2.75, -11.4, 12, -11.4);
  fenceRun(scene, -12, -11.4, -12, 8.5);
  fenceRun(scene, 12, -11.4, 12, 8.5);
  addGate(scene);

  const lamp = addWorkshop(scene);
  addHouse(scene, smoke);
  addAwning(scene);
  addWater(scene);
  addSolar(scene);
  addFan(scene, fans);
  addLaundry(scene, cloths);
  addStaffRack(scene);
  addTrees(scene, colliders);
  const dust = addDust(scene);

  crate(scene, 5.4, 5.9, .52, .22);
  crate(scene, 9.3, 1.15, .48, -.16);
  crate(scene, -4.1, -8.0, .6, .1);
  crate(scene, 10.2, 6.2, .4, .38);
  barrel(scene, 6.7, 2.1, .82);
  barrel(scene, -9.9, 3.9, .9);
  sack(scene, 7.2, 5.7, .85);
  sack(scene, 8.8, -2.5, .72);

  // Solid footprints for the reachable yard. Fences sit outside the player's bounds, so the
  // gate posts are the only fence pieces that need collision here.
  colliders.push(
    boxCollider(-8.7, -5.3, 2.2, 2.0, .34),
    boxCollider(9.4, -6.6, 2.05, 2.35, -.3),
    boxCollider(-8.4, 5.0, 1.9, 1.4, -.2),
    boxCollider(-10.4, 1.2, 1.1, 2.2, .18),
    circleCollider(7.4, 4.7, .62),
    circleCollider(5.8, -3.4, .5),
    boxCollider(-6.0, -3.0, .95, .22),
    circleCollider(-2.55, -11.4, .45),
    circleCollider(2.55, -11.4, .45),
    circleCollider(5.4, 5.9, .34),
    circleCollider(9.3, 1.15, .31),
    circleCollider(-4.1, -8.0, .4),
    circleCollider(10.2, 6.2, .27),
    circleCollider(6.7, 2.1, .38),
    circleCollider(-9.9, 3.9, .42),
    circleCollider(7.2, 5.7, .29),
    circleCollider(8.8, -2.5, .25)
  );

  // Laundry posts and the eight small training-ring posts are solid too.
  const laundryRot = Math.atan2(4.2, -.15);
  for (const localZ of [-2.2, 2.2]) {
    colliders.push(circleCollider(
      8.2 + Math.sin(laundryRot) * localZ,
      3.4 + Math.cos(laundryRot) * localZ,
      .12
    ));
  }
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + .2;
    colliders.push(circleCollider(Math.sin(angle) * 6.45, Math.cos(angle) * 6.45, .11));
  }

  batchStatic(scene);

  return {
    colliders,
    update(now, dt) {
      const time = now * .001;
      for (const fan of fans) fan.rotation.z += dt * 1.6;
      for (const cloth of cloths) {
        cloth.rotation.x = cloth.userData.base + Math.sin(time * 1.2 + cloth.userData.phase) * .045;
      }
      for (const puff of smoke) {
        puff.age += dt * .18;
        if (puff.age > 1) puff.age = 0;
        puff.node.position.y = puff.baseY + puff.age * 2.9;
        puff.node.position.x = puff.baseX + Math.sin(puff.age * 5 + puff.phase) * .26;
        puff.node.position.z = puff.baseZ + Math.cos(puff.age * 4 + puff.phase) * .2;
        puff.node.material.opacity = .15 * (1 - puff.age);
        const scale = .75 + puff.age * 1.9;
        puff.node.scale.setScalar(scale);
      }
      dust.rotation.y += dt * .004;
      if (lamp) lamp.intensity = 8.6 + Math.sin(time * 2.2) * .5;
    }
  };
}

export function buildWilderness(scene) {
  const wilderness = addWilderness(scene);
  batchStatic(scene);
  return wilderness;
}
