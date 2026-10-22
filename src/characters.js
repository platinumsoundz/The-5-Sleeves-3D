// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs)

// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (planted feet and hand-mounted staff)
// Low-poly character whitebox for Ajaye and Sensei. Silhouette and clothing first; faces stay
// deliberately simple until approved reference sheets arrive. Ajaye has no Cipher Sleeve here:
// this is the pre-discovery training scene. Presentation only — no gameplay state lives here.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const C = {
  ajayeSkin: 0xc99a78,
  senseiSkin: 0xa97a5c,
  ajayeHair: 0x4a3328,
  ajayeHairHi: 0x6b4a34,
  senseiHair: 0x2c2623,
  senseiHairHi: 0x4c3b31,
  eyeWhite: 0xd8d0bf,
  ajayeEye: 0x6f9bad,
  senseiEye: 0x3d3027,
  charcoal: 0x2d3432,
  charcoalLight: 0x46504a,
  olive: 0x5b604b,
  rust: 0x85543e,
  leather: 0x4a392c,
  boot: 0x272421,
  wrap: 0x90836b,
  metal: 0x6b7472,
  wood: 0x6d5339,
  woodDark: 0x4b3829
};

function standard(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: .9,
    metalness: 0,
    flatShading: true,
    ...options
  });
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const node = new THREE.Mesh(geometry, material);
  node.position.set(x, y, z);
  return node;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z);
}

function cylinder(top, bottom, height, segments, material, x = 0, y = 0, z = 0) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material, x, y, z);
}

function sphere(radius, material, x = 0, y = 0, z = 0, detail = 10) {
  return mesh(new THREE.SphereGeometry(radius, detail, Math.max(6, Math.round(detail * .7))), material, x, y, z);
}

