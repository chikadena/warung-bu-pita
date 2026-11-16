// Denah 3D: warung jajanan di teras depan rumah Bu Pita, dibuat prosedural dengan Three.js.
// Nama grup = id zona di data.js, supaya klik objek bisa dipetakan ke data.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ZONA } from "./data.js";

const WARNA_STATUS = { sesuai: 0x22a447, selisih: 0xe5484d, netral: 0x9a9a9a };

// Teras: x -5.6..5.6, z -3 (dinding rumah) .. 2.4 (bibir teras). Jalan di z > 2.4.
// [lebar, dalam, x, z]
const TATA = {
  zona_gudang_stok: [2.0, 1.9, -4.4, -1.95],
  zona_persiapan: [2.6, 1.9, -1.9, -1.95],
  zona_penggorengan: [2.6, 2.0, 3.9, -1.9],
  zona_etalase: [3.6, 1.7, 0.2, 1.25],
  zona_uang: [1.5, 1.5, 3.1, 1.35],
};

const KAMERA_AWAL = { pos: new THREE.Vector3(2, 7.4, 11.6), target: new THREE.Vector3(0, 0.9, -1.0) };

// ---------- tekstur buatan kanvas ----------
function kanvas(w, h, gambar) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  gambar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function bintik(g, w, h, n, warna, alpha) {
  g.fillStyle = warna;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = Math.random() * alpha;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  g.globalAlpha = 1;
}
const acak = (a, b) => a + Math.random() * (b - a);

