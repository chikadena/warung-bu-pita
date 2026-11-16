import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./style.css";
import {
  subscribeRealtime, ambilData, simpanHitunganFisik, sesiSaya, masuk, masukContoh, keluar, pakaiSupabase, ZONA,
  catatProduksi, selesaikanProduksi, catatPenjualan, ubahStok,
} from "./data.js";
import { buatDenah } from "./scene.js";
import { tanyaSistem, ringkasZona } from "./tanya.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const rpRingkas = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt" : Math.round(n / 1000) + "rb");
const angka = (n) => n.toLocaleString("id-ID");
const tanda = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + angka(Math.abs(n));

const HALAMAN = {
  beranda: "Ringkasan",
  produksi: "Produksi",
  persediaan: "Persediaan",
  penjualan: "Penjualan",
  kesesuaian: "Cek Kesesuaian",
  laporan: "Laporan",
};
const TAB = ["produksi", "persediaan", "penjualan"];

const state = { data: null, halaman: "beranda", tab: "persediaan", zona: null, periode: "harian" };

const denah = buatDenah($("#denah"), { onPilih: (id) => pilihZona(id) });

// ---------- turunan data ----------
const sesuai = (c) => c.fisik === c.digital;
// UC-07: stok tercatat di bawah batas minimum yang diatur Operator.
const menipis = (c) => c.minimum != null && c.digital < c.minimum;
const cekTab = (tab) => state.data.cek.filter((c) => !tab || c.tab === tab);
function statusZona(tab) {
  const peta = {};
  for (const id of Object.keys(ZONA)) {
    const isi = cekTab(tab).filter((c) => c.zona === id);
    peta[id] = !isi.length ? "netral" : isi.every(sesuai) ? "sesuai" : "selisih";
  }
  return peta;
}
const PERIODE = {
  harian: { judul: "Hari Ini", label: "Hari ini:", hari: (d) => d.harian.slice(-1) },
  mingguan: { judul: "7 Hari Terakhir", label: "7 hari terakhir:", hari: (d) => d.minggu },
  bulanan: { judul: "Bulan Ini", label: "Bulan ini:", hari: (d) => d.bulan },
};
// Total omzet/transaksi/pembeli/produk untuk periode terpilih.
function periode() {
  const d = state.data;
  const hari = PERIODE[state.periode].hari(d);
  const jumlah = (k) => hari.reduce((n, h) => n + h[k], 0);
  const produk = {};
  for (const p of d.produk) produk[p.id] = hari.reduce((n, h) => n + (h.produk[p.id] ?? 0), 0);
  return { omzet: jumlah("omzet"), transaksi: jumlah("transaksi"), pembeli: jumlah("pembeli"), produk, hari };
}
const tgl = (s, opsi = { day: "numeric", month: "short", year: "numeric" }) => new Date(s + "T00:00:00").toLocaleDateString("id-ID", opsi);
function rentang(hari) {
  const [a, b] = [hari[0]?.tanggal, hari.at(-1)?.tanggal];
  if (!a) return "";
  if (a === b) return tgl(a, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return a.slice(0, 7) === b.slice(0, 7) ? `${Number(a.slice(8))} – ${tgl(b)}` : `${tgl(a)} – ${tgl(b)}`;
}

// ---------- kartu ----------
function renderOmzet() {
  const p = periode();
  $("#h-omzet").textContent = "Omzet " + PERIODE[state.periode].judul;
  $("#omzet").textContent = rp(p.omzet);
  $("#omzet-produk").innerHTML = [...state.data.produk]
    .sort((a, b) => p.produk[b.id] - p.produk[a.id])
    .map((pr) => `<li>
        <span class="nama">${esc(pr.nama)}</span><span class="nilai">${rp(p.produk[pr.id])}</span>
        <span class="bar" role="img" aria-label="${Math.round((p.produk[pr.id] / p.omzet) * 100)}% dari omzet"><i style="--w:${(p.produk[pr.id] / p.omzet) * 100}%;--c:${pr.warna}"></i></span>
      </li>`).join("");
}

function renderFunnel() {
  const P = state.data.produk;
  const dibuat = P.reduce((n, p) => n + p.dibuat, 0);
  const siap = P.reduce((n, p) => n + p.dibuat - p.rusak, 0);
  const terjual = P.reduce((n, p) => n + p.terjual, 0);
  const sisa = dibuat - terjual;
  const tahap = [
    { label: "Diproduksi", n: dibuat, tip: `${dibuat} pcs digoreng/digulung hari ini` },
    { label: "Siap jual", n: siap, tip: `${siap} pcs | konversi ${Math.round((siap / dibuat) * 100)}% | rusak −${dibuat - siap}` },
    { label: "Terjual", n: terjual, tip: `${terjual} pcs | konversi ${Math.round((terjual / siap) * 100)}% | susut −${Math.round((1 - terjual / siap) * 100)}%` },
    { label: "Sisa/rusak", n: sisa, tip: `${sisa} pcs | ${Math.round((sisa / dibuat) * 100)}% dari produksi` },
  ];
  const aktif = $("#funnel .kolom.aktif")?.dataset.i ?? "2";
  $("#funnel").innerHTML = tahap.map((t, i) => `
    <button type="button" class="kolom${String(i) === aktif ? " aktif" : ""}" data-i="${i}" aria-label="${t.label}: ${t.tip}">
      <span class="kol-label">${t.label}</span>
      <span class="kol-angka">${angka(t.n)}</span>
      <span class="kol-area"><i style="--h:${(t.n / dibuat) * 100}%"></i></span>
      <span class="tooltip">${t.tip}</span>
    </button>`).join("");
}

function renderDot(idEl, kunci, kelas) {
  const d = state.data.minggu;
  const maks = Math.max(...d.map((h) => h[kunci]));
  const iPuncak = d.findIndex((h) => h[kunci] === maks);
  const NAMA = { Sen: "Senin", Sel: "Selasa", Rab: "Rabu", Kam: "Kamis", Jum: "Jumat", Sab: "Sabtu", Min: "Minggu" };
  const p = periode();
  const kolom = d.map((h, i) => {
    const isi = Math.max(1, Math.round((h[kunci] / maks) * 7));
    const titik = Array.from({ length: 7 }, (_, r) => `<i class="${r < isi ? (i === iPuncak ? "penuh" : "isi") : ""}"></i>`).join("");
    return `<span class="dot-kol" title="${NAMA[h.hari]}: ${angka(h[kunci])}">${i === iPuncak ? `<b class="gelembung">Puncak: ${NAMA[h.hari]}</b>` : ""}${titik}</span>`;
  }).join("");
  $(idEl).innerHTML = `
    <span class="dot-angka"><strong class="angka-besar">${angka(p[kunci])}</strong><small>${PERIODE[state.periode].judul.toLowerCase()}</small></span>
    <span class="dot-matrix ${kelas}" role="img" aria-label="${kunci} 7 hari terakhir, puncak hari ${NAMA[d[iPuncak].hari]}">${kolom}</span>`;
}

function renderInsight() {
  const d = state.data;
  const skor = Math.round((d.cek.filter(sesuai).length / d.cek.length) * 100);
  const beda = d.cek.filter((c) => !sesuai(c));
  const naik = skor - d.skorMingguLalu;
  $("#insight-skor").textContent = skor + "%";
  $("#insight-judul").textContent = `Kesesuaian digital vs fisik ${naik >= 0 ? "naik" : "turun"} ${Math.abs(naik)}% dibanding minggu lalu`;
  $("#insight-teks").textContent = `${d.rekonsiliasi.selesai} dari ${d.rekonsiliasi.ditemukan} selisih stok minggu ini sudah direkonsiliasi.` +
    (beda.length ? ` Tersisa: ${beda.map((c) => `${c.nama} di ${ZONA[c.zona].toLowerCase()}`).join(", ")}.` : "");
  $("#insight-bar").style.width = (d.rekonsiliasi.selesai / d.rekonsiliasi.ditemukan) * 100 + "%";
  const notif = $(".titik-notif");
  const tipis = d.cek.filter(menipis);
  notif.hidden = !beda.length && !tipis.length;
  const pesan = [beda.length && `${beda.length} selisih belum beres`, tipis.length && `${tipis.length} stok menipis`].filter(Boolean).join(", ");
  $("#lonceng").setAttribute("aria-label", pesan ? `${pesan}. Buka Cek Kesesuaian` : "Tidak ada peringatan");
  $("#lonceng").title = pesan || "Tidak ada peringatan";
}

function renderJam() {
  const J = state.data.perJam;
  const maks = Math.max(...J.map((j) => j.omzet));
  $("#step-jam").innerHTML = `<div class="step-area">${J.map((j) => `
      <span class="step-kol${j.omzet === maks ? " puncak" : ""}" style="--h:${(j.omzet / maks) * 100}%" tabindex="0" aria-label="Jam ${j.jam}.00: ${rp(j.omzet)}">
        ${j.omzet === maks ? `<b class="gelembung">${rpRingkas(j.omzet)}</b>` : ""}
        <span class="tooltip">${String(j.jam).padStart(2, "0")}.00 · ${rp(j.omzet)}</span>
      </span>`).join("")}</div>
    <div class="step-sumbu">${J.map((j, i) => `<span>${i % 2 ? "" : String(j.jam).padStart(2, "0")}</span>`).join("")}</div>`;
}

function barisCek(c, tampilZona = true) {
  const ok = sesuai(c);
  const nilai = (n) => (c.satuan === "Rp" ? rp(n) : `${angka(n)} ${esc(c.satuan)}`);
  return `<tr data-zona="${c.zona}" data-tab="${c.tab}" data-id="${c.id}" tabindex="0" class="${c.zona === state.zona ? "terpilih" : ""}">
    <td>${esc(c.nama)}${tampilZona ? `<small>${ZONA[c.zona]}</small>` : ""}</td>
    <td class="num">${nilai(c.digital)}</td><td class="num">${nilai(c.fisik)}</td>
    <td><span class="status ${ok ? "ok" : "beda"}">${ok ? "Sesuai" : "Selisih " + (c.satuan === "Rp" ? rp(c.fisik - c.digital) : tanda(c.fisik - c.digital) + " " + esc(c.satuan))}</span></td>
  </tr>`;
}
const KEPALA_CEK = `<thead><tr><th>Item</th><th class="num">Digital</th><th class="num">Fisik</th><th>Status</th></tr></thead>`;

function renderStok() {
  const isi = cekTab("persediaan").sort((a, b) => sesuai(a) - sesuai(b));
  const ok = isi.filter(sesuai).length;
  $("#stok-atas").innerHTML = `
    <strong>${ok}<span>/${isi.length}</span></strong>
    <p>bahan cocok antara catatan<br>dan hitungan fisik${isi.some(menipis) ? `<br><b class="teks-menipis">${isi.filter(menipis).length} bahan menipis</b>` : ""}</p>
    <span class="segmen" aria-hidden="true">${isi.map((c) => `<i class="${sesuai(c) ? "" : "beda"}"></i>`).join("")}</span>`;
  $("#daftar-stok").innerHTML = isi.map((c) => {
    const cocok = sesuai(c);
    const persenFisik = Math.min(100, (c.fisik / c.digital) * 100);
    return `<li data-zona="${c.zona}" data-tab="persediaan" tabindex="0" class="${cocok ? "" : "beda"} ${c.zona === state.zona ? "terpilih" : ""}"
        aria-label="${esc(c.nama)}: fisik ${angka(c.fisik)} ${esc(c.satuan)}, catatan ${angka(c.digital)} ${esc(c.satuan)}, ${cocok ? "sesuai" : "selisih"}">
      <span class="stok-nama">${esc(c.nama)}${menipis(c) ? ` <span class="chip-menipis">Menipis · min ${angka(c.minimum)}</span>` : ""}<small>${ZONA[c.zona]}</small></span>
      <span class="stok-bar"><i style="--w:${persenFisik}%;--c:${cocok ? "var(--hijau)" : "var(--merah)"}"></i></span>
      <span class="stok-nilai"><b>${angka(c.fisik)} ${esc(c.satuan)}</b><small>${cocok ? "sesuai catatan" : `catatan ${angka(c.digital)} · ${tanda(c.fisik - c.digital)}`}</small></span>
      ${!cocok && c.catatan ? `<span class="stok-catatan">${esc(c.catatan)}</span>` : ""}
    </li>`;
  }).join("");
}

function renderStatusBuka() {
  // jam buka warung 06.00–19.00
  const jam = new Date().getHours();
  const buka = jam >= 6 && jam < 19;
  const el = $("#status-buka");
  el.classList.toggle("tutup", !buka);
  el.querySelector("span").innerHTML = buka ? "Buka<small> · s.d. 19.00</small>" : "Tutup<small> · buka 06.00</small>";
  el.title = "Jam buka warung 06.00–19.00";
}

function renderTabel() {
  renderStok();
  const h = state.halaman;
  if (h === "beranda") return;
  $$("[data-halaman]").forEach((el) => (el.hidden = el.dataset.halaman !== h));
  if (h === "laporan") {
    $("#h-detail").textContent = "Rekap 7 Hari";
    $("#sub-detail").textContent = `Total omzet ${rp(state.data.minggu.reduce((n, d) => n + d.omzet, 0))}, ${rentang(state.data.minggu)}`;
    $("#tabel-detail").innerHTML = `<thead><tr><th>Hari</th><th class="num">Omzet</th><th class="num">Transaksi</th><th class="num">Pembeli</th></tr></thead><tbody>` +
      state.data.minggu.map((d) => `<tr><td>${d.hari}</td><td class="num">${rp(d.omzet)}</td><td class="num">${d.transaksi}</td><td class="num">${d.pembeli}</td></tr>`).join("") + "</tbody>";
    return;
  }
  const isi = cekTab(state.tab);
  $("#h-detail").textContent = state.tab ? `Catatan ${state.tab}` : "Semua catatan";
  const tipis = isi.filter(menipis);
  $("#sub-detail").textContent = `${isi.filter(sesuai).length} dari ${isi.length} sesuai.` +
    (tipis.length ? ` Stok menipis: ${tipis.map((c) => c.nama).join(", ")}.` : "") + " Klik baris untuk melihat zonanya di denah.";
  $("#tabel-detail").innerHTML = KEPALA_CEK + `<tbody>${isi.map((c) => barisCek(c)).join("")}</tbody>`;
  renderFormFisik(isi);
  renderFormOperator();
}

// ---------- tahap 2: form input Operator ----------
// Pilihan dropdown diisi ulang tanpa menghapus pilihan yang sedang aktif.
function isiPilihan(sel, opsi) {
  const lama = sel.value;
  sel.innerHTML = opsi.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
  if (opsi.some(([v]) => v === lama)) sel.value = lama;
}
const itemStok = () => state.data.cek.filter((c) => c.tab === "persediaan" || (c.tab === "penjualan" && c.produk_id));
function renderFormOperator() {
  const produk = state.data.produk.map((p) => [p.id, `${p.nama} (${rp(p.harga)})`]);
  $$("[data-pilih-produk]").forEach((sel) => isiPilihan(sel, produk));
  const selStok = $("#form-stok [name=item]");
  const lama = selStok.value;
  isiPilihan(selStok, itemStok().map((c) => [c.id, `${c.nama} — ${ZONA[c.zona]}`]));
  if (selStok.value !== lama) isiFormStok();
  hitungTotalJual();
  const proses = (state.data.produksi ?? []).filter((x) => x.status === "proses");
  const namaProduk = (id) => state.data.produk.find((p) => p.id === id)?.nama ?? id;
  const jam = (t) => new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  $("#daftar-produksi").innerHTML = `<h3>Produksi sedang berjalan</h3>` + (proses.length
    ? `<ul>${proses.map((x) => `<li><span>${esc(namaProduk(x.produk_id))}<small>${angka(x.jumlah)} pcs · dicatat ${jam(x.dibuat_pada)}</small></span>
        ${state.sesi?.peran === "operator" ? `<button type="button" data-selesai="${x.id}">Tandai selesai</button>` : ""}</li>`).join("")}</ul>`
    : `<p class="sub">Tidak ada produksi yang sedang berjalan.</p>`);
}
function isiFormStok() {
  const c = state.data.cek.find((x) => x.id === $("#form-stok [name=item]").value);
  if (!c) return;
  $("#form-stok [name=digital]").value = c.digital;
  $("#form-stok [name=minimum]").value = c.minimum ?? "";
  $("#form-stok [data-satuan]").textContent = `(${c.satuan})`;
}
function hitungTotalJual() {
  const f = $("#form-jual");
  const p = state.data.produk.find((x) => x.id === f.produk.value);
  const sisa = state.data.cek.find((c) => c.produk_id === p?.id && c.tab === "penjualan")?.digital;
  const n = f.jumlah.valueAsNumber;
  f.querySelector("[data-total]").textContent = p
    ? `Stok etalase: ${angka(sisa ?? 0)} pcs` + (n > 0 ? ` · Total: ${rp(n * p.harga)}` : "")
    : "";
}

// Form "Catat hitungan fisik": pilihan item mengikuti tab aktif; nilai yang sedang diketik tidak ditimpa.
function renderFormFisik(isi) {
  const sel = $("#fisik-item");
  const lama = sel.value;
  sel.innerHTML = isi.map((c) => `<option value="${c.id}">${esc(c.nama)} — ${ZONA[c.zona]}</option>`).join("");
  if (isi.some((c) => c.id === lama)) sel.value = lama;
  else isiFormFisik();
}
function isiFormFisik() {
  const c = state.data.cek.find((x) => x.id === $("#fisik-item").value);
  if (!c) return;
  $("#fisik-jumlah").value = c.fisik;
  $("#fisik-catatan").value = c.catatan ?? "";
  $("#fisik-satuan").textContent = `(${c.satuan}, catatan ${angka(c.digital)})`;
}

function renderRingkas() {
  $("#ringkas-zona").textContent = state.zona
    ? ringkasZona(state.zona, state.data, state.tab)
    : "Klik zona di denah, tab, atau baris tabel untuk melihat ringkasannya.";
}

// Kartu data yang langsung muncul saat zona diklik (dari 3D, tab, tabel, atau Tanya sistem).
function renderInfo() {
  const el = $("#info-zona");
  if (!state.zona) { el.hidden = true; return; }
  const isi = state.data.cek.filter((c) => c.zona === state.zona)
    .sort((a, b) => (b.tab === state.tab) - (a.tab === state.tab) || sesuai(a) - sesuai(b));
  const beda = isi.filter((c) => !sesuai(c)).length;
  const nilai = (c, n) => (c.satuan === "Rp" ? rp(n) : `${angka(n)} ${esc(c.satuan)}`);
  el.hidden = false;
  el.innerHTML = `
    <div class="info-kepala">
      <span class="info-titik ${beda ? "beda" : "ok"}"></span>
      <strong>${ZONA[state.zona]}</strong>
      <span class="lencana ${beda ? "turun" : "naik"}">${beda ? `${beda} selisih` : "semua sesuai"}</span>
      <button type="button" class="info-tutup" aria-label="Tutup data zona">×</button>
    </div>
    <ul class="info-daftar">${isi.map((c) => `
      <li class="${sesuai(c) ? "" : "beda"}">
        <span class="info-nama">${esc(c.nama)}<small>${c.tab}</small></span>
        <span class="info-nilai"><b>${nilai(c, c.fisik)}</b><small>catatan ${nilai(c, c.digital)}</small></span>
        ${!sesuai(c) && c.catatan ? `<span class="info-catatan">${esc(c.catatan)}</span>` : ""}
      </li>`).join("") || "<li>Belum ada catatan di zona ini.</li>"}
    </ul>
    <a class="info-tautan" href="#kesesuaian">Buka Cek Kesesuaian →</a>`;
  el.querySelector(".info-tutup").addEventListener("click", () => { state.zona = null; denah.pilih(null); render(); });
}

function renderTanggal() {
  $("#tgl-label").textContent = PERIODE[state.periode].label;
  $("#tgl-kini").textContent = rentang(PERIODE[state.periode].hari(state.data));
}

function render() {
  if (!state.data) return;
  renderTanggal();
  renderStatusBuka();
  renderOmzet();
  renderFunnel();
  renderDot("#dot-transaksi", "transaksi", "hijau");
  renderDot("#dot-pembeli", "pembeli", "biru");
  renderInsight();
  renderJam();
  renderTabel();
  renderRingkas();
  renderInfo();
  denah.setStatus(statusZona(state.tab));
  $$("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
  $("#diperbarui").textContent = teksSumber();
}

// ---------- interaksi dua arah ----------
function pilihZona(id, tab) {
  if (tab && tab !== state.tab) state.tab = tab;
  state.zona = id;
  denah.pilih(id);
  render();
}

function gantiTab(tab) {
  state.tab = tab;
  if (TAB.includes(state.halaman) && state.halaman !== tab) location.hash = tab; // menu ikut tab
  else render();
}

function bukaHalaman() {
  const h = location.hash.slice(1);
  state.halaman = HALAMAN[h] ? h : "beranda";
  if (TAB.includes(state.halaman)) state.tab = state.halaman;
  else if (state.halaman === "kesesuaian") state.tab = null;
  else if (!state.tab) state.tab = "persediaan";
  $("#judul-halaman").textContent = HALAMAN[state.halaman];
  document.title = `${HALAMAN[state.halaman]} · Warung Bu Pita`;
  $$("#menu a").forEach((a) => (a.getAttribute("href") === "#" + state.halaman ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  $$("[data-tampil]").forEach((el) => {
    const t = el.dataset.tampil;
    el.hidden = !(t === "semua" || t.split(" ").includes(state.halaman));
  });
  document.body.dataset.halaman = state.halaman;
  tutupMenu();
  render();
}

function tutupMenu() {
  $("#menu").classList.remove("buka");
  $(".hamburger").setAttribute("aria-expanded", "false");
}

function toast(teks) {
  const t = $("#toast");
  t.textContent = teks;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2200);
}

$$("[data-tab]").forEach((b) => b.addEventListener("click", () => gantiTab(b.dataset.tab)));
$$("[data-ke]").forEach((b) => b.addEventListener("click", () => (location.hash = b.dataset.ke)));
document.addEventListener("click", (e) => {
  const tr = e.target.closest("[data-zona]");
  if (tr?.dataset.id && [...$("#fisik-item").options].some((o) => o.value === tr.dataset.id)) {
    $("#fisik-item").value = tr.dataset.id;
    isiFormFisik();
  }
  if (tr) pilihZona(tr.dataset.zona, state.halaman === "kesesuaian" ? null : tr.dataset.tab);
});
document.addEventListener("keydown", (e) => {
  const tr = e.target.closest?.("[data-zona]");
  if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tr.click(); }
});
$("#funnel").addEventListener("pointerover", (e) => {
  const k = e.target.closest(".kolom");
  if (!k) return;
  $$("#funnel .kolom").forEach((x) => x.classList.toggle("aktif", x === k));
});
$("#funnel").addEventListener("focusin", (e) => e.target.closest(".kolom")?.dispatchEvent(new Event("pointerover", { bubbles: true })));
$("#reset-kamera").addEventListener("click", () => { state.zona = null; denah.pilih(null); render(); });
$("#periode").addEventListener("change", (e) => { state.periode = e.target.value; render(); });
$("#salin-tautan").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(location.href); toast("Tautan disalin"); }
  catch { toast("Tidak bisa menyalin tautan di browser ini"); }
});
$("#tombol-cari").addEventListener("click", () => {
  if (state.halaman !== "beranda" && !TAB.includes(state.halaman)) location.hash = "beranda";
  $("#input-tanya").scrollIntoView({ block: "center", behavior: "smooth" });
  $("#input-tanya").focus({ preventScroll: true });
});
$(".hamburger").addEventListener("click", () => {
  const buka = $("#menu").classList.toggle("buka");
  $(".hamburger").setAttribute("aria-expanded", String(buka));
});
$("#form-tanya").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("#input-tanya").value;
  const el = $("#jawaban");
  el.hidden = false;
  el.textContent = "Mencari jawaban…";
  try {
    const r = await tanyaSistem(q, { data: state.data, zona: state.zona, tab: state.tab });
    el.textContent = r.teks;
    if (r.zona) pilihZona(r.zona);
  } catch (err) {
    el.textContent = "Sistem gagal menjawab. Coba lagi.";
    console.error(err);
  }
});

