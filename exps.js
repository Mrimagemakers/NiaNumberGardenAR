// The AR experiences — one per chapter, following the "AR Experience" column of the book's table of contents.
import * as THREE from 'three';
import { makeMushroom, makeBush, makeRock } from './garden.js';
import { makeShapeBloom, makePot, makeGreenhouse, makeSwingSet, makeSun, makeKite, makeFlowerClock, makeBed, makeChalkboardEasel, makeMarketStall } from './props.js';
import {
  PAL, NUM_COLORS, toon, glowMat, sph, cyl, box, label, chip, num3D, makeNia, makeAddie, makeFreddy, makeCarlo,
  makeSubby, makeMilly, makeButterfly8, makeSkippy, makeGwenda, makeHeart, makeFlower, makeTree, makeGate, makeLily,
  shapeToken, makeCoin, winged, canvasTex, tween, wait, rand, shuffle, popIn, sfx
} from './core.js';

export const CHAPTERS = [
  'The Butterfly and the Gate', 'Welcome to the Number Garden', 'The Addition Bridge and Fraction Field', 'Wake Up Carlo',
  'Help Subby the Snail Subtract', 'The Shape Greenhouse', 'The Garden Blooms Brighter', 'Milly and the Multiplication Trees',
  'Math is Everywhere!', 'The Pattern Pond', 'The Measurement Meadow', 'The Time Flower', 'The Market of Money',
  'Skippy and Skip Counting', 'The Heart of the Garden', 'Goodbye for Now', 'Math Dreams', "Nia's Reflection"];
export const CH_SPREAD = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