const TEKS = {
  keramik: () => kanvas(512, 512, (g, w) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = `hsl(32, 22%, ${acak(80, 85)}%)`;
      g.fillRect(i * s, j * s, s, s);
    }
    bintik(g, w, w, 5000, "#7a6a58", 0.18);
    g.strokeStyle = "#b5a794";
    g.lineWidth = 4;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, w); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
  }),
  paving: () => kanvas(512, 512, (g, w) => {
    g.fillStyle = "#6f6f6f";
    g.fillRect(0, 0, w, w);
    const bw = 64, bh = 32;
    for (let y = 0; y < w; y += bh) for (let x = -bw; x < w; x += bw) {
      const ox = (y / bh) % 2 ? bw / 2 : 0;
      g.fillStyle = `hsl(0, 0%, ${acak(52, 62)}%)`;
      g.fillRect(x + ox + 2, y + 2, bw - 4, bh - 4);
    }
    bintik(g, w, w, 9000, "#222", 0.25);
  }),
  tembok: () => kanvas(512, 256, (g, w, h) => {
    g.fillStyle = "#eadfc8";
    g.fillRect(0, 0, w, h);
    bintik(g, w, h, 12000, "#8c7a5c", 0.12);
    bintik(g, w, h, 6000, "#fff", 0.2);
  }),
  kayu: () => kanvas(256, 256, (g, w, h) => {
    g.fillStyle = "#9b6a3f";
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      g.strokeStyle = `rgba(${acak(60, 110)}, ${acak(35, 60)}, 20, ${acak(0.05, 0.25)})`;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 40 + y) * 1.5);
      g.stroke();
    }
  }),
  genteng: () => kanvas(256, 256, (g, w, h) => {
    for (let y = 0; y < h; y += 32) {
      const grad = g.createLinearGradient(0, y, 0, y + 32);
      grad.addColorStop(0, "#b4532c");
      grad.addColorStop(1, "#7d3519");
      g.fillStyle = grad;
      g.fillRect(0, y, w, 32);
      for (let x = 0; x < w; x += 32) { g.fillStyle = "rgba(0,0,0,.15)"; g.fillRect(x, y, 2, 32); }
    }
  }),
  kardus: () => kanvas(128, 128, (g, w, h) => {
    g.fillStyle = "#c49a6c";
    g.fillRect(0, 0, w, h);
    bintik(g, w, h, 800, "#6b4b2a", 0.2);
    g.fillStyle = "#a57c50";
    g.fillRect(w / 2 - 10, 0, 20, h);
  }),
  papan: () => kanvas(1024, 256, (g, w, h) => {
    g.fillStyle = "#fbf3df";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#c0262d";
    g.fillRect(0, 0, w, 18);
    g.fillRect(0, h - 18, w, 18);
    g.textAlign = "center";
    g.font = "800 92px Inter, Arial, sans-serif";
    g.fillText("WARUNG BU PITA", w / 2, 120);
    g.fillStyle = "#2b2b2b";
    g.font = "600 46px Inter, Arial, sans-serif";
    g.fillText("Risol • Bakso Goreng • Pisang Coklat", w / 2, 200);
  }),
  tepung: () => kanvas(128, 128, (g, w) => {
    g.fillStyle = "#f7f7f2";
    g.fillRect(0, 0, w, w);
    g.fillStyle = "#1d58b8";
    g.fillRect(0, 44, w, 40);
    g.fillStyle = "#fff";
    g.font = "700 24px Arial";
    g.textAlign = "center";
    g.fillText("TEPUNG", w / 2, 72);
  }),
  gorden: () => kanvas(128, 128, (g, w, h) => {
    for (let x = 0; x < w; x++) {
      g.fillStyle = `hsl(8, 55%, ${60 + Math.sin(x / 5) * 8}%)`;
      g.fillRect(x, 0, 1, h);
    }
  }),
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const M = {};
function siapkanBahan() {
  const ulang = (t, x, y) => (t.repeat.set(x, y), t);
  Object.assign(M, {
    keramik: std(0xffffff, { map: ulang(TEKS.keramik(), 7, 3.4), roughness: 0.35 }),
    paving: std(0xffffff, { map: ulang(TEKS.paving(), 6, 2.5), roughness: 0.95 }),
    tembok: std(0xffffff, { map: ulang(TEKS.tembok(), 3, 1.5), roughness: 0.95 }),
    kayu: std(0xffffff, { map: TEKS.kayu(), roughness: 0.6 }),
    kayuGelap: std(0x8a5a33, { map: TEKS.kayu(), roughness: 0.6 }),
    genteng: std(0xffffff, { map: ulang(TEKS.genteng(), 8, 2), roughness: 0.8 }),
    kardus: std(0xffffff, { map: TEKS.kardus(), roughness: 0.9 }),
    papan: std(0xffffff, { map: TEKS.papan(), roughness: 0.6 }),
    tepung: std(0xffffff, { map: TEKS.tepung(), roughness: 0.9 }),
    gorden: std(0xffffff, { map: TEKS.gorden(), roughness: 1 }),
    putih: std(0xf4f1ea, { roughness: 0.5 }),
    semen: std(0xb9b4ab, { roughness: 1 }),
    plint: std(0x6d6a65, { roughness: 0.9 }),
    besi: std(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }),
    besiGelap: std(0x2d2f33, { metalness: 0.6, roughness: 0.4 }),
    aluminium: std(0xd7dade, { metalness: 0.9, roughness: 0.25 }),
    kaca: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false }),
    kacaJendela: new THREE.MeshPhysicalMaterial({ color: 0x9fb8c8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 }),
    plastikMerah: std(0xd4282f, { roughness: 0.45 }),
    plastikBiru: std(0x2f6fd0, { roughness: 0.45 }),
    plastikHijau: std(0x2fa35a, { roughness: 0.45, side: THREE.DoubleSide }),
    baskomMerah: std(0xd4282f, { roughness: 0.45, side: THREE.DoubleSide }),
    wajan: std(0x2d2f33, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }),
    rak: std(0x5b6f8c, { roughness: 0.5 }),
    lpg: std(0x2f8f3a, { roughness: 0.35, metalness: 0.2 }),
    minyak: std(0xd9a11e, { roughness: 0.05, metalness: 0.1 }),
    jeriken: std(0xf2c230, { roughness: 0.35 }),
    adonan: std(0xf1dfb8, { roughness: 0.9 }),
    goreng: std(0xb06a25, { roughness: 0.7 }),
    gorengTua: std(0x7a4318, { roughness: 0.7 }),
    pisang: std(0xe9c35a, { roughness: 0.6 }),
    coklat: std(0x3e2414, { roughness: 0.6 }),
    risol: std(0xd9a55a, { roughness: 0.8 }),
    daun: std(0x3f7f3a, { roughness: 0.8 }),
    pot: std(0xa9532f, { roughness: 0.9 }),
    karung: std(0xe8dfcc, { roughness: 1 }),
    kertas: std(0xfafafa, { roughness: 1 }),
    uang: std(0x3c8d6a, { roughness: 0.9 }),
    uangMerah: std(0xd2525a, { roughness: 0.9 }),
    emas: std(0xd4a640, { metalness: 0.9, roughness: 0.3 }),
    bohlam: new THREE.MeshStandardMaterial({ color: 0xfff2c8, emissive: 0xffd27a, emissiveIntensity: 1.5 }),
  });
}

