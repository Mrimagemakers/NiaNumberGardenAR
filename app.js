// Nia & the Number Garden — Deluxe AR Book Experience
import { IS_IOS } from './compat.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { b64ToBuf, FX, sfx, speak, stopSpeech, sound, updateTweens, tween, canvasTex, glowTexture, loadModels, NUM_COLORS, FONT } from './core.js';
import { EXPERIENCES, SPREAD_EXP, CHAPTERS } from './exps.js';
import { makeStoryTree, makeBush, makeMushroom, makeRock, makeSunflower, makePetalFlower, grassField, bakeStatic } from './garden.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { winged, makeGate, num3D } from './core.js';
import { TEXT } from './narration.js';

{
/* ---------- pages ---------- */
const FILES = [1, 2, 3, 4, 6, 7, 8];
for (let p = 10; p <= 62; p++) FILES.push(p);
FILES.push('passport', 63);
const N = FILES.length, SHEETS = N / 2; // 62 pages, 31 sheets
const pdfPage = (i) => FILES[i];
const $ = (id) => document.getElementById(id);

/* ---------- progress (stars) ---------- */
const stars = new Set();
try { JSON.parse(localStorage.getItem('nia-stars') || '[]').forEach(s => stars.add(s)); } catch (e) { }
const saveStars = () => { try { localStorage.setItem('nia-stars', JSON.stringify([...stars])); } catch (e) { } };

/* ---------- renderer / scene ---------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_IOS ? 1.5 : 2)); // iPad screens are huge; full 2x runs out of memory and stutters
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 60);
camera.position.set(0, 1.75, 2.35);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.32, 0); controls.enableDamping = true; controls.minDistance = 1; controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI * 0.47; controls.enablePan = false;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer);
const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envMap; scene.environmentIntensity = 0.55;
scene.add(new THREE.HemisphereLight('#fff7e0', '#5c8a3a', 1.2));
const sun = new THREE.DirectionalLight('#fff4d6', 2.2); sun.position.set(1.6, 3.2, 1.8); scene.add(sun);
sun.castShadow = true; sun.shadow.mapSize.set(IS_IOS ? 1024 : 2048, IS_IOS ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 8 });
const fill = new THREE.DirectionalLight('#c9e7ff', 0.6); fill.position.set(-2, 1.5, -1); scene.add(fill);

// Garden world (hidden in AR passthrough)
const world = new THREE.Group(); scene.add(world);
const skyTex = canvasTex(16, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#2f8fe0'); g.addColorStop(0.35, '#6cc3ff'); g.addColorStop(0.5, '#bfe8ff'); g.addColorStop(0.56, '#fff3d6'); g.addColorStop(1, '#ffe7b0'); c.fillStyle = g; c.fillRect(0, 0, 16, 256); });
const sky = new THREE.Mesh(new THREE.SphereGeometry(45, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, fog: false }));
world.add(sky);
const grassT = canvasTex(512, 512, (c) => { c.fillStyle = '#b4dc98'; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const x = Math.random() * 512, y = Math.random() * 512, h = 4 + Math.random() * 8; c.strokeStyle = ['#9fca86', '#ffffff', '#b4d99b', '#e6f5da'][i % 4]; c.globalAlpha = 0.6; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 3, y - h); c.stroke(); } c.globalAlpha = 1; });
grassT.wrapS = grassT.wrapT = THREE.RepeatWrapping; grassT.repeat.set(70, 70);
const groundG = new THREE.PlaneGeometry(60, 60, 120, 120); { const p = groundG.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), d = Math.hypot(x, y);
    const n = Math.sin(x * 0.35) * Math.cos(y * 0.4) + Math.sin(x * 0.9 + y * 0.7) * 0.5 + Math.sin(x * 2.1 - y * 1.7) * 0.25;
    if (d > 14) p.setZ(i, (d - 14) * 0.12 + n * 0.25); // gentle rise into hills at the edge
    c.setHSL(0.28 + n * 0.02, 0.6 + n * 0.05, 0.34 + n * 0.05); col.push(c.r, c.g, c.b); }
  groundG.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); groundG.computeVertexNormals(); }
const ground = new THREE.Mesh(groundG, new THREE.MeshStandardMaterial({ map: grassT, vertexColors: true, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.62; ground.receiveShadow = true; world.add(ground);
const woodT = canvasTex(512, 512, (c) => { c.fillStyle = '#c58b52'; c.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) { c.strokeStyle = `rgba(${90 + Math.random() * 40},${50 + Math.random() * 20},20,${0.08 + Math.random() * 0.12})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= 512; x += 32) c.lineTo(x, y + Math.sin(x * 0.02 + y * 0.05) * 3); c.stroke(); }
  c.fillStyle = 'rgba(60,30,10,.25)'; for (let x = 0; x < 512; x += 128) c.fillRect(x, 0, 2, 512); });
const table = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 64), [new THREE.MeshStandardMaterial({ map: woodT, roughness: 0.6 }), new THREE.MeshStandardMaterial({ map: woodT, roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: '#8a5a2e' })]);
table.position.y = -0.06; table.receiveShadow = true; world.add(table);
const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 0.55, 24), new THREE.MeshStandardMaterial({ map: woodT, color: '#b98a5a', roughness: 0.7 })); tableLeg.position.y = -0.36; world.add(tableLeg);
// soft painted clouds
const cloudT = canvasTex(512, 256, (c) => { const puffs = []; for (let i = 0; i < 14; i++) { const x = 90 + Math.random() * 330, r = 34 + Math.random() * 46 - Math.abs(x - 256) * 0.12; puffs.push([x, 150 - r * 0.55 - Math.random() * 20, Math.max(26, r)]); }
  puffs.forEach(([x, y, r]) => { const g = c.createRadialGradient(x, y + r * 0.5, r * 0.2, x, y, r); g.addColorStop(0, 'rgba(196,214,236,.95)'); g.addColorStop(1, 'rgba(196,214,236,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y + 8, r, 0, 7); c.fill(); });
  puffs.forEach(([x, y, r]) => { const g = c.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.75, 'rgba(250,252,255,.92)'); g.addColorStop(1, 'rgba(250,252,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); });
{ const sunT = canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.12, 'rgba(255,248,200,1)'); g.addColorStop(0.3, 'rgba(255,230,140,.45)'); g.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunT, transparent: true, depthWrite: false, fog: false })); sunS.position.set(9, 11, -16); sunS.scale.setScalar(9); world.add(sunS); }
for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false })); const a = i / 12 * Math.PI * 2 + 0.3; s.position.set(Math.cos(a) * 20, 6 + Math.random() * 5, Math.sin(a) * 20); const k = 8 + Math.random() * 5; s.scale.set(k, k / 2, 1); s.userData.drift = 0.02 + Math.random() * 0.03; world.add(s); (world.userData.clouds = world.userData.clouds || []).push(s); }
// rolling hills
for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const h = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 12), new THREE.MeshStandardMaterial({ color: i % 2 ? '#5fb648' : '#79c95a', roughness: 1 })); h.scale.set(1.6, 0.35, 1); h.position.set(Math.cos(a) * 22, -1.4, Math.sin(a) * 22); world.add(h); }
const worldFog = new THREE.Fog('#dff1ff', 16, 40); scene.fog = worldFog;
{ // distant trees, bushes and drifting candy numerals
  const statics = new THREE.Group(); world.add(statics);
  // storybook trees in two rings, with bushes, mushrooms, rocks and sunflowers between
  for (let i = 0; i < 20; i++) { const ang = i / 20 * Math.PI * 2 + Math.random() * 0.15, r = 6.5 + Math.random() * 5;
    const tr = makeStoryTree(2.6 + Math.random() * 1.6, i % 4 === 0 ? { fruit: '#ef233c', far: true } : i % 4 === 2 ? { blossom: ['#ffb3d9', '#fff3b0', '#d0b3ff'][i % 3], far: true } : { far: true });
    tr.position.set(Math.cos(ang) * r, -0.62, Math.sin(ang) * r); tr.rotation.y = Math.random() * 6; statics.add(tr); }
  for (let i = 0; i < 16; i++) { const ang = i / 16 * Math.PI * 2 + 0.2, r = 3.2 + Math.random() * 2.2; const b = makeBush(0.35 + Math.random() * 0.3, NUM_COLORS[i % 10], true); b.position.set(Math.cos(ang) * r, -0.62, Math.sin(ang) * r); statics.add(b); }
  for (let i = 0; i < 9; i++) { const ang = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 3; const m = makeMushroom(0.18 + Math.random() * 0.2, ['#e63946', '#9b5de5', '#ff8c1a'][i % 3]); m.position.set(Math.cos(ang) * r, -0.62, Math.sin(ang) * r); statics.add(m); }
  for (let i = 0; i < 10; i++) { const ang = Math.random() * Math.PI * 2, r = 2 + Math.random() * 5; const rk = makeRock(0.15 + Math.random() * 0.25, true); rk.position.set(Math.cos(ang) * r, -0.6, Math.sin(ang) * r); rk.rotation.y = Math.random() * 6; statics.add(rk); }
  for (let i = 0; i < 8; i++) { const ang = -Math.PI / 2 + (i - 3.5) * 0.28, r = 4.5 + (i % 2) * 0.6; const sfl = makeSunflower(1.1 + Math.random() * 0.4); sfl.position.set(Math.cos(ang) * r, -0.62, Math.sin(ang) * r); sfl.lookAt(0, 0.6, 0); sfl.rotation.x = 0; statics.add(sfl); }
  for (let i = 0; i < 30; i++) { const ang = Math.random() * Math.PI * 2, r = 1.7 + Math.random() * 1.6; const f = makePetalFlower(NUM_COLORS[i % 10], 0.18 + Math.random() * 0.12, 6, '#ffd23f', 0.05); f.position.set(Math.cos(ang) * r, -0.62, Math.sin(ang) * r); f.rotation.y = Math.random() * 6; statics.add(f); }
  // stepping-stone path winding from the table toward the far gate
  for (let i = 0; i < 16; i++) { const t = i / 15, z = -1.7 - t * 9, x = Math.sin(t * 4) * 0.9; const st = makeRock(0.22 + Math.random() * 0.06, true); st.scale.y *= 0.25; st.position.set(x + (i % 2 ? 0.18 : -0.18), -0.6, z); statics.add(st); }
  // picket fence arc behind the meadow
  { const fm = new THREE.MeshStandardMaterial({ color: '#fbf7ef', roughness: 0.6 }), pk = new THREE.BoxGeometry(0.09, 0.55, 0.03), tip = new THREE.ConeGeometry(0.065, 0.08, 4);
    for (let i = 0; i < 90; i++) { const ang = Math.PI * 0.62 + i / 89 * Math.PI * 1.76; if (Math.abs(ang - Math.PI * 1.5) < 0.09) continue; const r = 5.6, x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      const p = new THREE.Mesh(pk, fm); p.position.set(x, -0.35, z); p.lookAt(0, -0.35, 0); statics.add(p); const tp = new THREE.Mesh(tip, fm); tp.position.set(x, -0.04, z); tp.rotation.y = -ang + Math.PI / 4; statics.add(tp); }
    for (const h of [-0.47, -0.2]) for (let i = 0; i < 44; i++) { const a0 = Math.PI * 0.62 + i / 44 * Math.PI * 1.76, a1 = a0 + Math.PI * 1.76 / 44; const r = 5.58; const p0 = new THREE.Vector3(Math.cos(a0) * r, h, Math.sin(a0) * r), p1 = new THREE.Vector3(Math.cos(a1) * r, h, Math.sin(a1) * r);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, p0.distanceTo(p1)), fm); rail.position.copy(p0).add(p1).multiplyScalar(0.5); rail.lookAt(p1); statics.add(rail); } }
  { const baked = bakeStatic(statics, mergeGeometries); world.remove(statics); world.add(baked); }
  // lily pond
  { const pondT = canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, '#5fd3f3'); g.addColorStop(0.8, '#2b9fd1'); g.addColorStop(0.95, '#7cc96a'); g.addColorStop(1, 'rgba(124,201,106,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
    const pond = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: pondT, transparent: true, roughness: 0.05, clearcoat: 1, metalness: 0.1 })); pond.scale.z = 0.6; pond.position.set(-3.6, -0.605, 1.6); world.add(pond);
    for (let i = 0; i < 6; i++) { const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 20, 1, false, 0.3, Math.PI * 1.8), new THREE.MeshStandardMaterial({ color: '#3fae5a', roughness: 0.4 })); lp.position.set(-3.6 + Math.cos(i * 1.1) * 0.8, -0.598, 1.6 + Math.sin(i * 1.1) * 0.4); world.add(lp); }
    for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2, rk = makeRock(0.14, true); rk.position.set(-3.6 + Math.cos(ang) * 1.32, -0.6, 1.6 + Math.sin(ang) * 0.8); world.add(rk); } }
  // the Number Garden gate standing at the end of the path
  { const bigGate = makeGate(); bigGate.scale.setScalar(4.2); bigGate.position.set(0, -0.62, -12.6); world.add(bigGate);
    const g8 = num3D('8', '#ffd23f', 1.1); g8.position.set(0, 2.3, -12.4); g8.userData.billboard = false; world.add(g8); }
  const grassF = grassField(1800, 1.55, 8, -0.62, 0.24); world.add(grassF); world.userData.grass = grassF;
  // butterflies drifting around the garden
  world.userData.flutter = [];
  for (let i = 0; i < 6; i++) { const b = winged(['#ffd23f', '#ff9ec7', '#9be8ff', '#c9a7ff', '#ffb36b', '#b8f28a'][i], '#5a189a', '#ffffff', null, '#3c1361', 0.22); b.userData.ph = i * 1.3; b.userData.r = 1.9 + (i % 3) * 0.7; world.add(b); world.userData.flutter.push(b); }
  // pollen and fireflies drifting in the light
  const pg = new THREE.BufferGeometry(), pp = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) pp.set([(Math.random() - 0.5) * 9, Math.random() * 3, (Math.random() - 0.5) * 9], i * 3);
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); const pollen = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.05, map: glowTexture(), color: '#fff3b0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); world.add(pollen); world.userData.pollen = pollen;
}
const floaters = [];
for (let i = 0; i < 14; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (c) => { c.font = `700 110px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = '#fff'; c.strokeText(String(i % 10), 64, 70); c.fillStyle = NUM_COLORS[i % 10]; c.fillText(String(i % 10), 64, 70); }), transparent: true, opacity: 0.85, depthWrite: false }));
  const a = i / 14 * Math.PI * 2; s.position.set(Math.cos(a) * 3.2, 0.6 + Math.random() * 1.6, Math.sin(a) * 3.2 - 0.5); s.scale.setScalar(0.35 + Math.random() * 0.3); s.userData.ph = Math.random() * 6; world.add(s); floaters.push(s);
}

/* ---------- the book ---------- */
const bookRoot = new THREE.Group(); scene.add(bookRoot); // placement per mode (AR anchor, VR table)
const book = new THREE.Group(); bookRoot.add(book);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(128, 64, (c) => { const g = c.createRadialGradient(64, 32, 4, 64, 32, 60); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 64); }), transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.005; book.add(shadow);
// hard covers (board edges peeking out under the pages)
const boardMat = new THREE.MeshLambertMaterial({ color: '#5a189a' });
const boardR = new THREE.Mesh(new THREE.BoxGeometry(1.03, 0.012, 1.04), boardMat); boardR.position.set(0.515, -0.004, 0); book.add(boardR);
const boardL = boardR.clone(); boardL.position.x = -0.515; book.add(boardL);
boardR.castShadow = boardL.castShadow = true; boardR.receiveShadow = boardL.receiveShadow = true;
const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.04, 16, 1, false, Math.PI, Math.PI), boardMat); spine.rotation.x = Math.PI / 2; spine.position.y = -0.004; book.add(spine);
const edgeT = canvasTex(64, 256, (c) => { c.fillStyle = '#fbf3df'; c.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 2) { c.fillStyle = `rgba(150,120,80,${0.08 + Math.random() * 0.14})`; c.fillRect(0, y, 64, 1); } });
edgeT.wrapS = edgeT.wrapT = THREE.RepeatWrapping;
const edgeMat = new THREE.MeshStandardMaterial({ map: edgeT, roughness: 0.9 });
const blockR = new THREE.Mesh(new THREE.BoxGeometry(0.995, 1, 0.995), [edgeMat, edgeMat, new THREE.MeshBasicMaterial({ visible: false }), edgeMat, edgeMat, edgeMat]); book.add(blockR);
const blockL = blockR.clone(); book.add(blockL);
const gutterT = canvasTex(256, 8, (c) => { const g = c.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(40,20,10,0)'); g.addColorStop(0.42, 'rgba(40,20,10,.22)'); g.addColorStop(0.5, 'rgba(40,20,10,.38)'); g.addColorStop(0.58, 'rgba(40,20,10,.22)'); g.addColorStop(1, 'rgba(40,20,10,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 8); });
const gutter = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: gutterT, transparent: true, depthWrite: false })); book.add(gutter);
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(2, 1).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.22 })); catcher.receiveShadow = true; book.add(catcher);
function updateBlocks() {
  const settledR = sheets.filter(s => s.t >= 1 && s.to === 0).length, settledL = sheets.filter(s => s.t >= 1 && s.to === Math.PI).length;
  const hR = Math.max(0.0005, settledR * EPS), hL = Math.max(0.0005, settledL * EPS);
  blockR.scale.y = hR; blockR.position.set(0.5, 0.004 + hR / 2, 0); blockR.visible = settledR > 1;
  blockL.scale.y = hL; blockL.position.set(-0.5, 0.004 + hL / 2, 0); blockL.visible = settledL > 1;
  const top = SHEETS * EPS + 0.008; gutter.position.y = top; gutter.visible = cur > 0 && cur < SHEETS && sheets.every(s => s.t >= 1);
  catcher.position.y = top + 0.001; catcher.position.x = cur === 0 ? 0.5 : cur === SHEETS ? -0.5 : 0; catcher.scale.x = cur === 0 || cur === SHEETS ? 0.5 : 1;
}

