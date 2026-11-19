// Denah 3D: warung jajanan di teras depan rumah Bu Pita.
// Modelnya dibuat di Blender (blender/denah_warung.blend) lalu diekspor ke glTF; Three.js hanya memuat dan
// menambahkan interaksi. Nama objek zona di Blender = id zona di data.js, supaya klik bisa dipetakan ke data.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ZONA } from "./data.js";
import urlModel from "./assets/denah-warung.glb?url";

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

  // Zona: tanda lantai berwarna status + label. Isi (perabot) datang dari model Blender.
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

  // Muat model dari Blender: node zona_* dipindah ke grup zona (supaya klik, label, dan status tetap berfungsi),
  // sisanya (rumah, teras, jalan, tanaman, kursi) langsung ke scene.
  new GLTFLoader().loadAsync(urlModel).then((gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      if (o.material?.transparent) o.material.depthWrite = false; // kaca etalase & jendela
    });
    for (const [id, z] of Object.entries(zona)) {
      const node = model.getObjectByName(id);
      if (!node) { console.warn(`Model 3D tidak punya objek "${id}"`); continue; }
      while (node.children.length) z.g.add(node.children[0]);
      node.removeFromParent();
      z.g.traverse((o) => (o.userData.zona = id));
    }
    scene.add(model);
  }).catch((e) => console.error("Gagal memuat model 3D:", e));

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