// ---------- pembentuk (y = alas benda) ----------
function pasang(induk, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  induk.add(m);
  return m;
}
function balok(induk, w, h, d, mat, x, y, z, r = 0.015) {
  const geo = r ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  return pasang(induk, geo, mat, x, y + h / 2, z);
}
function tabung(induk, rAtas, rBawah, h, mat, x, y, z, seg = 28) {
  return pasang(induk, new THREE.CylinderGeometry(rAtas, rBawah, h, seg), mat, x, y + h / 2, z);
}
function bola(induk, r, mat, x, y, z) {
  return pasang(induk, new THREE.SphereGeometry(r, 16, 12), mat, x, y, z);
}
function kapsul(induk, r, p, mat, x, y, z, rotZ = Math.PI / 2, rotY = 0) {
  const m = pasang(induk, new THREE.CapsuleGeometry(r, p, 4, 10), mat, x, y, z);
  m.rotation.set(0, rotY, rotZ, "YXZ");
  return m;
}
function putar(induk, titik, mat, x, y, z) {
  return pasang(induk, new THREE.LatheGeometry(titik.map(([a, b]) => new THREE.Vector2(a, b)), 36), mat, x, y, z);
}
function meja(induk, w, d, h, matAtas, matKaki, x = 0, z = 0) {
  balok(induk, w, 0.05, d, matAtas, x, h - 0.05, z, 0.01);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tabung(induk, 0.022, 0.022, h - 0.05, matKaki, x + sx * (w / 2 - 0.07), 0, z + sz * (d / 2 - 0.07), 10);
}
function rangka(induk, w, h, d, t, mat, x, y, z) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) balok(induk, t, h, t, mat, x + sx * (w / 2 - t / 2), y, z + sz * (d / 2 - t / 2), 0);
  for (const yy of [y, y + h - t]) for (const sz of [-1, 1]) balok(induk, w, t, t, mat, x, yy, z + sz * (d / 2 - t / 2), 0);
  for (const yy of [y, y + h - t]) for (const sx of [-1, 1]) balok(induk, t, t, d, mat, x + sx * (w / 2 - t / 2), yy, z, 0);
}
function kursiPlastik(induk, x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  balok(g, 0.42, 0.04, 0.42, M.plastikMerah, 0, 0.42, 0, 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const k = tabung(g, 0.022, 0.03, 0.42, M.plastikMerah, sx * 0.18, 0, sz * 0.18, 10);
    k.rotation.set(sz * 0.08, 0, -sx * 0.08);
  }
  balok(g, 0.42, 0.34, 0.03, M.plastikMerah, 0, 0.46, -0.21, 0.015).rotation.x = -0.12;
  induk.add(g);
}
function tanaman(induk, x, z, s = 1) {
  tabung(induk, 0.2 * s, 0.15 * s, 0.32 * s, M.pot, x, 0, z);
  for (let i = 0; i < 6; i++) {
    bola(induk, acak(0.14, 0.2) * s, M.daun, x + acak(-0.12, 0.12) * s, (0.42 + acak(0, 0.35)) * s, z + acak(-0.12, 0.12) * s).scale.y = 1.3;
  }
}