function teksSumber() {
  const label = { supabase: "Sumber data: Supabase", contoh: "Sumber data: contoh (Supabase belum diatur)", "contoh-gagal": "Sumber data: contoh (gagal terhubung ke Supabase)" };
  return `${label[state.data.sumber] ?? ""} · diperbarui ${new Date(state.data.diperbarui).toLocaleTimeString("id-ID")}`;
}

$("#fisik-item").addEventListener("change", isiFormFisik);

// Kirim form Operator: tombol dikunci selama proses, pesan hasil di bawah form, data dimuat ulang setelah berhasil.
function pasangForm(id, aksi) {
  const f = $(id);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tombol = f.querySelector("button[type=submit]");
    const pesan = f.querySelector(".fisik-pesan");
    tombol.disabled = true;
    pesan.className = "fisik-pesan";
    pesan.textContent = "Menyimpan…";
    try {
      const teks = await aksi(f);
      state.data = await ambilData();
      render();
      pesan.textContent = teks;
      pesan.classList.add("ok");
    } catch (err) {
      console.error(err);
      pesan.textContent = "Gagal: " + (err.message ?? err);
      pesan.classList.add("gagal");
    } finally {
      tombol.disabled = false;
    }
  });
}
const namaProduk = (id) => state.data.produk.find((p) => p.id === id)?.nama ?? id;
pasangForm("#form-produksi", async (f) => {
  await catatProduksi(f.produk.value, f.jumlah.valueAsNumber);
  const teks = `Produksi ${namaProduk(f.produk.value)} ${f.jumlah.value} pcs dicatat. Tandai selesai bila sudah matang.`;
  f.jumlah.value = "";
  return teks;
});
pasangForm("#form-stok", async (f) => {
  const min = f.minimum.value === "" ? null : f.minimum.valueAsNumber;
  await ubahStok(f.item.value, f.digital.valueAsNumber, min);
  return "Stok tersimpan.";
});
pasangForm("#form-jual", async (f) => {
  const total = await catatPenjualan(f.produk.value, f.jumlah.valueAsNumber);
  const teks = `Penjualan ${namaProduk(f.produk.value)} ${f.jumlah.value} pcs dicatat (${rp(total)}).`;
  f.jumlah.value = "";
  hitungTotalJual();
  return teks;
});
$("#form-stok [name=item]").addEventListener("change", isiFormStok);
$("#form-jual").addEventListener("input", hitungTotalJual);
$("#daftar-produksi").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-selesai]");
  if (!b) return;
  b.disabled = true;
  try {
    await selesaikanProduksi(Number(b.dataset.selesai));
    state.data = await ambilData();
    render();
    toast("Produksi selesai, stok etalase bertambah.");
  } catch (err) {
    b.disabled = false;
    toast("Gagal: " + err.message);
  }
});
$("#form-fisik").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pesan = $("#fisik-pesan");
  const tombol = e.target.querySelector("button");
  const id = $("#fisik-item").value;
  const nilai = $("#fisik-jumlah").valueAsNumber;
  tombol.disabled = true;
  pesan.className = "fisik-pesan";
  pesan.textContent = "Menyimpan…";
  try {
    await simpanHitunganFisik(id, nilai, $("#fisik-catatan").value);
    state.data = await ambilData();
    const c = state.data.cek.find((x) => x.id === id);
    if (c) pilihZona(c.zona); else render();
    pesan.textContent = state.data.sumber === "supabase" ? "Tersimpan ke database." : "Tersimpan di browser ini saja (Supabase belum diatur).";
    pesan.classList.add("ok");
  } catch (err) {
    console.error(err);
    pesan.textContent = "Gagal menyimpan: " + (err.message ?? err);
    pesan.classList.add("gagal");
  } finally {
    tombol.disabled = false;
  }
});

