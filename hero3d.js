// トップの 3D: ウォルナットの飾り棚に、アクリルスタンドを回転台で飾る。
// アクスタの形はアプリと同じ作り（外形を押し出したアクリル板＋裏に印刷と白い下地）。
// ドラッグで回り込み、アクスタをタップするとぴょんと跳ねる。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.getElementById("stage");

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

if (!supportsWebGL()) {
  stage.classList.add("no-webgl");
} else {
  start();
}

async function start() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  camera.position.set(0, 0.4, 1.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.31, 0);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minAzimuthAngle = -0.7;
  controls.maxAzimuthAngle = 0.7;
  controls.minPolarAngle = 1.05;
  controls.maxPolarAngle = 1.65;
  controls.rotateSpeed = 0.6;

  // 光: やわらかい全体光、斜め上からの影つきの光、各段のスポット
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7a6a, 0.55));
  const key = new THREE.DirectionalLight(0xfff1e0, 1.6);
  key.position.set(0.8, 1.6, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -0.7; key.shadow.camera.right = 0.7;
  key.shadow.camera.top = 1; key.shadow.camera.bottom = -0.3;
  key.shadow.bias = -0.0005;
  scene.add(key);

  // ---- 棚 ----
  const width = 0.62, depth = 0.18, board = 0.014, spacing = 0.2, tiers = 3;
  const tops = Array.from({ length: tiers }, (_, i) => board + i * spacing);
  const height = board + tiers * spacing;
  const walnut = new THREE.MeshPhysicalMaterial({ color: 0x6a4430, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.25 });
  walnut.map = woodTexture();
  const backMat = new THREE.MeshStandardMaterial({ color: 0xf1e7d8, roughness: 0.85 });
  const shelf = new THREE.Group();
  function box(w, h, d, x, y, z, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    shelf.add(m);
    return m;
  }
  for (const top of [...tops, height]) box(width, board, depth, 0, top - board / 2, 0, walnut);
  box(board, height, depth, -width / 2 - board / 2, height / 2, 0, walnut);
  box(board, height, depth, width / 2 + board / 2, height / 2, 0, walnut);
  box(width + board * 2, height, 0.01, 0, height / 2, -depth / 2 + 0.005, backMat);
  // 各段の LED の帯とスポット
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff3dc });
  tops.forEach((bottom, i) => {
    const upper = (i + 1 < tops.length ? tops[i + 1] : height) - board;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.003, 0.006), ledMat);
    strip.position.set(0, upper - 0.003, depth / 2 - 0.015);
    shelf.add(strip);
    const spot = new THREE.SpotLight(0xffe6c4, 1.1, 0.5, 1.0, 0.8, 1.2);
    spot.position.set(0, upper - 0.01, depth / 2 - 0.02);
    spot.target.position.set(0, bottom, 0);
    shelf.add(spot, spot.target);
  });
  scene.add(shelf);
  // 机
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xc89f78, roughness: 0.5, clearcoat: 0.3 }));
  desk.material.map = woodTexture(true);
  desk.position.set(0, -0.015, 0.12);
  desk.receiveShadow = true;
  scene.add(desk);

  // ---- アクリルスタンド ----
  // 形と画像は index.html に埋め込んである（ファイルを直接開いても読めるように）。無ければ取りに行く
  const data = window.ACSTA_STANDS || await fetch("assets/stands/stands.json").then(r => r.json());
  const loader = new THREE.TextureLoader();
  // アクリル: うっすら映り込む透明な板（透過の計算は絵が白っぽくなるので使わない）
  const acrylic = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02,
    depthWrite: false, envMapIntensity: 1.6,
  });
  const edge = new THREE.MeshPhysicalMaterial({
    color: 0xc4f0f1, transparent: true, opacity: 0.6, roughness: 0.08, emissive: 0x8fd6d8, emissiveIntensity: 0.18, depthWrite: false,
  });
  // 裏から見たときの白い下地
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.6, side: THREE.BackSide });
  const baseMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1, depthWrite: false });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.35, metalness: 0.1 });

  function shapeOf(points) {
    const s = new THREE.Shape();
    points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  }

  function makeStand(kind) {
    const d = data[kind];
    const group = new THREE.Group();
    const thickness = 0.005;
    // アクリル板（面取りあり）
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeOf(d.outline), { depth: thickness, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 2, curveSegments: 1 }),
      [acrylic, edge]
    );
    body.position.z = -thickness / 2;
    group.add(body);
    // 裏の印刷と白い下地（表からはアクリル越しに見える）
    const [pw, ph] = d.printSize;
    const printGeo = new THREE.ShapeGeometry(shapeOf(d.figure));
    const pos = printGeo.attributes.position, uv = printGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / pw + 0.5, pos.getY(i) / ph + 0.5);
    const texture = loader.load(d.image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    // 絵は表からくっきり見えるように板の表側に、白い下地は裏側に
    const print = new THREE.Mesh(printGeo, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 }));
    print.position.z = thickness / 2 + 0.0004;
    print.castShadow = true;
    const backing = new THREE.Mesh(printGeo, white);
    backing.position.z = -thickness / 2 - 0.0004;
    group.add(print, backing);
    // 台座（透明な楕円）
    const minY = Math.min(...d.outline.map(p => p[1]));
    const w = Math.max(...d.outline.map(p => p[0])) - Math.min(...d.outline.map(p => p[0]));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.02, w * 0.33), Math.max(0.02, w * 0.33), 0.006, 40), baseMat);
    base.scale.z = 0.6;
    base.position.y = minY + 0.003 - 0.003;
    group.add(base);
    // 段の高さに合う大きさに
    const scale = 1.3;
    group.scale.setScalar(scale);
    group.userData.lift = (-minY + 0.006) * scale;
    return group;
  }

  // 段ごとに並べる（回転台の上）
  const layout = [
    ["person", 0, -0.15], ["plant", 0, 0.15],
    ["frame", 1, -0.14], ["person", 1, 0.15],
    ["plant", 2, -0.15], ["person", 2, 0.14],
  ];
  const stands = [];
  layout.forEach(([kind, tier, x], i) => {
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.006, 48), tableMat);
    turntable.position.set(x, tops[tier] + 0.003, 0.01);
    turntable.receiveShadow = true;
    shelf.add(turntable);
    const stand = makeStand(kind);
    stand.position.set(x, tops[tier] + stand.userData.lift, 0.01);
    stand.rotation.y = -0.5 + i * 0.2;  // 最初はみんな正面寄り
    stand.traverse(o => { if (o.isMesh) o.castShadow = true; });
    shelf.add(stand);
    stands.push({ group: stand, turntable, baseY: stand.position.y, vy: 0, spin: 0 });
  });

  // ---- 操作: タップで跳ねる ----
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener("pointerdown", e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(stands.map(s => s.group), true)[0];
    if (!hit) return;
    const s = stands.find(s => s.group === hit.object.parent || s.group === hit.object);
    if (s && s.group.position.y <= s.baseY + 0.001) { s.vy = 1.3; s.spin = 14; }
  });

  // ---- 大きさ ----
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 棚の幅が入る距離に
    const fitW = (width / 2 + 0.12) / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const fitH = (height / 2 + 0.12) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(fitW, fitH);
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).add(dir.multiplyScalar(dist));
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- 動き ----
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let idle = 0;
  controls.addEventListener("start", () => { idle = -3; });
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    idle += dt;
    // 回転台: 正面はゆっくり、裏はさっと（表を向いている時間が長い）
    for (const s of stands) {
      const facing = Math.cos(s.group.rotation.y);
      const away = (1 - facing) / 2;
      const speed = reduceMotion ? 0.15 : 0.12 + 3.0 * away * away;
      s.group.rotation.y += dt * (speed + s.spin);
      s.turntable.rotation.y += dt * speed;
      s.spin *= Math.pow(0.02, dt);
      if (s.vy !== 0 || s.group.position.y > s.baseY) {
        s.vy -= 9.8 * dt;
        s.group.position.y += s.vy * dt;
        if (s.group.position.y <= s.baseY) { s.group.position.y = s.baseY; s.vy = Math.abs(s.vy) > 0.6 ? -s.vy * 0.3 : 0; }
      }
    }
    // しばらく触らなければ、ゆっくり左右に見回す
    if (!reduceMotion && idle > 0) {
      const az = Math.sin(idle * 0.25) * 0.35;
      const r = camera.position.distanceTo(controls.target);
      const polar = controls.getPolarAngle();
      camera.position.set(
        controls.target.x + r * Math.sin(polar) * Math.sin(az),
        controls.target.y + r * Math.cos(polar),
        controls.target.z + r * Math.sin(polar) * Math.cos(az)
      );
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

/// 木目のテクスチャ（その場で描く）
function woodTexture(light) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = light ? "#c9a07a" : "#6a4430";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = light ? `rgba(120,80,45,${0.05 + Math.random() * 0.12})` : `rgba(30,15,8,${0.06 + Math.random() * 0.18})`;
    g.lineWidth = 0.6 + Math.random() * 1.8;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 4 + (Math.random() - 0.5) * 1.5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