// ---------- isi tiap zona (koordinat lokal) ----------
const ISI = {
  zona_gudang_stok(g) {
    // rak plastik 3 susun menempel ke dinding
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tabung(g, 0.025, 0.025, 1.45, M.rak, sx * 0.62, 0, -0.55 + sz * 0.22, 10);
    for (const y of [0.12, 0.6, 1.08]) balok(g, 1.34, 0.04, 0.5, M.rak, 0, y, -0.55, 0.01);
    balok(g, 0.5, 0.36, 0.4, M.kardus, -0.32, 1.12, -0.55);
    balok(g, 0.44, 0.3, 0.38, M.kardus, 0.28, 1.12, -0.55);
    for (let i = 0; i < 4; i++) {
      tabung(g, 0.06, 0.06, 0.28, M.minyak, -0.45 + i * 0.16, 0.64, -0.6, 16);
      tabung(g, 0.025, 0.025, 0.04, M.plastikMerah, -0.45 + i * 0.16, 0.92, -0.6, 10);
    }
    tabung(g, 0.09, 0.09, 0.16, M.coklat, 0.38, 0.64, -0.55);
    tabung(g, 0.09, 0.09, 0.16, M.coklat, 0.38, 0.8, -0.55);
    for (let i = 0; i < 3; i++) kapsul(g, 0.12, 0.3, M.karung, -0.35 + i * 0.32, 0.29, -0.55, Math.PI / 2, 0);
    // keranjang pisang & karung di lantai
    putar(g, [[0, 0], [0.22, 0], [0.3, 0.18], [0.31, 0.2]], M.kayuGelap, 0.45, 0, 0.45);
    for (let i = 0; i < 9; i++) {
      kapsul(g, 0.035, 0.16, M.pisang, 0.45 + acak(-0.15, 0.15), 0.22 + acak(0, 0.06), 0.45 + acak(-0.12, 0.12), acak(1.2, 1.9), acak(0, Math.PI));
    }
    kapsul(g, 0.22, 0.35, M.karung, -0.4, 0.3, 0.45, 0.15, 0).scale.z = 0.8;
  },
  zona_persiapan(g) {
    meja(g, 2.0, 0.85, 0.76, M.kayu, M.besi, 0, -0.35);
    // baskom adonan & baskom irisan pisang
    putar(g, [[0, 0], [0.17, 0], [0.25, 0.13], [0.27, 0.14]], M.plastikHijau, -0.6, 0.76, -0.4);
    tabung(g, 0.22, 0.2, 0.03, M.adonan, -0.6, 0.85, -0.4);
    putar(g, [[0, 0], [0.13, 0], [0.19, 0.1], [0.2, 0.11]], M.baskomMerah, -0.05, 0.76, -0.55);
    for (let i = 0; i < 6; i++) tabung(g, 0.04, 0.04, 0.02, M.pisang, -0.05 + acak(-0.08, 0.08), 0.8 + i * 0.012, -0.55 + acak(-0.08, 0.08), 12);
    // talenan + pisau
    balok(g, 0.4, 0.025, 0.26, M.kayuGelap, 0.15, 0.76, -0.2, 0.01);
    balok(g, 0.18, 0.006, 0.035, M.besi, 0.12, 0.79, -0.18, 0);
    balok(g, 0.08, 0.016, 0.03, M.besiGelap, 0.26, 0.785, -0.18, 0.005);
    // tumpukan kulit risol & risol yang sudah digulung
    for (let i = 0; i < 8; i++) tabung(g, 0.11, 0.11, 0.006, M.adonan, 0.6, 0.77 + i * 0.007, -0.55, 24);
    tabung(g, 0.2, 0.2, 0.015, M.putih, 0.62, 0.76, -0.15, 28);
    for (let i = 0; i < 7; i++) kapsul(g, 0.03, 0.1, M.adonan, 0.52 + (i % 4) * 0.06, 0.8, -0.2 + Math.floor(i / 4) * 0.09, Math.PI / 2, 0.2);
    // karung tepung & bangku plastik
    balok(g, 0.26, 0.36, 0.16, M.tepung, -0.85, 0.76, -0.62, 0.05);
    tabung(g, 0.16, 0.14, 0.04, M.plastikBiru, 0.1, 0.42, 0.35);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      tabung(g, 0.018, 0.024, 0.42, M.plastikBiru, 0.1 + Math.cos(a) * 0.11, 0, 0.35 + Math.sin(a) * 0.11, 8)
        .rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    }
  },
  zona_penggorengan(g) {
    meja(g, 1.8, 0.7, 0.72, M.besi, M.besi, -0.15, -0.45);
    // kompor gas 2 tungku
    balok(g, 1.0, 0.1, 0.45, M.besiGelap, -0.2, 0.72, -0.45, 0.02);
    for (const x of [-0.45, 0.05]) pasang(g, new THREE.TorusGeometry(0.08, 0.015, 8, 20), M.besiGelap, x, 0.83, -0.45).rotation.x = Math.PI / 2;
    // wajan berisi minyak & gorengan
    putar(g, Array.from({ length: 12 }, (_, i) => {
      const t = (i / 11) * Math.PI * 0.46;
      return [Math.sin(t) * 0.36 + 0.001, (1 - Math.cos(t)) * 0.32];
    }), M.wajan, 0.05, 0.84, -0.45);
    for (const s of [-1, 1]) pasang(g, new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), M.besiGelap, 0.05 + s * 0.4, 0.98, -0.45).rotation.set(Math.PI / 2, 0, -s * Math.PI / 2);
    tabung(g, 0.3, 0.3, 0.008, M.minyak, 0.05, 0.94, -0.45, 32);
    for (let i = 0; i < 7; i++) bola(g, 0.045, i % 2 ? M.goreng : M.gorengTua, 0.05 + acak(-0.18, 0.18), 0.955, -0.45 + acak(-0.15, 0.15));
    // panci tertutup
    tabung(g, 0.16, 0.15, 0.2, M.besi, -0.45, 0.84, -0.45);
    tabung(g, 0.165, 0.165, 0.02, M.besi, -0.45, 1.04, -0.45);
    bola(g, 0.025, M.besiGelap, -0.45, 1.07, -0.45);
    // tirisan gorengan
    balok(g, 0.32, 0.04, 0.26, M.besi, 0.55, 0.72, -0.45, 0.01);
    for (let i = 0; i < 6; i++) kapsul(g, 0.035, 0.12, M.risol, 0.46 + (i % 3) * 0.09, 0.79, -0.5 + Math.floor(i / 3) * 0.1);
    // tabung LPG 3 kg + selang
    tabung(g, 0.15, 0.15, 0.36, M.lpg, 0.95, 0, -0.1);
    bola(g, 0.15, M.lpg, 0.95, 0.36, -0.1).scale.y = 0.5;
    tabung(g, 0.04, 0.04, 0.08, M.besi, 0.95, 0.42, -0.1, 12);
    const selang = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.95, 0.5, -0.1), new THREE.Vector3(0.85, 0.35, -0.25), new THREE.Vector3(0.5, 0.55, -0.62), new THREE.Vector3(0.25, 0.76, -0.62),
    ]);
    pasang(g, new THREE.TubeGeometry(selang, 24, 0.014, 6), M.besiGelap, 0, 0, 0);
    // jeriken minyak
    balok(g, 0.26, 0.4, 0.18, M.jeriken, -0.85, 0, 0.25, 0.04);
  },
  zona_etalase(g) {
    // meja kayu dengan papan nama menghadap jalan
    meja(g, 3.0, 0.8, 0.82, M.kayu, M.kayuGelap, 0, 0);
    balok(g, 2.9, 0.03, 0.7, M.kayuGelap, 0, 0.18, 0, 0.005);
    balok(g, 2.9, 0.34, 0.03, M.papan, 0, 0.42, 0.39, 0.005);
    // etalase kaca berbingkai aluminium
    rangka(g, 2.7, 0.6, 0.66, 0.025, M.aluminium, 0, 0.82, -0.02);
    balok(g, 2.68, 0.58, 0.64, M.kaca, 0, 0.83, -0.02, 0).castShadow = false;
    balok(g, 2.66, 0.012, 0.6, M.kaca, 0, 1.1, -0.02, 0).castShadow = false;
    // nampan jajanan: bakso goreng, pisang coklat, risol
    const nampan = [
      (x, z) => bola(g, 0.04, M.goreng, x, 0.9, z),
      (x, z) => { kapsul(g, 0.035, 0.13, M.pisang, x, 0.9, z, Math.PI / 2, 0.3); balok(g, 0.1, 0.012, 0.03, M.coklat, x, 0.93, z, 0.005).rotation.y = 0.3; },
      (x, z) => kapsul(g, 0.035, 0.12, M.risol, x, 0.9, z, Math.PI / 2, -0.2),
    ];
    nampan.forEach((isi, k) => {
      const cx = -0.88 + k * 0.88;
      balok(g, 0.78, 0.015, 0.5, M.putih, cx, 0.84, -0.02, 0.005);
      for (let i = 0; i < 9; i++) isi(cx - 0.24 + (i % 3) * 0.24 + acak(-0.03, 0.03), -0.15 + Math.floor(i / 3) * 0.13);
    });
    // stoples kerupuk & capitan di atas etalase
    for (const x of [-1.05, -0.75]) {
      tabung(g, 0.1, 0.1, 0.26, M.kaca, x, 1.43, -0.05).castShadow = false;
      tabung(g, 0.105, 0.105, 0.04, M.plastikMerah, x, 1.69, -0.05);
      for (let i = 0; i < 5; i++) balok(g, 0.07, 0.012, 0.05, M.pisang, x + acak(-0.04, 0.04), 1.45 + i * 0.04, -0.05 + acak(-0.04, 0.04), 0.004);
    }
    balok(g, 0.25, 0.012, 0.03, M.besi, 0.9, 1.43, 0.1, 0.004).rotation.y = 0.4;
    balok(g, 0.22, 0.04, 0.16, M.kertas, 1.15, 1.43, -0.1, 0.01);
  },
  zona_uang(g) {
    // bangku kayu kecil berisi kaleng uang & buku catatan (tanpa mesin kasir)
    meja(g, 0.8, 0.55, 0.6, M.kayuGelap, M.kayuGelap, 0, 0);
    tabung(g, 0.13, 0.13, 0.15, M.plastikBiru, -0.15, 0.6, 0);
    tabung(g, 0.135, 0.135, 0.02, M.aluminium, -0.15, 0.75, 0.02).rotation.x = -0.5;
    for (let i = 0; i < 4; i++) {
      balok(g, 0.11, 0.004, 0.05, i % 2 ? M.uang : M.uangMerah, -0.15 + acak(-0.05, 0.05), 0.74, acak(-0.04, 0.04), 0)
        .rotation.set(acak(-0.6, -1.2), acak(0, Math.PI), 0);
    }
    balok(g, 0.24, 0.025, 0.18, M.kertas, 0.2, 0.6, -0.02, 0.004);
    balok(g, 0.24, 0.006, 0.18, M.plastikBiru, 0.2, 0.6, -0.02, 0.002);
    balok(g, 0.14, 0.008, 0.008, M.besiGelap, 0.22, 0.63, 0.02, 0).rotation.y = 0.6;
  },
};