const loader = new THREE.TextureLoader();
const blank = canvasTex(4, 4, (c) => { c.fillStyle = '#fdf6e3'; c.fillRect(0, 0, 4, 4); });
let passportTex = null;
function drawPassport() {
  if (!passportTex) passportTex = canvasTex(1024, 1024, () => { });
  const c = passportTex.userData.canvas.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, '#7b2cbf'); g.addColorStop(1, '#3c1361'); c.fillStyle = g; c.fillRect(0, 0, 1024, 1024);
  c.fillStyle = '#ffd23f'; c.font = `700 70px ${FONT}`; c.textAlign = 'center'; c.fillText('My Number Garden Stars', 512, 120);
  c.font = `500 36px ${FONT}`; c.fillStyle = '#fff'; c.fillText(`${[...stars].filter(s => typeof s === 'number').length} of 18 chapter stars collected`, 512, 180);
  CHAPTERS.forEach((name, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 70 + col * 470, y = 230 + row * 82, got = stars.has(i + 1);
    c.fillStyle = got ? '#ffd23f' : 'rgba(255,255,255,.18)'; c.beginPath(); c.roundRect(x, y, 440, 66, 33); c.fill();
    c.fillStyle = got ? '#3c1361' : '#fff'; c.font = `700 30px ${FONT}`; c.textAlign = 'left';
    c.fillText((got ? '★ ' : '☆ ') + (i + 1) + '. ' + (name.length > 22 ? name.slice(0, 21) + '…' : name), x + 22, y + 44);
  });
  passportTex.needsUpdate = true;
}
drawPassport();
const texCache = new Map();
function tex(i) {
  if (FILES[i] === 'passport') return passportTex;
  if (!texCache.has(i)) {
    const t = loader.load('pages/p-' + String(FILES[i]).padStart(2, '0') + '.jpg', () => { t.needsUpdate = true; });
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); texCache.set(i, t);
  }
  return texCache.get(i);
}