// A whole fighter is built from a small, shared vocabulary of shapes. `body` remains the torso
// for the old tint contract; `setTint` paints every material so hit flashes read on the silhouette.
export function createFighter(kind = 'ajaye') {
  const sensei = kind === 'sensei';
  const mats = {
    skin: standard(sensei ? C.senseiSkin : C.ajayeSkin, { roughness: .82, flatShading: false }),
    hair: standard(sensei ? C.senseiHair : C.ajayeHair, { roughness: .96 }),
    hairHi: standard(sensei ? C.senseiHairHi : C.ajayeHairHi, { roughness: .96 }),
    cloth: standard(sensei ? C.olive : C.charcoal, { roughness: .95 }),
    cloth2: standard(sensei ? C.charcoal : C.charcoalLight, { roughness: .95 }),
    cloth3: standard(sensei ? C.rust : C.olive, { roughness: .95 }),
    leather: standard(C.leather),
    boot: standard(C.boot),
    wrap: standard(C.wrap, { roughness: 1 }),
    metal: standard(C.metal, { metalness: .25, roughness: .55 }),
    wood: standard(C.wood, { roughness: .9 }),
    woodDark: standard(C.woodDark, { roughness: .95 }),
    eyeWhite: standard(C.eyeWhite, { flatShading: false, roughness: .6 }),
    iris: standard(sensei ? C.senseiEye : C.ajayeEye, { flatShading: false, roughness: .4 }),
    pupil: standard(0x191815, { flatShading: false, roughness: .4 }),
    mouth: standard(0x6e4d43, { flatShading: false })
  };
  const tintMaterials = [...new Set(Object.values(mats))];

  const root = new THREE.Group();
  root.name = kind;
  const visual = new THREE.Group();
  visual.scale.setScalar(sensei ? 1 : .94);
  root.add(visual);

  // Hip/knee pivots keep the legs articulated for walking and crouching.
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * .145, .9, 0);
    visual.add(hip);
    hip.add(cylinder(.105, .09, .39, 6, mats.cloth2, 0, -.21, 0));

    const knee = new THREE.Group();
    knee.position.y = -.4;
    hip.add(knee);
    knee.add(cylinder(.09, .078, .37, 6, mats.cloth, 0, -.185, 0));
    knee.add(box(.19, .04, .31, mats.boot, 0, -.475, .045));
    knee.add(box(.17, .13, .25, mats.boot, 0, -.4, .045));
    knee.add(box(.12, .12, .04, mats.leather, 0, -.28, -.16));
    if (!sensei && side === 1) {
      const patch = box(.13, .16, .025, mats.cloth3, 0, -.2, .105);
      patch.rotation.z = .12;
      hip.add(patch);
    }
    legs.push({ hip, knee });
  }
  const [rightLeg, leftLeg] = legs;

  visual.add(box(.38, .2, .25, mats.cloth2, 0, .9, 0));
  const belt = cylinder(.235, .235, .09, 8, mats.leather, 0, .985, 0);
  belt.scale.z = .8;
  visual.add(belt);
  visual.add(box(.11, .1, .06, mats.leather, -.17, .93, .17));
  visual.add(box(.13, .08, .06, mats.leather, .16, .93, .17));
  visual.add(box(.055, .055, .025, mats.metal, 0, .985, .215));

  const upper = new THREE.Group();
  upper.position.y = .94;
  visual.add(upper);

  const torso = cylinder(.3, .225, .56, 8, mats.cloth, 0, .28, 0);
  torso.scale.z = .76;
  upper.add(torso);
  upper.add(box(.27, .13, .2, mats.cloth2, 0, .535, 0));

  if (sensei) {
    upper.add(box(.18, .4, .035, mats.cloth2, -.13, .31, .225));
    upper.add(box(.18, .4, .035, mats.cloth2, .13, .31, .225));
    upper.add(box(.42, .09, .08, mats.leather, 0, .49, .23));
  } else {
    upper.add(box(.16, .24, .035, mats.cloth2, -.13, .35, .225));
    upper.add(box(.16, .24, .035, mats.cloth2, .13, .35, .225));
    const strap = box(.065, .62, .03, mats.leather, 0, .31, .242);
    strap.rotation.z = .55;
    upper.add(strap);
    upper.add(box(.075, .06, .025, mats.metal, .1, .38, .262));
  }

  function arm(side) {
    const group = new THREE.Group();
    group.position.set(side * .335, .5, 0);
    group.rotation.z = side * .11;
    group.add(cylinder(.12, .1, .18, 6, mats.cloth, 0, -.08, 0));
    group.add(cylinder(.083, .075, .28, 6, sensei ? mats.cloth3 : mats.cloth2, 0, -.21, 0));

    const elbow = new THREE.Group();
    elbow.position.y = -.32;
    elbow.add(cylinder(.075, .065, .25, 6, sensei ? mats.skin : mats.cloth2, 0, -.13, 0));
    elbow.add(cylinder(.08, .08, .07, 6, mats.wrap, 0, -.255, 0));
    elbow.add(sphere(.078, mats.leather, 0, -.305, 0, 8));
    group.add(elbow);

    if (sensei) {
      group.add(cylinder(.108, .105, .07, 6, mats.leather, 0, -.3, 0));
    } else {
      group.add(cylinder(.115, .11, .055, 6, mats.leather, 0, -.17, 0));
    }
    upper.add(group);
    return { group, elbow };
  }

  const rightArm = arm(-1);
  rightArm.group.rotation.x = -1.5;
  rightArm.elbow.rotation.x = -.5;
  const staffMount = new THREE.Group();
  staffMount.position.set(0, -.305, 0);
  staffMount.rotation.x = 2;
  rightArm.elbow.add(staffMount);
  const leftArm = arm(1);
  leftArm.group.rotation.x = -.12;

  // Scarf/collar and belt details.
  if (!sensei) {
    const scarf = mesh(new THREE.TorusGeometry(.15, .052, 5, 12), mats.cloth2, 0, .585, 0);
    scarf.rotation.x = Math.PI / 2;
    upper.add(scarf);
    const tail = box(.09, .3, .025, mats.cloth2, .14, .43, .226);
    tail.rotation.z = .18;
    upper.add(tail);
    upper.add(box(.12, .035, .025, mats.cloth3, -.16, .43, .23));
  } else {
    upper.add(box(.31, .08, .12, mats.cloth3, 0, .58, .055));
    upper.add(box(.14, .05, .06, mats.leather, -.2, .56, .13));
  }

  // Head: eyes, brows and hair carry identity; no detailed face claims.
  const headGroup = new THREE.Group();
  headGroup.position.y = .79;
  upper.add(headGroup);
  headGroup.add(cylinder(.09, .1, .14, 6, mats.skin, 0, -.12, 0));
  const head = sphere(.19, mats.skin, 0, 0, 0, 12);
  head.scale.set(.92, 1.08, .92);
  headGroup.add(head);
  headGroup.add(sphere(.055, mats.skin, -.174, -.005, 0, 7));
  headGroup.add(sphere(.055, mats.skin, .174, -.005, 0, 7));

  for (const side of [-1, 1]) {
    const white = sphere(.032, mats.eyeWhite, side * .062, .022, .165, 8);
    white.scale.set(.9, .56, .35);
    headGroup.add(white);
    headGroup.add(sphere(.015, mats.iris, side * .062, .022, .181, 7));
    headGroup.add(sphere(.007, mats.pupil, side * .062, .022, .19, 6));
    const brow = box(.078, .016, .02, mats.hair, side * .064, .08, .168);
    brow.rotation.z = side * -.08;
    headGroup.add(brow);
  }
  headGroup.add(box(.038, .068, .034, mats.skin, 0, -.005, .188));
  headGroup.add(box(.075, .012, .012, mats.mouth, 0, -.092, .178));

  if (sensei) {
    const beard = sphere(.14, mats.hair, 0, -.105, .105, 8);
    beard.scale.set(1, .7, .58);
    headGroup.add(beard);
    headGroup.add(box(.11, .022, .02, mats.hair, 0, -.06, .19));
    const cap = sphere(.203, mats.hair, 0, .045, -.06, 10);
    cap.scale.set(1.01, .9, .84);
    headGroup.add(cap);
    headGroup.add(cylinder(.032, .038, .07, 6, mats.leather, 0, .06, -.19));
    for (const [y, z, scale] of [[-.02, -.21, .95], [-.17, -.22, 1], [-.32, -.2, .82]]) {
      const tail = sphere(.095, mats.hairHi, 0, y, z, 7);
      tail.scale.set(.75 * scale, 1.25 * scale, .7 * scale);
      headGroup.add(tail);
    }
    headGroup.add(box(.025, .2, .025, mats.hair, -.13, -.02, -.15));
    headGroup.add(box(.025, .18, .025, mats.hair, .13, -.02, -.15));
  } else {
    const cap = sphere(.203, mats.hair, 0, .055, -.055, 10);
    cap.scale.set(1.03, .9, .84);
    headGroup.add(cap);
    const curls = [
      [0, .16, .03, .095, 0],
      [-.12, .14, .055, .085, 1],
      [.12, .14, .055, .085, 1],
      [-.16, .06, -.015, .078, 0],
      [.16, .06, -.015, .078, 0],
      [0, .13, -.12, .095, 1],
      [-.085, .18, -.09, .075, 0],
      [.085, .18, -.09, .075, 0],
      [0, .095, .135, .055, 1]
    ];
    for (const [x, y, z, radius, hi] of curls) {
      headGroup.add(mesh(new THREE.IcosahedronGeometry(radius, 0), hi ? mats.hairHi : mats.hair, x, y, z));
    }
  }

  // Padded training staff. The group origin is the grip; Game rotates the shaft on z and
  // world.js sets the guard angle on x.
  const stick = new THREE.Group();
  staffMount.add(stick);
  stick.add(cylinder(.036, .036, 2.06, 6, mats.wood, 0, .55, 0));
  for (const y of [.24, .42, .6, .78]) {
    stick.add(cylinder(.043, .043, .075, 6, mats.leather, 0, y, 0));
  }
  stick.add(cylinder(.048, .048, .09, 6, mats.wrap, 0, -.42, 0));
  stick.add(cylinder(.048, .048, .09, 6, mats.wrap, 0, 1.52, 0));
  stick.add(sphere(.05, mats.woodDark, 0, -.47, 0, 6));
  stick.add(sphere(.05, mats.woodDark, 0, 1.57, 0, 6));
  stick.rotation.x = Math.PI / 2;

  function setTint(hex, intensity) {
    for (const material of tintMaterials) {
      material.emissive.setHex(hex);
      material.emissiveIntensity = intensity;
    }
  }

  // Procedural pose keeps the armour simple while giving the silhouette readable articulation.
  // The staff hand stays stable; the free arm, hips and knees carry the walk/crouch/attack read.
  function pose({ walk = 0, phase = 0, crouch = 0, swing = 0, guard = false } = {}) {
    const c = Math.max(0, Math.min(1, crouch));
    const w = Math.max(0, Math.min(1.5, walk));
    const gait = Math.sin(phase) * .55 * w;
    rightLeg.hip.rotation.x = -c * 1.1 - gait;
    leftLeg.hip.rotation.x = -c * 1.1 + gait;
    rightLeg.knee.rotation.x = c * 2.1 + Math.max(0, -gait) * .65;
    leftLeg.knee.rotation.x = c * 2.1 + Math.max(0, gait) * .65;

    leftArm.group.rotation.x = -.12 - gait * .56 - c * .22 + swing * .3 - (guard ? .48 : 0);
    leftArm.elbow.rotation.x = -.12 - Math.max(0, gait) * .45 - c * .38 - swing * .28 - (guard ? .5 : 0);
    return -c * .254 + Math.abs(Math.sin(phase * 2)) * .012 * w;
  }

  // Collapse static pieces inside each animated section. Hips, knees, shoulders, elbows and the
  // staff remain separate so the procedural pose can move them after batching.
  root.updateMatrixWorld(true);
  batchSection(visual, [upper, leftLeg.hip, rightLeg.hip]);
  batchSection(upper, [leftArm.group, rightArm.group, stick, torso]);
  batchSection(leftArm.group, [leftArm.elbow]);
  batchSection(leftArm.elbow, []);
  batchSection(rightArm.group, [rightArm.elbow]);
  batchSection(rightArm.elbow, [staffMount]);
  batchSection(stick, []);
  for (const leg of [leftLeg, rightLeg]) {
    batchSection(leg.hip, [leg.knee]);
    batchSection(leg.knee, []);
  }

  return {
    name: kind,
    root,
    visual,
    upper,
    body: torso,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    stick,
    pose,
    setTint
  };
}

function mergeNonIndexed(geometries) {
  const merged = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const attributes = geometries.map(geometry => geometry.getAttribute(name));
    if (attributes.some(attribute => !attribute)) continue;
    const array = new Float32Array(attributes.reduce((sum, attribute) => sum + attribute.array.length, 0));
    let offset = 0;
    for (const attribute of attributes) {
      array.set(attribute.array, offset);
      offset += attribute.array.length;
    }
    merged.setAttribute(name, new THREE.BufferAttribute(array, attributes[0].itemSize));
  }
  merged.computeBoundingSphere();
  return merged;
}

function batchSection(container, excluded = []) {
  container.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(container.matrixWorld).invert();
  const batches = new Map();

  container.traverse(node => {
    if (!node.isMesh || node.material?.transparent || node.material?.map) return;
    let parent = node;
    while (parent && parent !== container) {
      if (excluded.includes(parent)) return;
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
      const local = new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld);
      geometry.applyMatrix4(local);
      return geometry;
    });
    for (const node of meshes) node.parent?.remove(node);
    container.add(new THREE.Mesh(mergeNonIndexed(geometries), material));
  }
  container.updateMatrixWorld(true);
}