window.addEventListener("hashchange", bukaHalaman);

// ---------- login & peran ----------
const NAMA_PERAN = { operator: "Operator", pemilik: "Pemilik" };

function mulai(sesi) {
  state.sesi = sesi;
  document.body.dataset.peran = sesi.peran;
  $("#nama-peran").textContent = `${NAMA_PERAN[sesi.peran]} · ${sesi.nama}`;
  $("#pil-peran").setAttribute("aria-label", `Keluar dari akun ${NAMA_PERAN[sesi.peran]}`);
  $("#layar-masuk").hidden = true;
  $(".aplikasi").hidden = false;
  // Render ulang hanya bila isi data berubah, supaya fokus keyboard & hover tidak hilang tiap polling.
  let jejakData = "";
  subscribeRealtime((data) => {
    const { diperbarui, ...isi } = data;
    const jejak = JSON.stringify(isi);
    state.data = data;
    if (jejak !== jejakData) { jejakData = jejak; render(); }
    else { renderStatusBuka(); $("#diperbarui").textContent = teksSumber(); }
  });
  bukaHalaman();
}

function tampilMasuk(pesan = "") {
  $(".aplikasi").hidden = true;
  $("#layar-masuk").hidden = false;
  $("#form-masuk").hidden = !pakaiSupabase;
  $("#masuk-contoh").hidden = pakaiSupabase;
  $("#pesan-masuk").textContent = pesan;
}

$("#form-masuk").addEventListener("submit", async (e) => {
  e.preventDefault();
  const tombol = e.target.querySelector("button");
  tombol.disabled = true;
  $("#pesan-masuk").textContent = "";
  try {
    mulai(await masuk($("#masuk-email").value, $("#masuk-sandi").value));
  } catch (err) {
    $("#pesan-masuk").textContent = err.message;
  } finally {
    tombol.disabled = false;
  }
});
$$("#masuk-contoh [data-peran]").forEach((b) => b.addEventListener("click", () => mulai(masukContoh(b.dataset.peran))));
$$("[data-keluar]").forEach((b) => b.addEventListener("click", async () => {
  await keluar();
  location.reload(); // muat ulang agar data & langganan realtime milik sesi lama ikut bersih
}));

sesiSaya().then((sesi) => (sesi ? mulai(sesi) : tampilMasuk())).catch((err) => tampilMasuk(err.message));