const SEG = 24, EPS = 0.0022;
const sheets = [];
for (let s = 0; s < SHEETS; s++) {
  const pos = new Float32Array((SEG + 1) * 2 * 3), uvF = [], uvB = [], idx = [];
  for (let j = 0; j <= SEG; j++) for (let r = 0; r < 2; r++) { const d = j / SEG; pos.set([d, 0, r ? 0.5 : -0.5], (j * 2 + r) * 3); uvF.push(d, r ? 0 : 1); uvB.push(1 - d, r ? 0 : 1); }
  for (let j = 0; j < SEG; j++) { const a = j * 2, b = j * 2 + 1, c = j * 2 + 2, d = j * 2 + 3; idx.push(a, b, c, c, b, d); }
  const pa = new THREE.BufferAttribute(pos, 3);
  const gF = new THREE.BufferGeometry(); gF.setAttribute('position', pa); gF.setAttribute('uv', new THREE.Float32BufferAttribute(uvF, 2)); gF.setIndex(idx);
  const gB = new THREE.BufferGeometry(); gB.setAttribute('position', pa); gB.setAttribute('uv', new THREE.Float32BufferAttribute(uvB, 2)); gB.setIndex(idx);
  const mF = new THREE.MeshBasicMaterial({ map: blank, side: THREE.FrontSide, toneMapped: false }), mB = new THREE.MeshBasicMaterial({ map: blank, side: THREE.BackSide, toneMapped: false });
  const g = new THREE.Group(); const front = new THREE.Mesh(gF, mF), back = new THREE.Mesh(gB, mB);
  front.userData.page = 2 * s; back.userData.page = 2 * s + 1; g.add(front, back); book.add(g);
  sheets.push({ g, pa, mF, mB, angle: 0, from: 0, to: 0, t: 1, stiff: s === 0 || s === SHEETS - 1 });
}
function bend(sh, A, k) {
  const p = sh.pa.array;
  for (let j = 0; j <= SEG; j++) {
    const d = j / SEG; let x, y;
    if (Math.abs(k) < 1e-4) { x = d * Math.cos(A); y = d * Math.sin(A); }
    else { x = (Math.sin(A + k * d) - Math.sin(A)) / k; y = (Math.cos(A) - Math.cos(A + k * d)) / k; }
    for (let r = 0; r < 2; r++) { const o = (j * 2 + r) * 3; p[o] = x; p[o + 1] = y; }
  }
  sh.pa.needsUpdate = true; sh.g.children[0].geometry.computeBoundingSphere(); sh.g.children[1].geometry.computeBoundingSphere();
}
let cur = 0; // number of turned sheets
function refreshTextures() {
  sheets.forEach((sh, s) => {
    const near = Math.abs(s - cur) <= 2 || Math.abs(s + 1 - cur) <= 2 || s === 0 || s === SHEETS - 1;
    const f = near ? tex(2 * s) : blank, b = near ? tex(2 * s + 1) : blank;
    if (sh.mF.map !== f) { sh.mF.map = f; sh.mF.needsUpdate = true; }
    if (sh.mB.map !== b) { sh.mB.map = b; sh.mB.needsUpdate = true; }
  });
  for (const [i, t] of texCache) { const s = Math.floor(i / 2); if (Math.abs(s - cur) > 4 && s !== 0 && s !== SHEETS - 1) { t.dispose(); texCache.delete(i); } }
  // prefetch next/prev spread images
  [2 * cur + 1, 2 * cur + 2, 2 * cur - 2, 2 * cur - 3].forEach(i => { if (i >= 0 && i < N && FILES[i] !== 'passport') tex(i); });
}
function layoutSheets(dt) {
  sheets.forEach((sh, s) => {
    if (sh.t < 1) sh.t = Math.min(1, sh.t + dt / 0.85);
    const e = sh.t < 0.5 ? 4 * sh.t ** 3 : 1 - (-2 * sh.t + 2) ** 3 / 2;
    sh.angle = sh.from + (sh.to - sh.from) * e;
    const dir = Math.sign(sh.to - sh.from) || 1, flex = Math.sin(e * Math.PI) * (sh.stiff ? 0.15 : 1.5);
    bend(sh, sh.angle, -dir * flex);
    const turned = sh.angle / Math.PI;
    const yR = (SHEETS - s) * EPS, yL = s * EPS;
    sh.g.position.y = 0.004 + yR + (yL - yR) * turned + Math.sin(turned * Math.PI) * 0.01; // sits above the cover boards
  });
}
const bookShift = { x: -0.5 };
function setCur(n, instant = false) {
  n = Math.max(0, Math.min(SHEETS, n)); if (n === cur && !instant) return;
  const old = cur; cur = n; sfx.page(); stopSpeech();
  sheets.forEach((sh, s) => {
    const target = s < cur ? Math.PI : 0;
    if (sh.to !== target || instant) {
      const delay = Math.abs(s - (old < cur ? old : cur)) * 0.06;
      sh.from = sh.angle; sh.to = target; sh.t = instant ? 1 : -Math.min(delay, 0.8);
    }
  });
  tween(bookShift, { x: cur === 0 ? -0.5 : cur === SHEETS ? 0.5 : 0 }, 0.8, 'inOut');
  refreshTextures(); updateUI(); startExperience();
  try { location.hash = 'page-' + cur; } catch (e) { }
}
const next = () => setCur(cur + 1), prev = () => setCur(cur - 1);