/* ---------- shared helpers ---------- */
const S = 0.3; // character scale on a page
function place(o, x, y, z, s = S, ry = 0) { o.position.set(x, y, z); o.scale.setScalar(s); o.rotation.y = ry; o.userData.baseScale = new THREE.Vector3(s, s, s); return o; }
function tappable(o, fn) { o.userData.onTap = fn; return o; }
function hop(o, h = 0.08) { const y = o.position.y; tween(o.position, { y: y + h }, 0.18, 'out', () => tween(o.position, { y }, 0.25, 'out')); }
function shake(o) { const x = o.position.x; tween(o.position, { x: x + 0.02 }, 0.06, 'linear', () => tween(o.position, { x: x - 0.02 }, 0.08, 'linear', () => tween(o.position, { x }, 0.06, 'linear'))); }
function remove(o, after = 0) { setTimeout(() => tween(o.scale, { x: 0.0001, y: 0.0001, z: 0.0001 }, 0.3, 'out', () => o.parent && o.parent.remove(o)), after * 1000); }
function wpos(o) { const v = o.getWorldPosition(new THREE.Vector3()); v.w = true; return v; }
function stageTex(color) { return canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 20, 128, 128, 128); const col = new THREE.Color(color); const rgb = `${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0}`; g.addColorStop(0, `rgba(${rgb},.45)`); g.addColorStop(0.7, `rgba(${rgb},.28)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; const a = Math.random() * 6.28, r = Math.random() * 110; c.beginPath(); c.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 1 + Math.random() * 2, 0, 7); c.fill(); } }); }
function grass(ctx, w = 1.7, d = 0.85, color = '#5fbf4a') {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: stageTex(color), transparent: true, depthWrite: false })); // soft glow so the printed page shows through
  m.scale.set(w / 2, 1, d / 2); m.position.y = 0.01; ctx.root.add(m); popIn(m); return m;
}
function sprinkle(ctx, n = 7, w = 1.5, d = 0.7) {
  for (let i = 0; i < 2; i++) { const b = makeBush(0.16, NUM_COLORS[(i * 3 + 1) % 10]); b.position.set((i ? 1 : -1) * w * 0.48, 0.01, -d * 0.35); ctx.root.add(b); popIn(b, 0.3 + i * 0.1); }
  const r = makeRock(0.05); r.position.set(w * 0.3, 0.015, d * 0.38); ctx.root.add(r);
  for (let i = 0; i < n; i++) { const f = makeFlower(NUM_COLORS[i % 10], 0.08 + Math.random() * 0.08); f.position.set((Math.random() - 0.5) * w, 0.02, (Math.random() - 0.5) * d); f.scale.setScalar(0.8); ctx.root.add(f); popIn(f, 0.2 + i * 0.04, 0.8); }
}
// Ask a question with tappable answer chips. Resolves when the child taps the right one.
export function ask(ctx, q, choices, answer, o = {}) {
  return new Promise((resolve) => {
    const y = o.y ?? 0.62, z = o.z ?? 0.12, sp = o.spread ?? 0.5;
    const ql = label(q, { size: o.qsize || 0.075 }); ql.position.set(o.x || 0, y + 0.16, z); ctx.root.add(ql); popIn(ql);
    ctx.say(o.say || q.replace(/\?$/, '') + '?');
    const chips = [];
    choices.forEach((c, i) => {
      const x = (o.x || 0) + (choices.length === 1 ? 0 : -sp / 2 + sp * i / (choices.length - 1));
      const ch = chip(c, NUM_COLORS[(i * 3 + 2) % 10], () => {
        if (!ctx.alive || ch.userData.done) return;
        if (String(c) === String(answer)) {
          chips.forEach(k => { k.userData.done = true; remove(k, k === ch ? 0.4 : 0); });
          hop(ch, 0.06); remove(ql, 0.4); ctx.good(wpos(ch)); setTimeout(resolve, 600);
        } else { shake(ch); ctx.oops(); }
      }, o.chip || 0.13);
      ch.position.set(x, y, z); ctx.root.add(ch); popIn(ch, 0.1 + i * 0.08); chips.push(ch);
    });
  });
}
function choicesFor(ans, n = 3, lo = 0, hi = 20) {
  const s = new Set([ans]); let guard = 0;
  while (s.size < n && guard++ < 50) { const v = ans + rand(-3, 3); if (v >= lo && v <= hi) s.add(v); }
  return shuffle([...s]);
}
function finish(ctx, id, msg) { ctx.award(id); ctx.say(msg); ctx.fx.emit(new THREE.Vector3(0, 0.5, 0), '#ffd23f', 80, 0.9, -0.8, 1.6); sfx.win(); }

/* =====================================================================
   Experiences: build(ctx) sets up content in ctx.root and runs its flow.
   ===================================================================== */

/* ---------- character spotlights for the character-sheet pages ---------- */
const SHORT = { butterfly: 'the Number Eight Butterfly' };
const first = (k) => SHORT[k] || CAST[k][2].split(' ')[0];
const CAST = {
  nia: [() => makeNia(), 0.42, 'Nia Brown', "I'm Nia! I ask big questions, count stars at night, and carry my sparkle-green number wand.", ['What is 4 + 4?', 8]],
  freddy: [() => makeFreddy(), 0.42, 'Freddy the Fraction Fox', "I'm Freddy! I share things into equal parts. Halves, quarters, and fair shares are my favorite.", ['What is half of 8?', 4]],
  addie: [() => makeAddie(), 0.4, 'Addie the Addition Ant', "I'm Addie! I build things by putting numbers together, one piece at a time.", ['What is 3 + 4?', 7]],
  gwenda: [() => makeGwenda(), 0.48, 'Gwenda the Fairy', "I'm Gwenda, keeper of the Number Garden's magic. My wings sparkle with plus, minus, times, and divide!", ['How many sides does a triangle have?', 3]],
  carlo: [() => makeCarlo(10), 0.42, 'Carlo the Counting Caterpillar', "I'm Carlo! I have ten segments, and I love counting from one to ten.", ['What number comes after 7?', 8]],
  milly: [() => makeMilly(), 0.75, 'Milly the Multiplication Moth', "I'm Milly! My wings glow with dots in neat rows. Multiplication is counting in groups!", ['2 rows of 4 dots. How many?', 8]],
  skippy: [() => makeSkippy(), 0.42, 'Skippy the Squirrel', "I'm Skippy! I skip count by twos, fives, and tens as I hop from branch to branch.", ['Count by 5s: 5, 10, 15, ?', 20]],
  butterfly: [() => makeButterfly8(0.45), 1, 'The Number Eight Butterfly', "I'm the Number Eight Butterfly! I led Nia to the magic gate. Follow the magic!", ['What is 4 + 4?', 8]],
};
function spotlight(keys, extra) {
  return { title: 'Meet ' + keys.map(k => first(k).replace(/^the /, 'the ')).join(' & '), async build(ctx) {
    grass(ctx, 1.7, 0.85, '#ffd23f'); sprinkle(ctx, 5);
    const chars = keys.map((k, i) => {
      const [mk, s, name, line] = CAST[k]; const x = keys.length === 1 ? -0.3 : (i ? 0.38 : -0.38);
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.05, 40), new THREE.MeshPhysicalMaterial({ color: ['#7b2cbf', '#1f9d55'][i], roughness: 0.3, clearcoat: 1 })); ped.position.set(x, 0.025, 0); ctx.root.add(ped);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.008, 8, 48), new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.9, roughness: 0.2 })); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.05, 0); ctx.root.add(rim);
      const c = mk(); c.position.set(x, k === 'milly' || k === 'butterfly' ? 0.4 : 0.05, 0); c.scale.setScalar(s); c.userData.baseScale = c.scale.clone(); ctx.root.add(c); popIn(c, i * 0.2, s);
      const plate = label(name, { size: 0.045, bg: '#ffffff' }); plate.position.set(x, -0.0 + 0.11, 0.22); ctx.root.add(plate);
      let met = false;
      tappable(c, () => { hop(c, 0.06); c.userData.react && c.userData.react('wave'); ctx.say(line); ctx.fx.emit(wpos(c), NUM_COLORS[i * 4], 30, 0.5); if (!met) { met = true; done.add(k); if (done.size === keys.length) quiz(); } });
      return c;
    });
    const done = new Set(); let quizzed = false;
    const quiz = async () => { if (quizzed) return; quizzed = true; await wait(4); for (const k of keys) { if (!ctx.alive) return; const [q, a] = CAST[k][4]; await ask(ctx, q, choicesFor(a, 3, 0, 30), a, { y: 0.78, say: first(k) + ' asks: ' + q }); }
      if (ctx.alive) finish(ctx, 'meet-' + keys.join('-'), 'You met ' + keys.map(first).join(' and ') + '!'); };
    ctx.onUpdate((t) => chars.forEach((c, i) => { c.userData.flap && c.userData.flap(t, 4); c.rotation.y = Math.sin(t * 0.6 + i) * 0.3; }));
    if (extra) extra(ctx);
    ctx.say('Tap ' + keys.map(first).join(' and ') + (keys.length > 1 ? ' to hear about them!' : ' to hear its story, then tap the book to get your own copy!'));
  } };
}

export const EXPERIENCES = {

  cover: { title: 'The cover comes alive', build(ctx) {
    grass(ctx, 1.2, 0.9);
    const gate = place(makeGate(), 0, 0.02, -0.25, 0.9); ctx.root.add(gate); popIn(gate, 0.1);
    const eight = num3D('8', '#ffd23f', 0.2); eight.position.set(0, 0.28, -0.24); ctx.root.add(eight); popIn(eight, 0.3);
    const nia = place(makeNia(), -0.18, 0.02, 0.12, 0.42, 0.4); ctx.root.add(nia); popIn(nia, 0.2);
    const tipFx = () => ctx.fx.emit(wpos(nia.userData.parts.tip), '#9dff8a', 2, 0.1, 0.1, 0.8);
    const nums = [];
    for (let i = 1; i <= 9; i++) {
      const n = num3D(String(i), NUM_COLORS[i % 10], 0.14); n.userData.ang = i / 9 * Math.PI * 2; n.userData.h = 0.35 + (i % 3) * 0.12;
      tappable(n, () => { hop(n, 0.1); sfx.note(i); ctx.speak(String(i)); ctx.fx.emit(wpos(n), NUM_COLORS[i % 10], 20, 0.4); n.userData.hit = true; if (nums.every(k => k.userData.hit) && !ctx.done) { ctx.done = true; finish(ctx, 'cover', 'You woke up all nine numbers! Tap the butterfly to open the book.'); } });
      ctx.root.add(n); popIn(n, 0.3 + i * 0.07); nums.push(n);
    }
    const bf = makeButterfly8(0.22); ctx.root.add(bf);
    tappable(bf, () => { ctx.say('Follow me into the Number Garden!'); ctx.fx.emit(wpos(bf), '#ffd23f', 40, 0.6); setTimeout(() => ctx.alive && ctx.next(), 1600); });
    ctx.onUpdate((t) => {
      nia.userData.idle(t); if (Math.random() < 0.5) tipFx();
      nums.forEach((n, i) => { const a = n.userData.ang + t * 0.35; n.position.set(Math.cos(a) * 0.48, n.userData.h + Math.sin(t * 2 + i) * 0.03, Math.sin(a) * 0.3); });
      const a = t * 0.9; bf.position.set(Math.sin(a) * 0.35, 0.62 + Math.sin(a * 2) * 0.05, Math.sin(a * 2) * 0.15); bf.rotation.y = Math.cos(a) > 0 ? 0.6 : -0.6; bf.userData.flap(t);
    });
    ctx.say('Tap the numbers to wake them up. Tap the number eight butterfly to open the book!');
  } },

  welcome: { title: 'Meet Gwenda the Fairy', build(ctx) {
    grass(ctx); sprinkle(ctx);
    const gw = place(makeGwenda(), 0, 0.1, 0, 0.55); gw.userData.baseY = 0.1; ctx.root.add(gw); popIn(gw);
    let count = 0;
    for (let i = 0; i < 3; i++) {
      const st = label('★', { bg: null, fg: '#ffd23f', size: 0.16 }); st.position.set(-0.45 + i * 0.45, 0.55 + (i % 2) * 0.12, 0.1); ctx.root.add(st); popIn(st, 0.3 + i * 0.1);
      tappable(st, () => { if (st.userData.t) return; st.userData.t = 1; count++; ctx.speak(String(count)); sfx.note(count * 2); ctx.fx.emit(wpos(st), '#ffd23f', 40, 0.5); remove(st, 0.2);
        if (count === 3) ctx.say("One, two, three! The magic is awake. I'm Gwenda — every page with a sparkle has a surprise. Turn the page!"); });
    }
    ctx.onUpdate(t => gw.userData.idle(t));
    ctx.say('Hi, I am Gwenda the fairy! Tap the three stars to wake up the book magic.');
  } },

  map: { title: 'Map of the Number Garden', build(ctx) {
    grass(ctx, 1.8, 0.9, '#7ccf5a');
    const path = new THREE.CatmullRomCurve3([[-0.75, 0, 0.3], [-0.4, 0, -0.25], [0, 0, 0.2], [0.35, 0, -0.3], [0.72, 0, 0.25]].map(p => new THREE.Vector3(...p)));
    const nia = place(makeNia(), -0.8, 0.03, 0.35, 0.22); ctx.root.add(nia); popIn(nia);
    CHAPTERS.forEach((name, i) => {
      const p = path.getPoint(i / 17); const done = ctx.stars.has(i + 1);
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.03, 18), toon(done ? '#ffd23f' : NUM_COLORS[i % 10]));
      stone.position.set(p.x, 0.03, p.z); ctx.root.add(stone); popIn(stone, i * 0.04);
      const n = label(String(i + 1) + (done ? '★' : ''), { bg: null, fg: '#3c1361', size: 0.055 }); n.position.set(p.x, 0.1, p.z); ctx.root.add(n); popIn(n, i * 0.04);
      const go = () => { ctx.say('Chapter ' + (i + 1) + ': ' + name); tween(nia.position, { x: p.x, z: p.z + 0.04 }, 0.6, 'inOut', () => setTimeout(() => ctx.alive && ctx.goto(CH_SPREAD[i] - (i === 0 ? 1 : 0)), 700)); };
      tappable(stone, go); tappable(n, go);
    });
    ctx.say('This is the map of the Number Garden. Tap a stepping stone to jump to that chapter. Gold stones are chapters you finished!');
  } },

  butterfly: { title: 'Chase the Number Eight Butterfly', build(ctx) {
    grass(ctx); sprinkle(ctx, 10);
    const tree = place(makeTree(0.6), -0.55, 0.02, -0.2, 1); ctx.root.add(tree); popIn(tree);
    const nia = place(makeNia(), 0.5, 0.02, 0.15, 0.3, -0.5); ctx.root.add(nia); popIn(nia);
    const bf = makeButterfly8(0.24); ctx.root.add(bf); let n = 0, target = new THREE.Vector3(0, 0.4, 0);
    const counter = label('0 / 8', { size: 0.06 }); counter.position.set(0, 0.85, 0); ctx.root.add(counter);
    tappable(bf, () => {
      if (n >= 8) return; n++; ctx.speak(String(n)); sfx.note(n); ctx.fx.emit(wpos(bf), '#ffd23f', 30, 0.5);
      counter.material.map = label(n + ' / 8', { size: 0.06 }).material.map;
      target.set((Math.random() - 0.5) * 1.2, 0.25 + Math.random() * 0.45, (Math.random() - 0.5) * 0.5);
      if (n === 8) ctx.say('You caught the butterfly eight times! It flew to an old iron gate. Turn the page to open it.');
    });
    ctx.onUpdate((t, dt) => { bf.position.lerp(target, dt * 2); bf.position.y += Math.sin(t * 5) * 0.002; bf.userData.flap(t, 12); bf.lookAt(target.x, bf.position.y, target.z + 0.001); if (bf.position.distanceTo(target) < 0.05) target.set((Math.random() - 0.5) * 1.2, 0.25 + Math.random() * 0.45, (Math.random() - 0.5) * 0.5); nia.userData.idle(t); });
    ctx.say('Nia is chasing a butterfly shaped like the number eight. Tap it eight times to count along!');
  } },

  gate: { title: 'Scan to Open the Magic Gate', async build(ctx) {
    grass(ctx);
    const gate = place(makeGate(), 0, 0.02, -0.1, 1.3); ctx.root.add(gate); popIn(gate);
    const nia = place(makeNia(), -0.55, 0.02, 0.2, 0.3, 0.5); ctx.root.add(nia); popIn(nia);
    const lock = num3D('8', '#ffd23f', 0.16); lock.position.set(0, 0.42, -0.06); ctx.root.add(lock); popIn(lock, 0.3);
    ctx.onUpdate(t => { lock.rotation.z = Math.sin(t * 3) * 0.08; nia.userData.idle(t); });
    ctx.say('The number eight on the lock twinkles. Solve me!');
    await wait(1.8); if (!ctx.alive) return;
    await ask(ctx, '4 + 4 = ?', [6, 8, 9], 8, { y: 0.75 }); if (!ctx.alive) return;
    remove(lock); gate.userData.doors.forEach((d, i) => tween(d.rotation, { y: i ? -1.6 : 1.6 }, 1.2, 'out'));
    ctx.fx.emit(new THREE.Vector3(0, 0.4, -0.1), '#ffd23f', 120, 0.8, -0.3, 2);
    await wait(1); const addie = place(makeAddie(), 0.05, 0.02, -0.12, 0.28); ctx.root.add(addie); popIn(addie); tween(addie.position, { z: 0.15 }, 0.8, 'out');
    finish(ctx, 1, 'The gate creaked open! Out popped Addie the Addition Ant. Welcome to the Number Garden!');
    ctx.onUpdate(t => addie.userData.idle(t));
  } },

  friends: { title: 'Meet Addie and Freddy', async build(ctx) {
    grass(ctx); sprinkle(ctx);
    const addie = place(makeAddie(), -0.3, 0.02, 0, 0.42, 0.3), fred = place(makeFreddy(), 0.3, 0.02, 0, 0.42, -0.3);
    ctx.root.add(addie, fred); popIn(addie); popIn(fred, 0.15);
    const met = new Set();
    const intro = async () => { if (met.size < 2 || ctx.asked) return; ctx.asked = true; await wait(3.5); if (!ctx.alive) return;
      await ask(ctx, 'Addie asks: 2 + 3 = ?', [4, 5, 6], 5, { y: 0.72, say: 'Addie has a riddle for you. What is two plus three?' });
      if (ctx.alive) finish(ctx, 2, 'Five! Addie and Freddy will guide you through the garden.'); };
    tappable(addie, () => { hop(addie); met.add('a'); ctx.say("I'm Addie the Addition Ant! I put numbers together, like building with blocks!"); intro(); });
    tappable(fred, () => { hop(fred); met.add('f'); ctx.say("I'm Freddy the Fraction Fox! I share things into equal parts."); intro(); });
    ctx.onUpdate(t => { addie.userData.idle(t); fred.userData.idle(t); });
    ctx.say('Tap Addie and Freddy to say hello!');
  } },

  bridge: { title: 'Solve and Cross the Bridge', async build(ctx) {
    const water = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.6), glowMat('#4cc9f0', 0.85)); water.position.y = 0.01; ctx.root.add(water);
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.6), toon('#5fbf4a')); b.position.set(s * 0.55, 0.02, 0); ctx.root.add(b); }
    for (const s of [-1, 1]) for (const zz of [-0.12, 0.12]) ctx.root.add(cyl(0.012, 0.012, 0.18, '#7a4a1e', s * 0.27, 0.1, zz, 6));
    const sign = label('ADDITION BRIDGE', { size: 0.05, bg: '#ffd23f', border: '#7a4a1e' }); sign.position.set(0, 0.32, -0.12); ctx.root.add(sign);
    const planks = [];
    for (let i = 0; i < 3; i++) { const p = box(0.13, 0.025, 0.24, '#b5713b', -0.16 + i * 0.16, 0.06, 0); p.visible = false; ctx.root.add(p); planks.push(p); }
    const nia = place(makeNia(), -0.55, 0.04, 0, 0.28, Math.PI / 2); ctx.root.add(nia); popIn(nia);
    const fred = place(makeFreddy(), 0.62, 0.04, -0.15, 0.25, -0.6); ctx.root.add(fred); popIn(fred);
    ctx.onUpdate(t => { nia.userData.idle(t); fred.userData.idle(t); });
    ctx.say('To cross the Addition Bridge, solve the number riddles. Each answer adds a plank!'); await wait(2.5);
    const qs = [[3, 2], [rand(1, 5), rand(1, 4)], [5, 5]];
    for (let i = 0; i < 3; i++) {
      if (!ctx.alive) return; const [a, b] = qs[i];
      await ask(ctx, `${a} + ${b} = ?`, choicesFor(a + b), a + b, { y: 0.6 }); if (!ctx.alive) return;
      planks[i].visible = true; planks[i].position.y = 0.4; tween(planks[i].position, { y: 0.06 }, 0.5, 'out'); sfx.pop();
    }
    await wait(0.5); tween(nia.position, { x: 0.4 }, 2.2, 'inOut'); await wait(2.4); if (!ctx.alive) return;
    ctx.say('You crossed! In the Fraction Field, Freddy has a magic apple. Tap it to share it equally.');
    const apple = new THREE.Group(); const halves = [];
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14, s > 0 ? 0 : Math.PI, Math.PI), toon('#ef233c')); h.material.side = THREE.DoubleSide; apple.add(h); halves.push(h); }
    apple.add(cyl(0.005, 0.005, 0.05, '#5a3b1e', 0, 0.08, 0, 5)); apple.position.set(0.15, 0.45, 0.1); ctx.root.add(apple); popIn(apple);
    tappable(apple, () => { if (apple.userData.split) return; apple.userData.split = 1;
      halves.forEach((h, i) => tween(h.position, { x: i ? 0.06 : -0.06 }, 0.5, 'outBack'));
      const f = label('½ + ½ = 1', { size: 0.07 }); f.position.set(0.15, 0.62, 0.1); ctx.root.add(f); popIn(f);
      finish(ctx, 3, 'A half for you, a half for me! One half plus one half makes one whole apple.'); });
  } },

  carlo: { title: 'Count with Carlo 1 to 10', build(ctx) {
    grass(ctx);
    const mush = makeMushroom(0.36); mush.position.y = 0.02;
    ctx.root.add(mush); popIn(mush);
    const carlo = makeCarlo(); carlo.position.y = 0.45; carlo.scale.setScalar(1.15); ctx.root.add(carlo); popIn(carlo, 0.3, 1.15);
    const segs = carlo.userData.segs; let next = 1;
    segs.forEach((s, i) => { s.userData.ball.material.color.set('#3e7a3a');
      tappable(s, () => {
        if (next > 10) return;
        if (i + 1 !== next) { ctx.oops(); ctx.say('Count in order! Find number ' + next + '.'); return; }
        s.userData.ball.material.emissive.set('#5cff4a'); s.userData.ball.material.emissiveIntensity = 0.6; s.userData.ball.material.color.set('#7dff6a');
        hop(s, 0.05); ctx.speak(String(next)); sfx.note(next - 1); ctx.fx.emit(wpos(s), '#7dff6a', 15, 0.3); next++;
        if (next === 11) transform();
      }); });
    const transform = async () => {
      await wait(0.8); if (!ctx.alive) return; ctx.fx.emit(wpos(carlo), '#7dff6a', 150, 0.9, -0.2, 2);
      remove(carlo); const b10 = winged('#9dff8a', '#2d8a34', '#1b5e20', '10', '#1b5e20', 0.4); b10.position.set(0, 0.35, 0); ctx.root.add(b10); popIn(b10, 0.2);
      ctx.onUpdate(t => { b10.userData.flap(t, 7); b10.position.y = Math.min(0.75, b10.position.y + 0.002); b10.rotation.y = Math.sin(t) * 0.5; });
      finish(ctx, 4, 'Carlo sprang to life with a giggle and became a glowing number ten butterfly!');
    };
    ctx.say('Carlo the caterpillar is fast asleep. Tap his segments from one to ten, in order, to wake him up!');
  } },

  subby: { title: 'Solve Subtraction Problems', async build(ctx) {
    grass(ctx); sprinkle(ctx, 6);
    const sub = place(makeSubby(), -0.2, 0.02, 0, 0.9); ctx.root.add(sub); popIn(sub);
    const fred = place(makeFreddy(), 0.6, 0.02, -0.15, 0.26, -0.5); ctx.root.add(fred); popIn(fred);
    ctx.onUpdate(t => { fred.userData.idle(t); sub.userData.shell.rotation.z = Math.sin(t) * 0.05; });
    ctx.say("Subby's shell is covered in unsolved subtraction problems. It gets heavier when problems aren't solved. Can you help him?"); await wait(4);
    const qs = [[5, 2], [6, 4], [7, 7], [rand(5, 10), rand(1, 4)]];
    for (let i = 0; i < qs.length; i++) {
      if (!ctx.alive) return; const [a, b] = qs[i];
      await ask(ctx, `${a} − ${b} = ?`, choicesFor(a - b, 3, 0, 10), a - b, { y: 0.66, x: 0.1 }); if (!ctx.alive) return;
      const m = sub.userData.shellMat; m.emissive.set('#ffb703'); m.emissiveIntensity = (i + 1) * 0.25;
      tween(sub.position, { x: sub.position.x + 0.08 }, 0.6, 'inOut'); hop(sub, 0.04);
    }
    finish(ctx, 5, "Every answer made Subby's shell lighter, until it glowed like a jewel!");
  } },

  shapes: { title: 'Sort Shapes by Sides', async build(ctx) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.8), new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (c) => { c.fillStyle = '#c97b5a'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#efe2cf'; c.lineWidth = 3; for (let x = 0; x <= 256; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); } for (let y = 0; y <= 128; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); } for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(90,40,20,${Math.random() * 0.15})`; c.fillRect(Math.random() * 256, Math.random() * 128, 3, 3); } }), roughness: 0.8 })); floor.position.y = 0.01; ctx.root.add(floor); popIn(floor);
    const gh = makeGreenhouse(); ctx.root.add(gh); popIn(gh);
    const kinds = [[0, 'circle', '#ef476f'], [3, 'triangle', '#ffd166'], [4, 'square', '#06d6a0'], [5, 'pentagon', '#118ab2'], [6, 'hexagon', '#9b5de5']];
    const pots = kinds.map(([sides, name, col], i) => {
      const g = new THREE.Group(); g.position.set(-0.56 + i * 0.28, 0.02, 0.05);
      g.add(makePot()); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.22, 8), new THREE.MeshStandardMaterial({ color: '#2f8f37' }))).children.at(-1).position.y = 0.18;
      const tok = makeShapeBloom(sides, col, 0.065); tok.position.y = 0.3; g.add(tok); g.userData.tok = tok;
      g.userData.sides = sides; g.userData.name = name; ctx.root.add(g); popIn(g, i * 0.08); return g;
    });
    ctx.onUpdate(t => pots.forEach((p, i) => { p.userData.tok.rotation.y = Math.sin(t + i) * 0.4; }));
    ctx.say('Welcome to the Shape Greenhouse! Find each flower by its shape.'); await wait(2.5);
    for (const p of shuffle([...pots])) {
      if (!ctx.alive) return;
      const q = p.userData.sides ? `Tap the flower with ${p.userData.sides} sides` : 'Tap the round circle flower';
      const lb = label(q, { size: 0.06 }); lb.position.set(0, 0.7, 0); ctx.root.add(lb); popIn(lb); ctx.say(q + (p.userData.sides ? '. Count the sides!' : ' with no corners!'));
      await new Promise(res => pots.forEach(o => tappable(o, () => {
        if (o.userData.bloomed) return;
        if (o === p) { o.userData.bloomed = 1; ctx.good(wpos(o.userData.tok)); tween(o.userData.tok.scale, { x: 1.8, y: 1.8, z: 1.8 }, 0.5); ctx.speak(o.userData.name + '!'); res(); }
        else { shake(o); ctx.oops(); }
      })));
      remove(lb); await wait(1);
    }
    pots.forEach((p, i) => tween(p.userData.tok.position, { y: 0.9 + i * 0.05 }, 2, 'inOut'));
    finish(ctx, 6, 'The greenhouse burst into color! Shapes are everywhere.');
  } },

  bloom: { title: 'Watch the Garden Come to Life', build(ctx) {
    grass(ctx, 1.8, 0.9);
    const fountain = new THREE.Group(); fountain.add(cyl(0.14, 0.16, 0.06, '#b8c0c8', 0, 0.03, 0)); fountain.add(cyl(0.03, 0.03, 0.2, '#b8c0c8', 0, 0.13, 0)); fountain.position.set(0, 0.02, -0.2); ctx.root.add(fountain); popIn(fountain);
    const trees = [-0.6, 0.6].map(x => { const t = place(makeTree(0.45), x, 0.02, -0.22, 1); ctx.root.add(t); popIn(t); return t; });
    let grown = 0, flowing = false;
    for (let i = 0; i < 10; i++) {
      const x = -0.6 + (i % 5) * 0.3, z = 0.08 + Math.floor(i / 5) * 0.2;
      const mound = sph(0.045, '#7a4a1e', x, 0.02, z); mound.scale.y = 0.4; ctx.root.add(mound); popIn(mound, i * 0.04);
      tappable(mound, () => { if (mound.userData.g) return; mound.userData.g = 1; grown++;
        const f = makeFlower(NUM_COLORS[i], 0.16 + Math.random() * 0.06); f.position.set(x, 0.02, z); ctx.root.add(f); popIn(f);
        ctx.speak(String(grown)); sfx.note(grown - 1); ctx.fx.emit(new THREE.Vector3(x, 0.15, z), NUM_COLORS[i], 20, 0.3);
        const t = trees[grown % 2], spot = t.userData.fruitSpots[Math.floor(grown / 2) % 8]; const fr = sph(0.03, '#ef233c', spot.x, spot.y, spot.z + 0.05); t.add(fr); popIn(fr);
        if (grown === 10) { flowing = true; const ten = num3D('10', '#ffd23f', 0.28); ten.position.set(0, 0.75, -0.1); ctx.root.add(ten); popIn(ten, 0.4); finish(ctx, 7, 'Ten flowers! The Division Fountain danced and the butterflies formed a glowing ten in the sky.'); }
      });
    }
    ctx.onUpdate(() => { if (flowing && Math.random() < 0.8) ctx.fx.emit(new THREE.Vector3(0, 0.26, -0.2), '#4cc9f0', 3, 0.35, -1.2, 1); });
    ctx.say('Every problem Nia solved made the garden bloom brighter. Tap the ten seeds to grow ten flowers!');
  } },

  milly: { title: 'Build Arrays with Milly', async build(ctx) {
    const branch = cyl(0.03, 0.03, 1.2, '#7a4a1e', 0, 0.75, -0.25); branch.rotation.z = Math.PI / 2; ctx.root.add(branch);
    const milly = makeMilly(); milly.position.set(0.55, 0.85, -0.22); milly.scale.setScalar(0.6); ctx.root.add(milly); popIn(milly, 0, 0.6);
    ctx.onUpdate(t => milly.userData.flap(t, 3));
    const board = new THREE.Group(); board.position.set(-0.15, 0.25, 0); ctx.root.add(board);
    const showArray = (r, c) => { board.clear(); for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { const d = sph(0.025, '#ffd23f', (j - (c - 1) / 2) * 0.08, (r - 1 - i) * 0.08, 0, glowMat('#ffe066')); board.add(d); popIn(d, (i * c + j) * 0.05); } };
    ctx.say('Meet Milly the Multiplication Moth! Count her glowing dots in groups.'); await wait(2.5);
    const qs = [[2, 3], [3, 4], [rand(2, 4), rand(2, 5)]];
    for (const [r, c] of qs) {
      if (!ctx.alive) return; showArray(r, c);
      await ask(ctx, `${r} rows of ${c} = ?`, choicesFor(r * c, 3, 1, 30), r * c, { y: 0.62, x: 0.25, spread: 0.45, say: `${r} rows of ${c}. How many dots in all?` });
      if (!ctx.alive) return; board.children.forEach(d => ctx.fx.emit(wpos(d), '#ffe066', 4, 0.5, 0.3, 1.5)); board.clear();
      const eq = label(`${r} × ${c} = ${r * c}`, { size: 0.08 }); eq.position.set(-0.15, 0.4, 0); ctx.root.add(eq); popIn(eq); remove(eq, 1.8); await wait(2);
    }
    finish(ctx, 8, 'Multiplication is counting in beautiful groups!');
  } },

  everywhere: { title: 'Find Math in Everyday Things', async build(ctx) {
    grass(ctx);
    const sun = makeSun(0.08); sun.position.set(-0.55, 0.75, -0.2); ctx.root.add(sun);
    const swing = makeSwingSet(); swing.position.set(0.45, 0.02, -0.1); ctx.root.add(swing);
    const fl = makeFlower('#ff5fa2', 0.22, 5); fl.position.set(-0.1, 0.02, 0.15); fl.scale.setScalar(1.6); ctx.root.add(fl);
    const kite = makeKite(); kite.position.set(0.05, 0.72, -0.15); ctx.root.add(kite);
    const tasks = [[sun, 'Find a circle in the sky', 'The sun is a circle!'], [swing, 'Find a triangle', 'The swing set legs make a triangle!'], [fl, 'Find something with 5 parts', 'The flower has five petals!'], [kite, 'Find a square', 'The kite is a square!']];
    [sun, swing, fl, kite].forEach((o, i) => popIn(o, i * 0.1, o === fl ? 1.6 : 1));
    ctx.onUpdate(t => { kite.position.x = 0.05 + Math.sin(t) * 0.1; kite.rotation.z = Math.sin(t * 2) * 0.2; kite.userData.tail.rotation.z = Math.sin(t * 3) * 0.3; swing.userData.seat.rotation.x = Math.sin(t * 2) * 0.45; sun.userData.rays.rotation.z = t * 0.3; });
    ctx.say('"Math is in everything!" Nia said. Let\'s look closely and find it.'); await wait(2.5);
    for (const [o, q, a] of tasks) {
      if (!ctx.alive) return; const lb = label(q, { size: 0.06 }); lb.position.set(0, 0.92, 0); ctx.root.add(lb); popIn(lb); ctx.say(q + '.');
      await new Promise(res => tasks.forEach(([oo]) => tappable(oo, () => { if (oo === o) { ctx.good(wpos(o)); ctx.say(a); res(); } else ctx.oops(); })));
      remove(lb); await wait(1.6);
    }
    finish(ctx, 9, "Math isn't just in books. It's in nature, music, patterns, and play!");
  } },

  pattern: { title: 'Complete the Pattern', async build(ctx) {
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.015, 40), glowMat('#4cc9f0', 0.9)); pond.scale.set(0.85, 1, 0.42); pond.position.y = 0.01; ctx.root.add(pond); popIn(pond);
    const S3 = { c: [0, '#ef476f'], t: [3, '#ffd166'], s: [4, '#06d6a0'], p: [5, '#9b5de5'] };
    const rounds = [['c', 't', 's', 'c', '?'], ['c', 's', 'c', 's', '?'], ['t', 't', 'p', 't', 't', '?']];
    const answers = ['t', 'c', 'p'];
    ctx.say('Welcome to the Pattern Pond! The lily pads glow in repeating shapes.'); await wait(2.2);
    for (let r = 0; r < 3; r++) {
      if (!ctx.alive) return; const seq = rounds[r], pads = [];
      seq.forEach((k, i) => { const x = -0.6 + i * (1.2 / (seq.length - 1)); const lp = makeLily(); lp.position.set(x, 0.025, 0.05 * Math.sin(i * 2)); ctx.root.add(lp); popIn(lp, i * 0.08); pads.push(lp);
        if (k !== '?') { const tok = shapeToken(S3[k][0], S3[k][1], 0.045); tok.position.set(x, 0.1, lp.position.z); ctx.root.add(tok); popIn(tok, i * 0.08); pads.push(tok); }
        else { const q = label('?', { size: 0.09 }); q.position.set(x, 0.12, lp.position.z); ctx.root.add(q); pads.push(q); } });
      const lb = label('Which shape comes next?', { size: 0.06 }); lb.position.set(0, 0.62, 0); ctx.root.add(lb); popIn(lb); ctx.say('Which shape comes next?');
      const opts = shuffle(['c', 't', 's', 'p'].filter((k, i) => k === answers[r] || i < 3).slice(0, 3).concat(answers[r]).filter((v, i, a) => a.indexOf(v) === i)).slice(0, 3);
      if (!opts.includes(answers[r])) opts[0] = answers[r];
      const toks = [];
      await new Promise(res => opts.forEach((k, i) => { const tok = shapeToken(S3[k][0], S3[k][1], 0.07); tok.position.set(-0.25 + i * 0.25, 0.42, 0.15); ctx.root.add(tok); popIn(tok, 0.2 + i * 0.1); toks.push(tok);
        tappable(tok, () => { if (k === answers[r]) { ctx.good(wpos(tok)); tween(tok.position, { x: pads.at(-1).position.x, y: 0.1, z: pads.at(-1).position.z }, 0.6, 'inOut'); tween(tok.scale, { x: 0.65, y: 0.65, z: 0.65 }, 0.6); res(); } else { shake(tok); ctx.oops(); } }); }));
      remove(lb); await wait(1.5);
      [...pads, ...toks].forEach(o => remove(o)); for (let w = 0; w < 6; w++) ctx.fx.emit(new THREE.Vector3(-0.6 + w * 0.24, 0.05, 0), '#a8e6ff', 8, 0.25, -0.2, 0.8); await wait(0.6);
    }
    finish(ctx, 10, 'The pond rippled in approval, forming waves in perfect rhythm!');
  } },

  measure: { title: 'Measure with the Magic Wand', async build(ctx) {
    grass(ctx);
    const specs = [['sunflower', 5, '#ffd23f', -0.5], ['marigold', 3, '#ff8c1a', -0.2], ['daisy', 2, '#ffffff', 0.08], ['daisy', 2, '#ffffff', 0.3], ['violet', 1, '#9b5de5', 0.55]];
    const U = 0.11;
    const fls = specs.map(([n, h, c, x], i) => { const f = makeFlower(c, h * U, n === 'sunflower' ? 12 : 6, n === 'sunflower' ? '#6b3e1f' : '#ffd23f'); f.position.set(x, 0.02, 0); if (n === 'sunflower') f.userData.head.scale.setScalar(1.8); f.userData.h = h; f.userData.name = n; ctx.root.add(f); popIn(f, i * 0.08); return f; });
    const ruler = new THREE.Group(); ruler.position.set(-0.72, 0.02, 0.05);
    ruler.add(box(0.03, 6 * U, 0.01, '#ffd23f', 0, 3 * U, 0));
    for (let k = 0; k <= 6; k++) { ruler.add(box(0.04, 0.005, 0.012, '#7a4a1e', 0.02, k * U, 0)); if (k) { const l = label(String(k), { bg: null, size: 0.04 }); l.position.set(-0.04, k * U, 0); ruler.add(l); } }
    ctx.root.add(ruler); popIn(ruler);
    ctx.say('This is the Measurement Meadow. Nia uses her wand like a ruler!'); await wait(2);
    const pick = (q, ok) => new Promise(res => { const lb = label(q, { size: 0.06 }); lb.position.set(0, 0.85, 0); ctx.root.add(lb); popIn(lb); ctx.say(q + '.');
      fls.forEach(f => tappable(f, () => { if (ok(f)) { ctx.good(wpos(f.userData.head)); remove(lb); res(f); } else { ctx.oops(); shake(f); } })); });
    await pick('Tap the tallest flower', f => f.userData.h === 5); if (!ctx.alive) return; ctx.say('The sunflower is tallest. It is 5 wands tall!'); await wait(2.5);
    await pick('Tap the shortest flower', f => f.userData.h === 1); if (!ctx.alive) return; ctx.say('The violet is shortest. Just 1!'); await wait(2);
    await pick('Tap a daisy that is the same height as another', f => f.userData.h === 2); if (!ctx.alive) return;
    await ask(ctx, 'How tall is the marigold?', [1, 3, 5], 3, { y: 0.7 }); if (!ctx.alive) return;
    finish(ctx, 11, 'Equal daisies, a tall sunflower, and a tiny violet. Every size matters!');
  } },

  time: { title: 'Tell the Time', async build(ctx) {
    grass(ctx); sprinkle(ctx, 6); const clock = makeFlowerClock(); clock.position.set(0, 0.47, -0.05); ctx.root.add(clock);
    const { hourH, minH } = clock.userData;
    popIn(clock);
    const set = (h, m) => { tween(hourH.rotation, { z: -((h % 12) + m / 60) / 12 * Math.PI * 2 }, 0.8, 'inOut'); tween(minH.rotation, { z: -(m / 60) * Math.PI * 2 }, 0.8, 'inOut'); };
    const fmt = (h, m) => `${h}:${m ? '30' : '00'}`;
    const qs = [[3, 0], [rand(1, 12), 0], [rand(1, 11), 0], [rand(1, 11), 30]];
    ctx.say('In the center of the garden stands the Time Flower.'); await wait(2);
    for (const [h, m] of qs) {
      if (!ctx.alive) return; set(h, m); await wait(0.9);
      const wrong = shuffle([h % 12 + 1, (h + 10) % 12 + 1, h === 6 ? 12 : 6].filter(x => x !== h)).slice(0, 2);
      const opts = shuffle([fmt(h, m), ...wrong.map(x => fmt(x, m))]);
      await ask(ctx, 'What time is it?', opts, fmt(h, m), { y: 0.85, x: 0, spread: 0.7, chip: 0.15, say: m ? 'The big hand is on the 6. What time is it?' : `The big hand is on the 12 and the little hand is on the ${h}. What time is it?` });
      if (!ctx.alive) return; tween(clock.rotation, { z: clock.rotation.z + Math.PI * 2 }, 1, 'inOut'); ctx.fx.emit(wpos(clock), NUM_COLORS[h % 10], 40, 0.6); await wait(1);
    }
    finish(ctx, 12, 'The Time Flower spun, and a shower of time-telling petals danced around you!');
  } },

  market: { title: 'Count Coins and Pay', async build(ctx) {
    const stall = makeMarketStall(); ctx.root.add(stall); popIn(stall);
    const fruit = [['starfruit', '#ffd23f'], ['crystal grapes', '#b8f2ff'], ['rainbow berries', '#ff5fa2']];
    const addie = place(makeAddie(), 0.6, 0.02, 0, 0.26, -0.5); ctx.root.add(addie); popIn(addie); ctx.onUpdate(t => addie.userData.idle(t));
    const basket = cyl(0.1, 0.08, 0.06, '#c8a165', 0, 0.03, 0.25); ctx.root.add(basket);
    const orders = [['starfruit', 15], ['two rainbow berries', 12], [fruit[rand(0, 2)][0], rand(6, 27)]];
    ctx.say('Welcome to the Market of Money! Addie gave you magic coins: pennies, nickels, and dimes.'); await wait(3);
    for (const [item, price] of orders) {
      if (!ctx.alive) return; let total = 0; const inBasket = [];
      const lb = label(`Pay ${price}¢ for the ${item}`, { size: 0.06 }); lb.position.set(0, 0.85, 0); ctx.root.add(lb); popIn(lb);
      let tl = label('0¢', { size: 0.07 }); tl.position.set(0, 0.2, 0.25); ctx.root.add(tl);
      ctx.say(`The ${item} costs ${price} cents. Tap coins to pay exactly ${price} cents.`);
      const coins = [];
      await new Promise(res => {
        [1, 5, 10].forEach((v, i) => { const c = makeCoin(v); c.position.set(-0.45 + i * 0.12, 0.4, 0.2); c.scale.setScalar(1.6); c.userData.baseScale = c.scale.clone(); ctx.root.add(c); popIn(c, i * 0.1); coins.push(c);
          tappable(c, () => { total += v; const cc = makeCoin(v); cc.position.set((Math.random() - 0.5) * 0.08, 0.07 + inBasket.length * 0.012, 0.25); cc.rotation.x = -Math.PI / 2; ctx.root.add(cc); inBasket.push(cc); sfx.pop();
            ctx.root.remove(tl); tl = label(total + '¢', { size: 0.07 }); tl.position.set(0, 0.2, 0.25); ctx.root.add(tl);
            if (total === price) { ctx.good(wpos(basket)); res(); }
            else if (total > price) { ctx.oops(); ctx.say('Oops, that is too much! Let\'s try again.'); total = 0; inBasket.forEach(o => ctx.root.remove(o)); inBasket.length = 0; }
          }); });
        const clr = chip('↺', '#999999', () => { total = 0; inBasket.forEach(o => ctx.root.remove(o)); inBasket.length = 0; ctx.root.remove(tl); tl = label('0¢', { size: 0.07 }); tl.position.set(0, 0.2, 0.25); ctx.root.add(tl); }, 0.09);
        clr.position.set(-0.45 + 3 * 0.12, 0.4, 0.2); ctx.root.add(clr); coins.push(clr);
      });
      await wait(1); [lb, tl, ...coins, ...inBasket].forEach(o => remove(o)); await wait(0.5);
    }
    finish(ctx, 13, 'Math helps you get what you want, and know what it\'s worth!');
  } },

  skippy: { title: 'Leap and Skip with Skippy', async build(ctx) {
    grass(ctx);
    const sk = place(makeSkippy(), -0.7, 0.08, 0.05, 0.35); ctx.root.add(sk); popIn(sk); ctx.onUpdate(t => sk.userData.idle(t));
    const rounds = [2, 5, 10];
    ctx.say("I'm Skippy! I skip branches as I go. Let's count by twos, fives, and tens!"); await wait(3);
    for (const step of rounds) {
      if (!ctx.alive) return; const stumps = [];
      for (let i = 0; i < 5; i++) { const s = cyl(0.06, 0.07, 0.06 + i * 0.015, '#8d5a2b', -0.5 + i * 0.25, 0.03 + i * 0.008, 0.05); ctx.root.add(s); popIn(s, i * 0.06); stumps.push(s);
        const l = label(i < 4 ? String(step * (i + 1)) : '?', { size: 0.07 }); l.position.set(s.position.x, 0.2 + i * 0.015, 0.05); ctx.root.add(l); popIn(l, i * 0.06); stumps.push(l); }
      for (let i = 0; i < 4; i++) { await wait(0.45); tween(sk.position, { x: -0.5 + i * 0.25, y: 0.1 + i * 0.015 }, 0.35, 'out'); hop(sk, 0.12); ctx.speak(String(step * (i + 1)), { rate: 1.1 }); }
      await ask(ctx, `Count by ${step}s. What comes next?`, choicesFor(step * 5, 3, 1, 60).map(v => v === step * 5 ? v : v + (v % step ? 0 : 1)), step * 5, { y: 0.55 });
      if (!ctx.alive) return; tween(sk.position, { x: 0.5, y: 0.17 }, 0.4, 'out'); hop(sk, 0.15);
      for (let a = 0; a < 6; a++) { const ac = sph(0.025, '#c68b59', (Math.random() - 0.5) * 1.2, 0.9, (Math.random() - 0.5) * 0.4); ctx.root.add(ac); tween(ac.position, { y: 0.03 }, 0.9 + Math.random() * 0.5, 'out'); remove(ac, 2.4); }
      await wait(2); stumps.forEach(o => remove(o)); tween(sk.position, { x: -0.7, y: 0.08 }, 0.6, 'inOut'); await wait(0.8);
    }
    finish(ctx, 14, 'Skip counting is like taking shortcuts! Ten, twenty, thirty, forty, fifty!');
  } },

  heart: { title: 'Unlock the Heart of the Garden', async build(ctx) {
    grass(ctx, 1.6, 0.9, '#3d9e46');
    const heart = makeHeart(0.38); heart.position.set(0, 0.42, -0.05); ctx.root.add(heart); popIn(heart);
    const rings = [0, 1, 2].map(i => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.22 + i * 0.05, 0.01, 8, 40), glowMat(['#ffd23f', '#4cc9f0', '#9b5de5'][i])); r.position.copy(heart.position); r.rotation.x = 1 + i * 0.6; ctx.root.add(r); return r; });
    ctx.onUpdate((t) => { const b = 1 + Math.sin(t * 4) * 0.04; heart.scale.setScalar(b); heart.rotation.y = Math.sin(t * 0.8) * 0.4; rings.forEach((r, i) => r.parent && (r.rotation.z = t * (i + 1) * 0.6)); });
    ctx.say('The sky swirled with math symbols. Solve three magic locks to unlock the Heart of the Garden!'); await wait(3);
    const a = rand(2, 6), b = rand(1, 4), c = rand(6, 10), d = rand(1, 5);
    const qs = [[`${a} + ${b} = ?`, a + b], [`${c} − ${d} = ?`, c - d], ['How many sides does a triangle have?', 3]];
    for (let i = 0; i < 3; i++) {
      if (!ctx.alive) return; await ask(ctx, qs[i][0], choicesFor(qs[i][1], 3, 0, 15), qs[i][1], { y: 0.85, z: 0.2 });
      if (!ctx.alive) return; ctx.fx.emit(wpos(heart), ['#ffd23f', '#4cc9f0', '#9b5de5'][i], 50, 0.7); remove(rings[i]);
    }
    const friends = [makeAddie(), makeFreddy(), makeSkippy(), makeGwenda()].map((f, i) => { f.scale.setScalar(0.18); ctx.root.add(f); popIn(f, i * 0.15, 0.18); return f; });
    ctx.onUpdate(t => friends.forEach((f, i) => { const an = t * 0.8 + i * Math.PI / 2; f.position.set(Math.cos(an) * 0.5, 0.05, Math.sin(an) * 0.3); f.rotation.y = -an; }));
    finish(ctx, 15, 'You see numbers as magic, and that magic lives in you!');
  } },

  goodbye: { title: 'Walk Back Through the Magic Gate', build(ctx) {
    grass(ctx);
    const gate = place(makeGate(), 0, 0.02, -0.25, 1.2); ctx.root.add(gate); popIn(gate); gate.userData.doors.forEach((d, i) => d.rotation.y = i ? -1.6 : 1.6);
    const nia = place(makeNia(), 0, 0.02, 0.2, 0.28, Math.PI); ctx.root.add(nia); popIn(nia);
    const pals = [[makeAddie(), -0.55], [makeFreddy(), -0.3], [makeSkippy(), 0.3], [winged('#9dff8a', '#2d8a34', '#1b5e20', '10', '#1b5e20', 0.3), 0.55]];
    const waved = new Set();
    pals.forEach(([p, x], i) => { place(p, x, i === 3 ? 0.35 : 0.02, 0.05, i === 3 ? 0.6 : 0.24, x < 0 ? 0.6 : -0.6); ctx.root.add(p); popIn(p, i * 0.1, p.scale.x);
      tappable(p, () => { hop(p); waved.add(i); ctx.say(['Bye, Nia! Keep adding up the fun!', 'Farewell! Remember to share fairly!', 'See you! Count by twos on your way home!', 'Goodbye! Count to ten whenever you miss me!'][i]); sfx.note(i * 2);
        if (waved.size === 4) walk(); }); });
    const walk = async () => { await wait(2.5); if (!ctx.alive) return; ctx.say('Step by step, Nia walked back through the glowing eight gate.');
      tween(nia.position, { z: -0.35 }, 2.5, 'inOut'); await wait(2.6); gate.userData.doors.forEach(d => tween(d.rotation, { y: 0 }, 1)); remove(nia);
      ['+', '−', '×', '÷', '='].forEach((s, i) => { const l = label(s, { bg: null, fg: NUM_COLORS[i * 2], size: 0.1 }); l.position.set(-0.3 + i * 0.15, 0.5, -0.25); ctx.root.add(l); popIn(l, i * 0.15); remove(l, 3 + i * 0.2); });
      finish(ctx, 16, 'The symbols on the vines shimmered like a quiet goodbye. This was only the beginning!'); };
    ctx.onUpdate(t => { pals[3][0].userData.flap(t, 5); pals[0][0].userData.idle(t); pals[1][0].userData.idle(t); });
    ctx.say('Time to go home. Tap each friend to wave goodbye!');
  } },

  dreams: { title: 'Dream and Solve with Nia', async build(ctx) {
    const bed = makeBed(); bed.position.set(0, 0.02, 0.05); ctx.root.add(bed); popIn(bed);
    const nia = place(makeNia(), 0, 0.16, 0.05, 0.22); ctx.root.add(nia); popIn(nia); ctx.onUpdate(t => nia.userData.idle(t));
    const night = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1b1446', side: THREE.BackSide, transparent: true, opacity: 0.55, depthWrite: false })); ctx.root.add(night);
    ctx.say('Nia sat on her bed and waved her wand. Equations floated above her like fireflies!'); await wait(3);
    const ops = [() => { const a = rand(1, 9), b = rand(1, 9); return [`${a} + ${b}`, a + b]; }, () => { const a = rand(5, 15), b = rand(1, 5); return [`${a} − ${b}`, a - b]; }, () => { const a = rand(2, 5), b = rand(2, 4); return [`${a} × ${b}`, a * b]; }];
    const stars = [];
    for (let i = 0; i < 4; i++) {
      if (!ctx.alive) return; const [q, ans] = ops[i % 3]();
      await ask(ctx, q + ' = ?', choicesFor(ans, 3, 0, 25), ans, { y: 0.6 + (i % 2) * 0.05, spread: 0.7 });
      if (!ctx.alive) return; const st = label('★', { bg: null, fg: '#fff3b0', size: 0.08 }); st.position.set(-0.45 + i * 0.3, 0.95, -0.3); ctx.root.add(st); popIn(st); stars.push(st);
    }
    finish(ctx, 17, 'Math is even more fun when it\'s all around me!');
  } },

  draw: { title: 'Write, Draw and Remember', build(ctx) {
    const W = 512, slate = (c) => { const gr = c.createLinearGradient(0, 0, W, 384); gr.addColorStop(0, '#24503d'); gr.addColorStop(1, '#1a3d2e'); c.fillStyle = gr; c.fillRect(0, 0, W, 384); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; c.fillRect(Math.random() * W, Math.random() * 384, 2 + Math.random() * 6, 1); } }, tex = canvasTex(W, 384, slate);
    const cv = tex.userData.canvas, c2 = cv.getContext('2d');
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ map: tex }));
    const easel = makeChalkboardEasel(board); easel.position.set(0, 0.47, -0.08); easel.scale.setScalar(0.92); easel.userData.baseScale = easel.scale.clone(); ctx.root.add(easel); popIn(easel);
    let col = '#ffffff', last = null, ink = 0;
    board.userData.onDrag = (hit, phase) => {
      if (!hit || !hit.uv) { last = null; return; }
      const x = hit.uv.x * W, y = (1 - hit.uv.y) * 384;
      if (phase === 'start' || !last) last = [x, y];
      c2.strokeStyle = col; c2.lineWidth = 10; c2.lineCap = 'round'; c2.beginPath(); c2.moveTo(...last); c2.lineTo(x, y); c2.stroke(); last = [x, y]; tex.needsUpdate = true;
      ink++; if (ink === 60) finish(ctx, 18, 'Beautiful! Your mind can bloom with numbers too. Keep wondering and keep solving!');
      if (phase === 'end') last = null;
    };
    ['#ffffff', '#ffd23f', '#ff5fa2', '#4cc9f0'].forEach((cc, i) => { const ch = chip('', cc, () => { col = cc; sfx.pop(); }, 0.08); ch.position.set(-0.3 + i * 0.12, 0.08, 0.15); ctx.root.add(ch); popIn(ch, i * 0.08); });
    const clr = chip('↺', '#888888', () => { slate(c2); tex.needsUpdate = true; }, 0.08); clr.position.set(0.22, 0.08, 0.15); ctx.root.add(clr);
    ctx.say('Draw your favorite number on the magic chalkboard! Pick a color, then draw with your finger.');
  } },

  design: { title: 'Design Your Own Number Garden', build(ctx) {
    grass(ctx, 1.6, 0.8, '#8bd35f');
    const kinds = [g => makeFlower(NUM_COLORS[rand(0, 9)], 0.18), g => { const t = makeTree(0.35); return t; }, () => num3D(String(rand(0, 9)), NUM_COLORS[rand(0, 9)], 0.14), () => { const f = makeFlower('#ffd23f', 0.3, 12, '#6b3e1f'); f.userData.head.scale.setScalar(1.6); return f; }];
    let planted = 0; const tally = { v: label('Planted: 0', { size: 0.06 }) }; tally.v.position.set(0, 0.7, 0); ctx.root.add(tally.v);
    for (let i = 0; i < 12; i++) {
      const x = -0.6 + (i % 6) * 0.24, z = -0.15 + Math.floor(i / 6) * 0.3;
      const soil = cyl(0.07, 0.07, 0.02, '#7a4a1e', x, 0.025, z); ctx.root.add(soil); popIn(soil, i * 0.03);
      let k = -1, cur = null;
      tappable(soil, () => { k = (k + 1) % kinds.length; if (cur) ctx.root.remove(cur); else planted++; cur = kinds[k](); cur.position.set(x, k === 2 ? 0.12 : 0.03, z); ctx.root.add(cur); popIn(cur, 0, cur.scale.x);
        sfx.pop(); ctx.root.remove(tally.v); tally.v = label('Planted: ' + planted, { size: 0.06 }); tally.v.position.set(0, 0.7, 0); ctx.root.add(tally.v);
        if (planted === 12 && !ctx.done) { ctx.done = true; finish(ctx, 'design', 'Your Number Garden is complete! What will your garden teach the world?'); } });
    }
    ctx.say('Design your own Number Garden! Tap a plot of soil to plant something. Tap again to change it.');
  } },

  sumgame: { title: "Addie's Tool Slice & Bloom and Sum", async build(ctx) {
    grass(ctx);
    const addie = place(makeAddie(), -0.65, 0.02, 0, 0.3, 0.5); ctx.root.add(addie); popIn(addie); ctx.onUpdate((t) => addie.userData.idle(t));
    ctx.say("Hi, I'm Addie! Tap the flowers whose numbers add up to the target. Think fast!"); await wait(2.5);
    for (let r = 0; r < 3; r++) {
      if (!ctx.alive) return; const target = rand(6, 14);
      const a = rand(1, target - 1), vals = shuffle([a, target - a, rand(1, 9), rand(1, 9), rand(1, 9)]);
      const lb = label('Target: ' + target, { size: 0.08, bg: '#ffd23f' }); lb.position.set(0, 0.8, 0); ctx.root.add(lb); popIn(lb); ctx.say('Make ' + target + ' with two flowers.');
      const fl = []; let picked = [];
      await new Promise(res => vals.forEach((v, i) => {
        const f = new THREE.Group(); const fw = makeFlower(NUM_COLORS[(i * 2) % 10], 0.2); f.add(fw); const n = num3D(String(v), NUM_COLORS[(i * 2 + 3) % 10], 0.11); n.position.y = 0.32; f.add(n);
        f.position.set(-0.35 + i * 0.22, 0.02, 0.05); ctx.root.add(f); popIn(f, i * 0.07); fl.push(f);
        tappable(f, () => { if (picked.includes(f)) return; picked.push(f); hop(f); sfx.pop();
          if (picked.length === 2) { const s = vals[fl.indexOf(picked[0])] + vals[fl.indexOf(picked[1])];
            if (s === target) { ctx.good(wpos(f)); ctx.say(`${vals[fl.indexOf(picked[0])]} plus ${vals[fl.indexOf(picked[1])]} makes ${target}!`); res(); }
            else { ctx.oops(); ctx.say(`That makes ${s}. Try again!`); picked = []; } } });
      }));
      await wait(1.8); [lb, ...fl].forEach(o => remove(o)); await wait(0.5);
    }
    finish(ctx, 'sum', 'Combo! You built every target number.');
  } },

  parade: { title: 'Meet the Characters', build(ctx) {
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.85, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: stageTex('#ffd23f'), transparent: true, depthWrite: false })); plate.position.y = 0.01; ctx.root.add(plate); popIn(plate);
    const ring = new THREE.Group(); ctx.root.add(ring);
    const cast = [[makeNia, 'I\'m Nia Brown! I ask big questions and I carry my sparkle-green number wand.', 0.3],
      [makeAddie, 'I\'m Addie the Addition Ant. I build and add!', 0.28], [makeFreddy, 'I\'m Freddy the Fraction Fox. Halves, quarters, and fair shares!', 0.28],
      [makeGwenda, 'I\'m Gwenda the fairy, keeper of the garden magic.', 0.4], [() => makeCarlo(10), 'I\'m Carlo the counting caterpillar. One to ten, let\'s go!', 0.4],
      [makeSubby, 'I\'m Subby the subtraction snail. Take away and watch me glow!', 0.6], [() => makeMilly(), 'I\'m Milly the multiplication moth. Count in groups!', 0.5],
      [makeSkippy, 'I\'m Skippy! I skip count by twos, fives, and tens!', 0.38], [() => makeButterfly8(0.3), 'I\'m the Number Eight Butterfly. Follow the magic!', 1]];
    const met = new Set();
    cast.forEach(([mk, line, s], i) => { const c = mk(); const a = i / cast.length * Math.PI * 2;
      c.position.set(Math.sin(a) * 0.55, i >= 6 && i !== 7 ? 0.3 : 0.04, Math.cos(a) * 0.55); c.rotation.y = a; c.scale.setScalar(s); c.userData.baseScale = c.scale.clone(); ring.add(c); popIn(c, i * 0.08);
      tappable(c, () => { hop(c, 0.1); met.add(i); ctx.say(line); ctx.fx.emit(wpos(c), NUM_COLORS[i], 25, 0.4); if (met.size === cast.length) finish(ctx, 'cast', 'You met the whole Number Garden crew!'); }); });
    ctx.onUpdate((t, dt) => { ring.rotation.y += dt * 0.25; ring.children.forEach((c, i) => { c.userData.idle && c.userData.idle(t); c.userData.flap && c.userData.flap(t, 4); }); });
    ctx.say('Meet the whole Number Garden crew! Tap each friend as the parade spins by.');
  } },

  theater: { title: 'Read, Watch, Listen & Learn', build(ctx) {
    grass(ctx, 1.6, 0.8, '#9b5de5');
    const clips = [['character', 'Meet Nia'], ['gate', 'The Gate'], ['greenhouse', 'Greenhouse'], ['moth', 'Milly'], ['squirrel', 'Skippy'], ['money', 'Market'], ['night', 'Night Time'], ['goodbye', 'Goodbye']];
    clips.forEach(([v, name], i) => { const b = label(name, { size: 0.042, bg: i % 2 ? '#ffd23f' : '#ffffff' }); b.position.set(-0.6 + (i % 4) * 0.4, 0.12 + Math.floor(i / 4) * 0.09, 0.3); ctx.root.add(b); popIn(b, i * 0.05);
      tappable(b, () => { sfx.pop(); ctx.root.userData.watch && ctx.root.userData.watch(v); ctx.say('Now playing: ' + name); if (i === clips.length - 1) ctx.award('theater'); }); });
    setTimeout(() => ctx.alive && ctx.root.userData.watch && ctx.root.userData.watch('character'), 900);
    ctx.say('Welcome to the Nia Theater! Tap a title to watch a clip from the Number Garden.');
  } },
  meet_freddy_addie: spotlight(['freddy', 'addie']),
  meet_gwenda_carlo: spotlight(['gwenda', 'carlo']),
  meet_milly_skippy: spotlight(['milly', 'skippy']),
  meet_butterfly: spotlight(['butterfly'], (ctx) => {
    const book = new THREE.Group(); book.position.set(0.38, 0.05, 0); ctx.root.add(book);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.04), [0, 1, 2, 3, 4, 5].map(i => i === 4 ? new THREE.MeshStandardMaterial({ map: ctx.coverTex }) : new THREE.MeshStandardMaterial({ color: i === 0 ? '#fffaf0' : '#5a189a' })));
    cover.position.y = 0.2; cover.rotation.x = -0.15; cover.castShadow = true; book.add(cover); popIn(book, 0.3);
    const btn = label('Get the Book', { size: 0.055, bg: '#ffd23f' }); btn.position.set(0.38, 0.5, 0.05); ctx.root.add(btn);
    const go = () => ctx.openLink({ title: 'Get the Book', sub: 'Find Nia & the Number Garden on Amazon', url: 'https://www.amazon.com/s?k=Nia+and+the+Number+Garden+Darnell+Clark' });
    tappable(btn, go); tappable(book, go);
    ctx.onUpdate((t) => { book.rotation.y = Math.sin(t * 0.8) * 0.4; });
  }),
  passport: { title: 'My Number Garden Stars', build(ctx) {
    const n = ctx.stars.size;
    const cup = new THREE.Group(); const gm = new THREE.MeshStandardMaterial({ color: '#ffc300', metalness: 0.8, roughness: 0.25 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.06, 0.22, 30, 1, true), gm); bowl.material.side = THREE.DoubleSide; bowl.position.y = 0.38; cup.add(bowl);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.16, 12), gm); stem.position.y = 0.2; cup.add(stem);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 20), gm); base.position.y = 0.06; cup.add(base);
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), gm); h.position.set(s * 0.17, 0.4, 0); h.rotation.y = Math.PI / 2; cup.add(h); }
    ctx.root.add(cup); popIn(cup);
    const lb = label(`${n} of 18 chapter stars`, { size: 0.07, bg: '#ffd23f' }); lb.position.set(0, 0.72, 0); ctx.root.add(lb); popIn(lb);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, got = ctx.stars.has(i + 1); const st = label('★', { bg: null, fg: got ? '#ffd23f' : '#cccccc', size: got ? 0.09 : 0.06 }); st.position.set(Math.cos(a) * 0.55, 0.25 + (i % 2) * 0.08, Math.sin(a) * 0.3); ctx.root.add(st); popIn(st, i * 0.04); }
    tappable(cup, () => { sfx.win(); ctx.fx.emit(new THREE.Vector3(0, 0.5, 0), '#ffd23f', 120, 1, -0.8, 2); ctx.say(n >= 18 ? 'You collected every star! You are a true Number Garden mathematician!' : `You have ${n} stars. Visit the map to find the rest!`); });
    ctx.onUpdate((t) => cup.rotation.y = t * 0.6);
    ctx.say(`You have collected ${n} of 18 chapter stars. Tap the trophy to celebrate!`);
  } },

  finale: { title: 'The adventure continues', build(ctx) {
    grass(ctx, 1.2, 0.9);
    const crew = [[makeNia(), 0, 0.42], [makeAddie(), -0.3, 0.3], [makeFreddy(), 0.3, 0.3]];
    crew.forEach(([c, x, s], i) => { place(c, x, 0.02, 0, s); ctx.root.add(c); popIn(c, i * 0.15, s); });
    const end = label('The End…\nkeep wondering!', { size: 0.07 }); end.position.set(0, 0.75, 0); ctx.root.add(end); popIn(end, 0.5);
    tappable(end, () => ctx.goto(0));
    ctx.onUpdate(t => crew.forEach(([c]) => c.userData.idle && c.userData.idle(t)));
    ctx.say('Until next time, little mathematician. Keep wondering, keep solving, and always let your brilliance shine! Tap The End to start again.');
  } },
};

// Which experience pops out of each open spread (index = number of turned sheets)
export const SPREAD_EXP = {
  0: 'cover', 1: 'welcome', 2: 'theater', 3: 'map', 4: 'butterfly', 5: 'gate', 6: 'friends', 7: 'bridge', 8: 'carlo', 9: 'subby',
  10: 'shapes', 11: 'bloom', 12: 'milly', 13: 'everywhere', 14: 'pattern', 15: 'measure', 16: 'time', 17: 'market', 18: 'skippy',
  19: 'heart', 20: 'goodbye', 21: 'dreams', 22: 'draw', 23: 'design', 24: 'sumgame', 25: 'parade', 26: 'meet_freddy_addie', 27: 'meet_gwenda_carlo',
  28: 'meet_milly_skippy', 29: 'meet_butterfly', 30: 'passport', 31: 'finale'
};