function bangunRumah(scene) {
  // lantai teras keramik + bibir teras
  balok(scene, 11.2, 0.3, 5.4, M.keramik, 0, -0.3, -0.3, 0);
  balok(scene, 11.2, 0.3, 0.12, M.semen, 0, -0.3, 2.42, 0.01);
  // jalan paving
  balok(scene, 20, 0.05, 6, M.paving, 0, -0.35, 5.45, 0);
  // dinding depan rumah
  balok(scene, 11.2, 3.3, 0.25, M.tembok, 0, 0, -3.12, 0);
  balok(scene, 11.22, 0.32, 0.27, M.plint, 0, 0, -3.12, 0);
  // pintu kayu
  balok(scene, 1.06, 2.2, 0.08, M.putih, 0.2, 0, -2.98, 0.01);
  balok(scene, 0.9, 2.1, 0.06, M.kayuGelap, 0.2, 0, -2.95, 0.01);
  for (const y of [0.3, 1.2]) balok(scene, 0.7, 0.7, 0.02, M.kayu, 0.2, y, -2.91, 0.01);
  bola(scene, 0.035, M.emas, 0.55, 1.05, -2.9);
  // jendela dengan gorden
  for (const x of [-2.4, 3.9]) {
    balok(scene, 1.5, 1.2, 0.08, M.putih, x, 0.95, -2.98, 0.01);
    balok(scene, 1.36, 1.06, 0.02, M.gorden, x, 1.02, -3.0, 0);
    balok(scene, 1.36, 1.06, 0.02, M.kacaJendela, x, 1.02, -2.94, 0);
    balok(scene, 0.05, 1.06, 0.04, M.putih, x, 1.02, -2.94, 0);
    balok(scene, 1.6, 0.06, 0.18, M.putih, x, 0.92, -2.9, 0.01);
  }
  // atap genteng menjorok
  balok(scene, 11.8, 0.1, 1.5, M.genteng, 0, 3.1, -2.55, 0).rotation.x = 0.28;
  balok(scene, 11.8, 0.18, 0.04, M.putih, 0, 2.86, -1.84, 0);
  // lampu teras
  tabung(scene, 0.06, 0.06, 0.1, M.putih, 0.2, 2.62, -2.9);
  bola(scene, 0.07, M.bohlam, 0.2, 2.56, -2.82).castShadow = false;
  // pagar tembok samping
  for (const x of [-5.55, 5.55]) {
    balok(scene, 0.15, 0.9, 5.4, M.tembok, x, 0, -0.3, 0.01);
    balok(scene, 0.22, 0.06, 5.45, M.semen, x, 0.9, -0.3, 0.01);
  }
  // dekorasi: kursi pembeli & pot tanaman
  kursiPlastik(scene, -2.5, 1.5, 0.5);
  kursiPlastik(scene, -1.8, 1.95, -0.3);
  tanaman(scene, -1.15, -2.65, 0.9);
  tanaman(scene, 1.6, -2.65, 0.9);
  tanaman(scene, -5.0, 1.9, 1.1);
}