/* ---------- experiences ---------- */
let active = null; // {ctx, host}
const expHost = new THREE.Group(); book.add(expHost);
let popOn = true;
function makeCtx(root, fx) {
  const ups = [];
  const ctx = {
    root, fx, alive: true, stars, done: false,
    say(t) { $('say').textContent = t; $('bubble').classList.add('show'); speak(t); },
    speak: (t, o) => speak(t, o),
    good(p) { sfx.good(); if (p) fx.emit(p, '#ffd23f', 40, 0.5); const w = ['Great job!', 'You got it!', 'Brilliant!', 'Yes!', 'Super smart!'][Math.floor(Math.random() * 5)]; $('say').textContent = w; speak(w); },
    oops() { sfx.oops(); $('say').textContent = 'Not quite, try again!'; speak('Try again!'); },
    award(id) { if (!stars.has(id)) { stars.add(id); saveStars(); drawPassport(); toast(typeof id === 'number' ? `★ Chapter ${id} star earned!` : '★ Bonus star earned!'); } },
    onUpdate(fn) { ups.push(fn); }, ups,
    next, goto: (n) => setCur(n), openLink: (it) => openLink(it), coverTex: tex(0),
  };
  const emit = fx.emit.bind(fx);
  fx.emit = (p, ...a) => emit(p.w ? root.worldToLocal(p.clone()) : p, ...a); // world positions (from wpos) become host-local
  return ctx;
}
function clearExperience() {
  stopVideo(); if (!active) return; active.ctx.alive = false; active.host.parent && active.host.parent.remove(active.host);
  active.host.traverse(o => { if (o.geometry) o.geometry.dispose(); }); active = null;
}
function startExperience(parent = expHost, spread = cur) {
  clearExperience();
  const key = SPREAD_EXP[spread]; $('bubble').classList.remove('show');
  if (!key || !popOn) { $('exptitle').textContent = key ? EXPERIENCES[key].title : ''; return; }
  const host = new THREE.Group(); parent.add(host);
  const fx = new FX(host); const ctx = makeCtx(host, fx);
  active = { ctx, host, key };
  $('exptitle').textContent = EXPERIENCES[key].title;
  try { EXPERIENCES[key].build(ctx); } catch (e) { console.error(e); }
  addMediaBar(host, key, spread);
  host.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
  host.scale.setScalar(0.001); const hs = 0.85; tween(host.scale, { x: hs, y: hs, z: hs }, 0.7, 'outBack');
}
function updateExperience(t, dt, cam) {
  if (!active) return; const { ctx, host } = active;
  ctx.ups.forEach(f => { try { f(t, dt); } catch (e) { } });
  ctx.fx.update(dt);
  const cp = cam.getWorldPosition(new THREE.Vector3());
  host.traverse(o => {
    if (o.userData.billboard) { const p = o.getWorldPosition(new THREE.Vector3()); const l = o.parent.worldToLocal(new THREE.Vector3(cp.x, p.y, cp.z)); o.lookAt(o.parent.localToWorld(l)); }
    if (o.userData.idle && !o.userData._idleOwned) o.userData.idle(t);
  });
}



/* ---------- music: Nia's songs play softly under the book and duck under narration ---------- */
const SONGS = [{ file: 'music/number-garden.mp3', title: 'Number Garden' }, { file: 'music/rocket-ship.mp3', title: 'Rocket Ship to Number Land' }];
const bgm = new Audio(); bgm.preload = 'none'; let song = 0, musicOn = true, musicVol = 0.32;
try { musicOn = localStorage.getItem('nia-music') !== 'off'; } catch (e) { }
function loadSong(i) { song = (i + SONGS.length) % SONGS.length; bgm.src = SONGS[song].file; $('songname').textContent = SONGS[song].title; }
bgm.addEventListener('ended', () => { loadSong(song + 1); if (musicOn) bgm.play().catch(() => { }); });
function setMusic(on) { musicOn = on; $('musicbtn').setAttribute('aria-pressed', on); try { localStorage.setItem('nia-music', on ? 'on' : 'off'); } catch (e) { }
  if (on) { if (!bgm.src) loadSong(0); bgm.play().catch(() => { }); toast('♪ Now playing: ' + SONGS[song].title); } else bgm.pause(); }
function nextSong() { loadSong(song + 1); if (musicOn) bgm.play().catch(() => { }); toast('♪ Now playing: ' + SONGS[song].title); }
function duckMusic(dt) { const talking = (window.speechSynthesis && speechSynthesis.speaking) || (video && !video.paused); const target = !sound.on ? 0 : talking ? musicVol * 0.25 : musicVol; bgm.volume += (target - bgm.volume) * Math.min(1, dt * 4); }

/* ---------- social and share ---------- */
// Add each channel's link here; channels with an empty url are hidden.
const SOCIAL = [
  { name: 'Instagram', url: '' }, { name: 'TikTok', url: '' }, { name: 'YouTube', url: '' }, { name: 'Facebook', url: '' },
  { name: 'PenGame Publishing', url: 'https://www.pengamepublishing.com' },
  { name: 'Get the book on Amazon', url: 'https://www.amazon.com/Number-Garden-Bright-Minds-Explorers/dp/B0GDCNBFYL/' },
];
const SITE_URL = 'https://mrimagemakers.github.io/NiaNumberGardenAR/';
async function shareBook() {
  const data = { title: 'Nia & the Number Garden AR Book', text: 'Read, play and explore the Number Garden in 3D and AR!', url: SITE_URL };
  try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(SITE_URL); toast('Link copied! Paste it anywhere to share.'); } catch (e) { showSheet('Share the book', 'Copy this link: <b>' + SITE_URL + '</b>'); }
}
function socialSheet() {
  const live = SOCIAL.filter(s => s.url);
  showSheet('Follow & share', live.map(s => `<a class="go" style="margin:0 6px 8px 0" href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join('') +
    `<br><button class="go" id="sharebtn2" style="border:0;margin-top:4px">Share this book</button>`);
  const b = document.getElementById('sharebtn2'); if (b) b.onclick = shareBook;
}

/* ---------- in-AR media bar: videos, games, links, replay ---------- */
const VIDEO = { cover: 'gate', welcome: 'gwenda', map: 'character', butterfly: 'flowers', gate: 'gate', friends: 'gate', bridge: 'flowers', carlo: 'count10',
  subby: 'snail', shapes: 'greenhouse', bloom: 'flowers', milly: 'moth', everywhere: 'character', pattern: 'flowers', measure: 'flowers', time: 'gwenda',
  theater: 'character', market: 'money', skippy: 'squirrel', meet_freddy_addie: 'gate', meet_gwenda_carlo: 'gwenda', meet_milly_skippy: 'moth', meet_butterfly: 'flowers', heart: 'gwenda', goodbye: 'leaving', dreams: 'night', draw: 'night', design: 'greenhouse', sumgame: 'count10',
  parade: 'character', passport: 'goodbye', finale: 'goodbye' };
const HUB = 'https://niasnumbergarden.shop';
const GAMES = [
  { page: 50, title: "Nia's Number Dash XR", sub: 'Race through math worlds', url: HUB },
  { page: 51, title: "Addie's Tool Slice Math Dash", sub: 'Slice tools that make the target', url: HUB, inBook: 24 },
  { page: 52, title: "Nia's Bloom & Sum", sub: 'Grow flowers, solve math', url: HUB, inBook: 25 },
  { page: 49, title: "Nia's Learning Hub", sub: 'Stories, videos, music, academy', url: HUB },
  { page: 8, title: "Nia's VR World", sub: 'Explore the Magic Number Garden in 3D and VR', url: 'https://mrimagemakers.github.io/NiasVRWorld/' },
  { page: 6, title: 'Bright Minds Explorers World', sub: 'K–5 learning world with 17 Number Garden games', url: 'https://mrimagemakers.github.io/brightmindsacademy/' },
];
const LINKS = [
  { page: 49, title: 'Activity Hub', sub: 'Games, read-alongs and activities for every chapter', url: HUB },
  { page: 48, title: 'Coloring & Workbook', sub: 'The companion coloring and workbook flipbook', url: 'https://heyzine.com/flip-book/8b4e688d51.html' },
  { page: 61, title: 'Get the Book', sub: 'Find Nia & the Number Garden on Amazon', url: 'https://www.amazon.com/Number-Garden-Bright-Minds-Explorers/dp/B0GDCNBFYL/' },
  { page: 4, title: 'PenGame Publishing', sub: 'More books from Bright Minds Explorers', url: 'https://www.pengamepublishing.com' },
];
function openLink(item) {
  const go = () => { $('sheet-a').href = item.url; $('sheet-a').textContent = 'Open ' + item.title; $('sheet-a').style.display = 'inline-flex';
    showSheet(item.title, item.sub + '.<br><small>' + item.url.replace(/^https?:\/\//, '') + '</small>'); };
  if (xrSession) { xrSession.end(); setTimeout(go, 400); } else if (mode === 'scan') { stopScan(); go(); } else go();
}
let video = null;
function stopVideo() { if (video) { video.pause(); video.removeAttribute('src'); video.load(); video = null; } }
function pageThumb(p) { const t = loader.load('pages/p-' + String(p).padStart(2, '0') + '.jpg'); t.colorSpace = THREE.SRGBColorSpace; return t; }
function addMediaBar(host, key, spread) {
  const bar = new THREE.Group(); bar.position.set(0, 1.2, -0.3); host.add(bar);
  const panel = new THREE.Group(); host.add(panel); // video screen / game cards appear here
  const clearPanel = () => { stopVideo(); panel.clear(); };
  const btn = (txt, x, fn, bg = '#ffffff') => { const b = labelSprite(txt, bg); b.position.set(x, 0, 0); b.userData.onTap = () => { sfx.pop(); fn(); }; bar.add(b); return b; };
  const items = [];
  const playClip = (name) => {
    clearPanel(); video = document.createElement('video');
    Object.assign(video, { src: 'videos/' + name + '.mp4', loop: true, playsInline: true, crossOrigin: 'anonymous', muted: !sound.on });
    video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
    const v = video; v.play().catch(() => { v.muted = true; v.dataset.needsUnmute = sound.on ? '1' : ''; v.play().catch(() => { }); });
    const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Group(); scr.userData.billboard = true; scr.position.set(0, 0.55, 0.12);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({ color: '#5a189a' })); scr.add(frame);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: vt })); sc.position.z = 0.002; scr.add(sc);
    sc.userData.onTap = () => { if (video.paused) video.play(); else video.pause(); };
    const x = labelSprite('✕ Close', '#ffd23f'); x.position.set(0, -0.38, 0.01); x.userData.onTap = clearPanel; scr.add(x);
    panel.add(scr); scr.scale.setScalar(0.01); tween(scr.scale, { x: 1, y: 1, z: 1 }, 0.5, 'outBack');
  };
  host.userData.watch = playClip;
  if (VIDEO[key]) items.push(['▶ Watch', () => playClip(VIDEO[key])]);
  items.push(['Games', () => cards(GAMES, 'Tap a game to play')]);
  items.push(['Links', () => cards(LINKS, 'Tap to open')]);
  items.push(['♪ Music', () => { if (!musicOn) setMusic(true); else nextSong(); }]);
  items.push(['Follow', () => socialSheet()]);
  items.push(['↺ Replay', () => { clearPanel(); startExperience(host.parent, spread); }]);
  const W = 0.33; items.forEach(([t, f], i) => btn(t, (i - (items.length - 1) / 2) * W, f, i === 0 && VIDEO[key] ? '#ffd23f' : '#ffffff'));
  function cards(list, title) {
    clearPanel();
    const g = new THREE.Group(); g.position.set(0, 0.5, 0.15); g.userData.billboard = true; panel.add(g);
    const h = labelSprite(title, '#5a189a', '#ffffff'); h.position.set(0, 0.32, 0); g.add(h);
    const cols = Math.min(4, list.length);
    list.forEach((it, i) => {
      const c = new THREE.Group(); const row = Math.floor(i / cols), inRow = Math.min(cols, list.length - row * cols); c.position.set((i % cols - (inRow - 1) / 2) * 0.36, -row * 0.62, 0);
      const img = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshBasicMaterial({ map: pageThumb(it.page) })); c.add(img);
      const border = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); border.position.z = -0.002; c.add(border);
      const cap = labelSprite(it.title.length > 18 ? it.title.slice(0, 17) + '…' : it.title, '#ffffff', '#3c1361', 0.032); cap.position.set(0, -0.21, 0.01); c.add(cap);
      img.userData.onTap = () => openLink(it);
      if (it.inBook) { const pb = labelSprite('Play here', '#1f9d55', '#ffffff', 0.032); pb.position.set(0, -0.27, 0.01); pb.userData.onTap = () => setCur(it.inBook); c.add(pb); }
      c.scale.setScalar(0.01); setTimeout(() => tween(c.scale, { x: 1, y: 1, z: 1 }, 0.45, 'outBack'), i * 80); g.add(c);
    });
    const x = labelSprite('✕ Close', '#ffd23f'); x.position.set(0, -0.36 - Math.floor((list.length - 1) / cols) * 0.62, 0.01); x.userData.onTap = clearPanel; g.add(x);
    if (list.length > cols) g.position.y += 0.31;
  }
}
function labelSprite(text, bg = '#ffffff', fg = '#3c1361', size = 0.056) {
  const fs = 64, pad = 22, c0 = document.createElement('canvas').getContext('2d'); c0.font = `700 ${fs}px ${FONT}`;
  const w = Math.ceil(c0.measureText(text).width + pad * 2), h = fs + pad * 1.4;
  const t = canvasTex(w, h, (c) => { c.beginPath(); c.roundRect(3, 3, w - 6, h - 6, h / 2 - 3); c.fillStyle = bg; c.fill(); c.lineWidth = 6; c.strokeStyle = '#5a189a'; c.stroke(); c.font = `700 ${fs}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg; c.fillText(text, w / 2, h / 2 + 3); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); const k = size / fs; s.scale.set(w * k, h * k, 1); s.renderOrder = 15; return s;
}

// iPad only lets a video play with sound from the end of a tap, so a clip started on touch-down
// begins muted and gets its sound back as the finger lifts.
function unmuteVideo() {
  if (!video || video.dataset.needsUnmute !== '1' || !sound.on) return;
  const v = video; v.dataset.needsUnmute = ''; v.muted = false;
  v.play().catch(() => { v.muted = true; v.play().catch(() => { }); });
}
['pointerup', 'touchend', 'click'].forEach(ev => addEventListener(ev, unmuteVideo, true));

/* ---------- input: taps, drags, XR controllers ---------- */
const ray = new THREE.Raycaster();
function findHandler(o, key) { while (o) { if (o.userData[key]) return o; o = o.parent; } return null; }
function pick(rc, roots) {
  const hits = rc.intersectObjects(roots, true).filter(h => h.object.visible !== false && !(h.object.isPoints));
  for (const h of hits) { const t = findHandler(h.object, 'onTap') || findHandler(h.object, 'onDrag'); if (t) return { h, t }; }
  return { h: hits[0] || null, t: null };
}
let dragTarget = null, downAt = null;
function pointerRay(e, cam, el) { const r = el.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), cam); ray.camera = cam; return ray; }
function handleDown(rc, roots) {
  sfx.unlock();
  const { h, t } = pick(rc, roots);
  if (t && t.userData.onDrag) { dragTarget = t; t.userData.onDrag(h, 'start'); return true; }
  if (t && t.userData.onTap) { const r = findHandler(h.object, 'react'); if (r) r.userData.react(Math.random() < 0.6 ? 'wave' : 'cheer'); t.userData.onTap(h); return true; }
  return false;
}
function handleMove(rc) { if (!dragTarget) return; const hits = rc.intersectObject(dragTarget, true); dragTarget.userData.onDrag(hits[0] || null, 'move'); }
function handleUp() { if (dragTarget) { dragTarget.userData.onDrag(null, 'end'); dragTarget = null; } }
function pageTapFallback(rc) { // tap a page's outer half to turn it
  const hits = rc.intersectObjects(sheets.map(s => s.g), true); if (!hits.length) return;
  const lp = book.worldToLocal(hits[0].point.clone()); if (lp.x > 0.55) next(); else if (lp.x < -0.55) prev();
}
canvas.addEventListener('pointerdown', (e) => {
  if (mode === 'xr') return;
  const rc = pointerRay(e, camera, canvas);
  downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  if (handleDown(rc, [expHost, navGroup])) { controls.enabled = false; canvas.setPointerCapture(e.pointerId); }
}, { capture: true });
canvas.addEventListener('pointermove', (e) => { if (dragTarget) handleMove(pointerRay(e, camera, canvas)); });
canvas.addEventListener('pointerup', (e) => {
  const wasDrag = !!dragTarget; handleUp(); controls.enabled = mode !== 'xr' && !gyroLive();
  if (!wasDrag && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8 && performance.now() - downAt.t < 350 && (controls.enabled || gyroLive())) pageTapFallback(pointerRay(e, camera, canvas));
  downAt = null;
});