function persegiBulat(w, d, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return s;
}

export function buatDenah(wadah, { onPilih }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  wadah.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "lapisan-label";
  wadah.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.copy(KAMERA_AWAL.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minDistance = 3.5;
  controls.maxDistance = 26;
  controls.enablePan = false;
  controls.target.copy(KAMERA_AWAL.target);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a8170, 1.1));
  const matahari = new THREE.DirectionalLight(0xfff1dc, 2.6);
  matahari.position.set(7, 11, 8);
  matahari.castShadow = true;
  matahari.shadow.mapSize.set(2048, 2048);
  Object.assign(matahari.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  matahari.shadow.bias = -0.0004;
  matahari.shadow.normalBias = 0.02;
  scene.add(matahari);
  const lampu = new THREE.PointLight(0xffd59a, 2.5, 6, 2);
  lampu.position.set(0.2, 2.45, -2.6);
  scene.add(lampu);

  siapkanBahan();
  bangunRumah(scene);

  // Zona: tanda lantai berwarna status + isi + label.
  const zona = {};
  for (const [id, [w, d, x, z]] of Object.entries(TATA)) {
    const g = new THREE.Group();
    g.name = id;
    g.position.set(x, 0, z);

    const isi = new THREE.Mesh(new THREE.ShapeGeometry(persegiBulat(w, d, 0.18)), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    const bentukTepi = persegiBulat(w, d, 0.18);
    bentukTepi.holes.push(persegiBulat(w - 0.08, d - 0.08, 0.14));
    const tepi = new THREE.Mesh(new THREE.ShapeGeometry(bentukTepi), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    for (const m of [isi, tepi]) {
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.006;
      m.renderOrder = 1;
      g.add(m);
    }
    ISI[id](g);

    const pin = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 16), new THREE.MeshStandardMaterial({ color: WARNA_STATUS.selisih, emissive: WARNA_STATUS.selisih, emissiveIntensity: 0.6 }));
    pin.rotation.x = Math.PI;
    pin.position.set(0, 2.2, 0);
    pin.visible = false;
    g.add(pin);

    const el = document.createElement("button");
    el.type = "button";
    el.className = "label-zona";
    el.textContent = ZONA[id];
    el.addEventListener("click", () => onPilih(id));
    const label = new CSS2DObject(el);
    label.position.set(0, 1.85, 0);
    g.add(label);

    g.traverse((o) => (o.userData.zona = id));
    scene.add(g);
    zona[id] = { g, isi, tepi, pin, el, status: "netral", pusat: new THREE.Vector3(x, 0.7, z) };
  }

  // Klik & hover objek 3D.
  const ray = new THREE.Raycaster();
  const titik = new THREE.Vector2();
  const zonaDi = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    titik.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(titik, camera);
    return ray.intersectObjects(Object.values(zona).map((z) => z.g), true)[0]?.object.userData.zona;
  };
  let tekan = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (tekan = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => {
    // abaikan klik bila pengguna sedang memutar kamera
    if (!tekan || Math.hypot(e.clientX - tekan[0], e.clientY - tekan[1]) > 5) return;
    const id = zonaDi(e);
    if (id) onPilih(id);
  });
  let hover = null;
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.buttons) return;
    const id = zonaDi(e);
    if (id === hover) return;
    hover = id;
    renderer.domElement.style.cursor = id ? "pointer" : "grab";
    for (const [zid, z] of Object.entries(zona)) z.el.classList.toggle("hover", zid === id);
    perbaruiTanda();
  });

  let tujuan = null;
  let terpilih = null;
  function perbaruiTanda() {
    for (const [id, z] of Object.entries(zona)) {
      const aktif = id === terpilih || id === hover;
      z.isi.material.color.set(WARNA_STATUS[z.status]);
      z.tepi.material.color.set(id === terpilih && z.status === "netral" ? 0x111111 : WARNA_STATUS[z.status]);
      z.isi.material.opacity = (z.status === "netral" ? 0.06 : 0.16) + (aktif ? 0.16 : 0);
      z.tepi.material.opacity = id === terpilih ? 1 : z.status === "netral" ? 0.35 : 0.75;
    }
  }

  // jarak kamera agar lebar teras ±12 m pas dengan lebar layar
  function jarakMuat() {
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    return 6.2 / Math.tan(hfov / 2);
  }

  function pilih(id) {
    terpilih = id;
    for (const [zid, z] of Object.entries(zona)) z.el.classList.toggle("aktif", zid === id);
    perbaruiTanda();
    // layar potret (HP) butuh kamera lebih jauh agar zona tetap utuh
    const jauh = camera.aspect < 1.1 ? 1.35 : 1;
    tujuan = id
      ? { target: zona[id].pusat.clone(), pos: zona[id].pusat.clone().add(new THREE.Vector3(2.2, 3.6, 4.6).multiplyScalar(jauh)) }
      : {
          target: KAMERA_AWAL.target.clone(),
          // potret: kamera lebih tinggi & jauh supaya lebar teras (11 m) muat di layar sempit
          pos: camera.aspect < 1.1 ? KAMERA_AWAL.target.clone().add(new THREE.Vector3(0.04, 0.8, 0.6).normalize().multiplyScalar(jarakMuat())) : KAMERA_AWAL.pos.clone(),
        };
  }

  function setStatus(peta) {
    for (const [id, z] of Object.entries(zona)) {
      z.status = peta[id] ?? "netral";
      z.pin.visible = z.status === "selisih";
      z.el.dataset.status = z.status;
    }
    perbaruiTanda();
  }

  const ukur = () => {
    const { clientWidth: w, clientHeight: h } = wadah;
    if (!w || !h) return;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 1.1 ? 50 : 36;
    // geser pusat pandang ke atas agar denah tidak tertutup panel kaca di dasar kartu
    // (di HP panel pindah ke bawah kanvas, jadi tidak perlu digeser)
    const panel = wadah.parentElement.querySelector(".panel-kaca");
    const tertutup = panel && getComputedStyle(panel).position === "absolute";
    camera.setViewOffset(w, h, 0, tertutup ? Math.round(h * 0.13) : 0, w, h);
    camera.updateProjectionMatrix();
    // kanvas bisa baru tampil setelah login / layar diputar: hitung ulang posisi awal sesuai ukuran baru
    if (!terpilih) pilih(null);
  };
  new ResizeObserver(ukur).observe(wadah);
  ukur();
  pilih(null);

  const jam = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = jam.getElapsedTime();
    if (tujuan) {
      camera.position.lerp(tujuan.pos, 0.08);
      controls.target.lerp(tujuan.target, 0.08);
      if (camera.position.distanceTo(tujuan.pos) < 0.02) tujuan = null;
    }
    for (const z of Object.values(zona)) if (z.pin.visible) z.pin.position.y = 2.2 + Math.sin(t * 3) * 0.1;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  });
  controls.addEventListener("start", () => (tujuan = null));

  return { pilih, setStatus, get terpilih() { return terpilih; } };
}