// 3D page-turn arrows (work in every mode, including VR where there is no HTML)
const navGroup = new THREE.Group(); book.add(navGroup);
function arrow(dir) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = '#7b2cbf'; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = '#fff'; c.stroke(); c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(64 + dir * 26, 64); c.lineTo(64 - dir * 16, 38); c.lineTo(64 - dir * 16, 90); c.fill(); }), depthWrite: false }));
  s.scale.setScalar(0.14); s.position.set(dir * 1.13, 0.08, 0.38); s.userData.onTap = () => dir > 0 ? next() : prev(); navGroup.add(s); return s;
}
const navR = arrow(1), navL = arrow(-1);

/* ---------- modes: book (default), AR (WebXR), VR (WebXR), camera window, scan printed book ---------- */
let mode = 'book', xrSession = null, hitSource = null, placed = false;
const reticle = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
const controllers = [0, 1].map(i => {
  const c = renderer.xr.getController(i); scene.add(c);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: '#ffd23f' }));
  line.scale.z = 3; line.visible = false; c.add(line); c.userData.line = line;
  const ctrlRay = () => { const m = new THREE.Matrix4().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(m); ray.camera = renderer.xr.getCamera(); return ray; };
  c.addEventListener('selectstart', () => {
    if (mode !== 'xr') return;
    if (xrKind === 'ar' && !placed) { if (reticle.visible) { bookRoot.position.setFromMatrixPosition(reticle.matrix); const cp = renderer.xr.getCamera().getWorldPosition(new THREE.Vector3()); bookRoot.rotation.y = Math.atan2(cp.x - bookRoot.position.x, cp.z - bookRoot.position.z); bookRoot.visible = true; placed = true; reticle.visible = false; toast('Book placed! Tap the magic to play.'); startExperience(); } return; }
    const rc = ctrlRay(); c.userData.selecting = true;
    if (!handleDown(rc, [expHost, navGroup])) pageTapFallback(rc);
  });
  c.addEventListener('selectend', () => { c.userData.selecting = false; handleUp(); });
  c.userData.ray = ctrlRay;
  return c;
});
let xrKind = null;
$('ui').addEventListener('beforexrselect', (e) => { if (e.target.closest('button')) e.preventDefault(); });
async function startXR(kind) {
  if (!navigator.xr) return notSupported(kind);
  if (mode === 'camera') stopCamera();
  try {
    const opts = kind === 'ar'
      ? { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root: $('ui') } }
      : { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
    const session = await navigator.xr.requestSession(kind === 'ar' ? 'immersive-ar' : 'immersive-vr', opts);
    xrSession = session; xrKind = kind; mode = 'xr'; placed = false;
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session);
    document.body.classList.add('xr', 'xr-' + kind);
    if (kind === 'ar') {
      world.visible = false; scene.fog = null; scene.background = null; bookRoot.scale.setScalar(0.24); bookRoot.visible = false;
      session.requestReferenceSpace('viewer').then(vs => session.requestHitTestSource({ space: vs })).then(s => hitSource = s).catch(() => { });
      toast('Move your phone slowly, then tap the yellow ring to place the book.');
    } else {
      world.visible = true; bookRoot.scale.setScalar(0.45); bookRoot.position.set(0, 0.95, -0.55); bookRoot.rotation.set(0.35, 0, 0);
      controllers.forEach(c => c.userData.line.visible = true);
    }
    session.addEventListener('end', endXR);
  } catch (e) { console.warn(e); notSupported(kind, e); }
}
function endXR() {
  mode = 'book'; xrSession = null; hitSource = null; reticle.visible = false; world.visible = true; scene.fog = worldFog;
  bookRoot.position.set(0, 0, 0); bookRoot.rotation.set(0, 0, 0); bookRoot.scale.setScalar(1); bookRoot.visible = true;
  controllers.forEach(c => c.userData.line.visible = false);
  document.body.classList.remove('xr', 'xr-ar', 'xr-vr'); resize();
}
function notSupported(kind, e) {
  const framed = window.top !== window.self;
  showSheet(kind === 'ar' ? 'AR needs a phone or headset' : 'VR needs a headset',
    (framed ? 'This preview runs inside a protected frame that blocks the camera and WebXR. Open the published book on your own site (niasnumbergarden.shop) to use it.<br><br>' : '') +
    (kind === 'ar' ? 'Room-scale AR works in Chrome on Android and on Meta Quest. On iPad and iPhone, tap <b>AR</b> or <b>Camera</b> and allow the camera and motion, or use <b>Scan my book</b> with your printed copy.' : 'VR works in the Meta Quest browser and other WebXR headsets.'));
}

// Camera "magic window": the garden floats over the live camera (iPad and iPhone friendly).
// Where the device has a gyroscope, the book stays put in the room as you move the tablet around it.
let camStream = null, gyro = null;
const camSaved = { pos: new THREE.Vector3(), q: new THREE.Quaternion() };
const gq = { e: new THREE.Euler(), dev: new THREE.Quaternion(), yaw: new THREE.Quaternion(), scr: new THREE.Quaternion(),
  fix: new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), z: new THREE.Vector3(0, 0, 1), y: new THREE.Vector3(0, 1, 0), dir: new THREE.Vector3(0, 0.62, 1).normalize() };
function gyroLive() { return mode === 'camera' && !!(gyro && gyro.data); }
async function askMotion() { // iPad and iPhone ask for permission; it must be the first thing a tap does
  const D = window.DeviceOrientationEvent; if (!D) return false;
  if (typeof D.requestPermission === 'function') { try { return (await D.requestPermission()) === 'granted'; } catch (e) { return false; } }
  return true;
}
function screenAngle() { return typeof window.orientation === 'number' ? window.orientation : (screen.orientation && screen.orientation.angle) || 0; }
function onOrient(e) {
  if (!gyro || e.alpha == null || e.beta == null) return;
  if (!gyro.data) { controls.enabled = false; document.body.classList.add('gyro'); toast('Move around: the book stays on your table. Pinch to zoom.'); }
  gyro.data = { a: e.alpha, b: e.beta, g: e.gamma || 0 };
}
function applyGyro() {
  const d = gyro.data, R = THREE.MathUtils.degToRad;
  gq.e.set(R(d.b), R(d.a), -R(d.g), 'YXZ'); gq.dev.setFromEuler(gq.e).multiply(gq.fix).multiply(gq.scr.setFromAxisAngle(gq.z, -R(screenAngle())));
  if (gyro.heading == null) { // put the book straight ahead of wherever the tablet points first
    let f = new THREE.Vector3(0, 0, -1).applyQuaternion(gq.dev);
    if (Math.hypot(f.x, f.z) < 0.35) f = new THREE.Vector3(0, 1, 0).applyQuaternion(gq.dev); // held flat over the table: the top edge points ahead
    gyro.heading = Math.atan2(-f.x, -f.z);
  }
  camera.quaternion.copy(gq.yaw.setFromAxisAngle(gq.y, -gyro.heading)).multiply(gq.dev);
  camera.position.copy(controls.target).addScaledVector(gq.dir, gyro.dist);
}
const touchGap = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
let pinch = null;
canvas.addEventListener('touchstart', (e) => { if (gyroLive() && e.touches.length === 2) pinch = { d: touchGap(e), k: gyro.dist }; }, { passive: true });
canvas.addEventListener('touchmove', (e) => { if (pinch && gyroLive() && e.touches.length === 2) gyro.dist = THREE.MathUtils.clamp(pinch.k * pinch.d / touchGap(e), 1.1, 4.5); }, { passive: true });
canvas.addEventListener('touchend', (e) => { if (e.touches.length < 2) pinch = null; });
function setCamButtons(on) { $('cam').setAttribute('aria-pressed', on); if ($('ar').dataset.ok !== 'true') $('ar').setAttribute('aria-pressed', on); }
let camBusy = false;
async function startCamera() {
  if (camBusy || mode === 'camera') return; camBusy = true;
  const motionOk = await askMotion(); // ask before the camera so the iPad still counts it as part of the tap
  try {
    if (mode === 'scan') stopScan();
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    const v = $('camvid'); v.muted = true; v.setAttribute('playsinline', ''); v.srcObject = camStream; await v.play();
    camSaved.pos.copy(camera.position); camSaved.q.copy(camera.quaternion);
    mode = 'camera'; world.visible = false; scene.fog = null; document.body.classList.add('camera'); setCamButtons(true);
    gyro = { data: null, heading: null, dist: 2.3 };
    if (motionOk) addEventListener('deviceorientation', onOrient);
    toast(motionOk ? 'Point your camera at a table. Tap the magic to play!' : 'Drag to look around the pop-up. Tap the magic to play!');
    if (!motionOk && IS_IOS) setTimeout(() => toast('Tip: allow Motion & Orientation so the book stays in your room.'), 3400);
  } catch (e) {
    console.warn(e); if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null;
    showSheet('Camera not available', (window.top !== window.self ? 'This preview blocks the camera. ' : '') + 'Open the book in Safari or Chrome and allow camera access to see the garden pop up in your room. On iPad: Settings › Safari › Camera › Allow.');
  } finally { camBusy = false; }
}
function stopCamera() {
  removeEventListener('deviceorientation', onOrient);
  if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; $('camvid').srcObject = null;
  const was = mode === 'camera'; gyro = null; pinch = null; document.body.classList.remove('camera', 'gyro'); setCamButtons(false);
  if (was) { mode = 'book'; world.visible = true; scene.fog = worldFog; camera.position.copy(camSaved.pos); camera.quaternion.copy(camSaved.q); controls.enabled = true; controls.update(); }
}
$('recenter').onclick = () => { if (gyro) { gyro.heading = null; gyro.dist = 2.3; } };

// Scan the printed book: image tracking on the cover and 20 illustrated pages
const TARGET_SPREAD = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 31];
let mind = null;
let scanCam = null;
$('scan').addEventListener('pointerdown', (e) => { if (!active || !scanCam) return; const rc = pointerRay(e, scanCam, $('scan')); handleDown(rc, [active.host]); });
$('scan').addEventListener('pointermove', (e) => { if (dragTarget && scanCam) handleMove(pointerRay(e, scanCam, $('scan'))); });
$('scan').addEventListener('pointerup', handleUp);
async function startScan() {
  if (mode === 'camera') stopCamera(); // an iPad can only feed one camera view at a time
  showSheet('Getting the magic ready…', 'Loading the page tracker. Point your camera at the cover or any story picture in your printed book.');
  try {
    const { MindARThree } = await import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js');
    hideSheet(); stopSpeech(); clearExperience();
    $('scan').style.display = 'block'; document.body.classList.add('scanning'); mode = 'scan';
    const tsrc = URL.createObjectURL(new Blob([b64ToBuf((await import('./targets.js')).default)]));
    mind = new MindARThree({ container: $('scan'), imageTargetSrc: tsrc, maxTrack: 1, uiLoading: 'yes', uiScanning: 'yes', filterMinCF: 0.0001, filterBeta: 0.001 });
    const { renderer: mr, scene: ms, camera: mc } = mind; scanCam = mc;
    mr.setPixelRatio(Math.min(devicePixelRatio, IS_IOS ? 1.5 : 2));
    mr.outputColorSpace = THREE.SRGBColorSpace;
    ms.environment = new THREE.PMREMGenerator(mr).fromScene(new RoomEnvironment(), 0.04).texture; ms.environmentIntensity = 0.6;
    ms.add(new THREE.HemisphereLight('#fff7e0', '#5c8a3a', 1.4)); const dl = new THREE.DirectionalLight('#fff', 1.4); dl.position.set(0, 1, 2); ms.add(dl);
    TARGET_SPREAD.forEach((spread, i) => {
      const anchor = mind.addAnchor(i);
      const holder = new THREE.Group(); holder.rotation.x = Math.PI / 2; anchor.group.add(holder); // page plane -> pop-up space
      anchor.onTargetFound = () => { sfx.good(); cur = spread; updateUI(); startExperience(holder, spread); };
      anchor.onTargetLost = () => { };
    });
    await mind.start();
    const clock2 = new THREE.Clock();
    mr.setAnimationLoop(() => { const dt = Math.min(0.05, clock2.getDelta()); updateTweens(dt); updateExperience(clock2.elapsedTime, dt, mc); mr.render(ms, mc); });
  } catch (e) { console.warn(e); stopScan(); showSheet('Camera not available', (window.top !== window.self ? 'This preview blocks the camera. ' : '') + 'Open the book on niasnumbergarden.shop, allow the camera, and point it at your printed book.'); }
}
function stopScan() {
  try { if (mind) { mind.renderer.setAnimationLoop(null); mind.stop(); } } catch (e) { }
  try { if (mind) { mind.renderer.dispose(); mind.renderer.forceContextLoss(); mind.renderer.domElement.remove(); } } catch (e) { } // free the GPU so a second scan still works on iPad
  mind = null; scanCam = null; $('scan').innerHTML = ''; $('scan').style.display = 'none'; document.body.classList.remove('scanning'); mode = 'book'; startExperience();
}

/* ---------- UI ---------- */
function updateUI() {
  const l = 2 * cur - 1, r = 2 * cur;
  const label = cur === 0 ? 'Cover' : cur === SHEETS ? 'Back cover' : `Pages ${pdfPage(l)}${FILES[r] && FILES[r] !== 'passport' ? '–' + pdfPage(r) : ''}`;
  $('pg').textContent = label;
  $('prev').disabled = cur === 0; $('next').disabled = cur === SHEETS;
  $('read').disabled = !narrationFor(cur);
  $('starcount').textContent = [...stars].filter(s => typeof s === 'number').length;
  navL.visible = cur > 0; navR.visible = cur < SHEETS;
}
function narrationFor(c) { const l = 2 * c - 1, r = 2 * c; return [TEXT[FILES[l]], TEXT[FILES[r]]].filter(Boolean).join(' '); }
let toastT;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200); }
function showSheet(h, html) { $('sheet-h').textContent = h; $('sheet-b').innerHTML = html; $('sheet').classList.add('show'); }
function hideSheet() { $('sheet').classList.remove('show'); $('sheet-a').style.display = 'none'; }
$('sheet-x').onclick = hideSheet;
$('prev').onclick = prev; $('next').onclick = next;
$('read').onclick = () => { const t = narrationFor(cur); if (t) { $('say').textContent = t.length > 160 ? t.slice(0, 157) + '…' : t; $('bubble').classList.add('show'); speak(t, { rate: 0.9, pitch: 1.1 }); } };
$('magic').onclick = () => { popOn = !popOn; $('magic').setAttribute('aria-pressed', popOn); if (popOn) startExperience(); else { clearExperience(); $('bubble').classList.remove('show'); } };
$('look').onclick = () => { // swing the camera overhead to read the printed page
  const top = $('look').getAttribute('aria-pressed') !== 'true'; $('look').setAttribute('aria-pressed', top);
  const p = top ? new THREE.Vector3(0, 2.35, 0.25) : new THREE.Vector3(0, 1.75, 2.35);
  tween(camera.position, { x: p.x, y: p.y, z: p.z }, 0.9, 'inOut'); if (top && active) active.host.visible = false; if (!top && active) active.host.visible = true;
};
$('snd').onclick = () => { sound.on = !sound.on; $('snd').setAttribute('aria-pressed', sound.on); if (!sound.on) stopSpeech(); if (video) { video.muted = !sound.on; if (sound.on) video.dataset.needsUnmute = ''; } };
$('map').onclick = () => setCur(3);
$('musicbtn').onclick = () => setMusic(!musicOn);
$('songname').onclick = () => nextSong();
$('follow').onclick = socialSheet;
$('games').onclick = () => { const all = [...GAMES, ...LINKS.filter(l => l.title !== "Activity Hub")];
  $('sheet-a').style.display = 'none';
  showSheet('Games & links', all.map(g => `<a class="go" style="margin:0 6px 8px 0" href="${g.url}" target="_blank" rel="noopener">${g.title}</a>`).join('') + '<br><small>Inside the book, tap Games or Links under any pop-up.</small>'); };
$('bubble-x').onclick = () => { $('bubble').classList.remove('show'); stopSpeech(); };
$('ar').onclick = async () => {
  if (mode === 'xr') return xrSession.end();
  if (mode === 'camera') return stopCamera();
  // No room-scale WebXR (iPad, iPhone, laptops): use the camera AR window instead of an error
  if (!navigator.xr || $('ar').dataset.ok === 'false') return startCamera();
  if ($('ar').dataset.ok !== 'true' && !(await xrSupport).ar) return startCamera();
  startXR('ar');
};
$('vr').onclick = () => { if (mode === 'xr') return xrSession.end(); startXR('vr'); };
$('cam').onclick = () => mode === 'camera' ? stopCamera() : startCamera();
$('scanbtn').onclick = () => mode === 'scan' ? stopScan() : startScan();
$('exitscan').onclick = stopScan;
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); });
// detect XR support to label buttons honestly
const xrSupport = (async () => {
  let ar = false, vr = false;
  try { if (navigator.xr) { ar = await navigator.xr.isSessionSupported('immersive-ar'); vr = await navigator.xr.isSessionSupported('immersive-vr'); } } catch (e) { }
  $('ar').dataset.ok = ar; $('vr').dataset.ok = vr;
  const camOk = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!vr) $('vr').classList.add('dim'); if (!ar && !camOk) $('ar').classList.add('dim');
  if (!ar && camOk) $('ar').setAttribute('aria-label', 'See the book in your room through the camera');
  return { ar, vr };
})();

window.__nia = { get active() { return active; }, setCur, camera, controls, renderer, scene };
/* ---------- loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight; if (renderer.xr.isPresenting) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  const portrait = h > w; camera.fov = portrait ? 62 : 42; camera.updateProjectionMatrix();
  controls.minDistance = portrait ? 1.6 : 1;
  if (!gyroLive() && (!resize.done || resize.portrait !== portrait)) { // frame the open spread for this screen shape
    const d = camera.position.clone().sub(controls.target); d.setLength(portrait ? 3.4 : 2.95); camera.position.copy(controls.target).add(d);
    resize.done = true; resize.portrait = portrait;
  }
}
addEventListener('resize', resize); resize();
const clock = new THREE.Clock();
renderer.setAnimationLoop((time, frame) => {
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (mode === 'scan') return;
  updateTweens(dt); layoutSheets(dt); duckMusic(dt);
  book.position.x = bookShift.x; boardL.visible = cur > 0; boardR.visible = cur < SHEETS; updateBlocks();
  if (world.userData.grass) world.userData.grass.userData.tick(t);
  if (world.userData.clouds) world.userData.clouds.forEach(c => { c.position.x += c.userData.drift * dt; if (c.position.x > 24) c.position.x = -24; });
  if (world.userData.flutter) world.userData.flutter.forEach(b => { const ph = t * 0.35 + b.userData.ph, r = b.userData.r; b.position.set(Math.cos(ph) * r, 0.35 + Math.sin(ph * 2.3) * 0.25, Math.sin(ph) * r - 0.3); b.rotation.y = -ph; b.userData.flap(t, 10); });
  if (world.userData.pollen) { world.userData.pollen.rotation.y = t * 0.02; world.userData.pollen.position.y = Math.sin(t * 0.5) * 0.05; }
  expHost.position.set(cur === 0 ? 0.5 : cur === SHEETS ? -0.5 : 0, SHEETS * EPS + 0.024, 0);
  floaters.forEach(f => { f.position.y += Math.sin(t + f.userData.ph) * 0.002; });
  if (frame && hitSource && xrKind === 'ar' && !placed) {
    const res = frame.getHitTestResults(hitSource);
    if (res.length) { const pose = res[0].getPose(renderer.xr.getReferenceSpace()); reticle.visible = true; reticle.matrix.fromArray(pose.transform.matrix); } else reticle.visible = false;
  }
  if (mode === 'xr') controllers.forEach(c => { if (c.userData.selecting && dragTarget) handleMove(c.userData.ray()); });
  const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camera;
  updateExperience(t, dt, cam);
  if (gyroLive()) applyGyro(); else if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

/* ---------- boot ---------- */
(async () => {
  await Promise.race([document.fonts.load('700 40px Fredoka'), new Promise(r => setTimeout(r, 1500))]);
  $('loadmsg').textContent = 'Waking up Nia, Addie, Freddy and Gwenda…';
  await Promise.race([loadModels(), new Promise(r => setTimeout(r, 45000))]);
  let start = 0; const m = /page-(\d+)/.exec(location.hash); if (m) start = +m[1];
  sheets.forEach((sh, s) => { sh.angle = sh.from = sh.to = s < start ? Math.PI : 0; });
  cur = start; bookShift.x = cur === 0 ? -0.5 : cur === SHEETS ? 0.5 : 0;
  refreshTextures(); updateUI(); layoutSheets(0);
  $('loading').classList.add('done');
  $('start').onclick = () => { sfx.unlock(); $('loading').remove(); startExperience(); loadSong(0); bgm.volume = 0; if (musicOn) setMusic(true); $('musicbtn').setAttribute('aria-pressed', musicOn); };
  $('start').disabled = false; $('start').textContent = 'Open the book';
})();
}
