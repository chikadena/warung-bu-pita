// "Tanya sistem": versi rule-based. Tanda tangan async + konteks lengkap
// supaya nanti isinya bisa diganti panggilan LLM tanpa mengubah pemanggil.
// Mengembalikan { teks, zona? } — zona dipakai UI untuk memindahkan kamera.

import { ZONA } from "./data.js";

const fmt = (c) => (c.satuan === "Rp" ? "Rp " + c.fisik.toLocaleString("id-ID") : `${c.fisik.toLocaleString("id-ID")} ${c.satuan}`);
const selisihTeks = (c) => {
  const d = c.fisik - c.digital;
  const n = Math.abs(d).toLocaleString("id-ID");
  return c.satuan === "Rp" ? `${d < 0 ? "-" : "+"}Rp ${n}` : `${d < 0 ? "-" : "+"}${n} ${c.satuan}`;
};

export async function tanyaSistem(pertanyaan, { data, zona }) {
  const q = pertanyaan.toLowerCase().trim();
  if (!q) return { teks: "Tulis pertanyaan dulu, misalnya: kenapa stok tepung tidak sesuai?" };

  // 1. Menyebut bahan/barang tertentu.
  const umum = ["sisa", "goreng", "digoreng", "digulung", "uang", "mentah"];
  const cek = data.cek.find((c) => c.nama.toLowerCase().split(" ").some((kata) => kata.length > 3 && !umum.includes(kata) && q.includes(kata)));
  if (cek) {
    if (cek.fisik === cek.digital)
      return { zona: cek.zona, teks: `${cek.nama} di zona ${ZONA[cek.zona]} sesuai: catatan dan hitungan fisik sama-sama ${fmt(cek)}.` };
    return {
      zona: cek.zona,
      teks: `${cek.nama} di zona ${ZONA[cek.zona]} tidak sesuai: tercatat ${cek.digital.toLocaleString("id-ID")}, fisik ${fmt(cek)} (${selisihTeks(cek)}). ${cek.catatan ?? ""}`.trim(),
    };
  }

  // 2. Menyebut zona.
  const idZona = Object.keys(ZONA).find((id) => q.includes(ZONA[id].toLowerCase()));
  if (idZona) return { zona: idZona, teks: ringkasZona(idZona, data) };

  // 3. Topik umum.
  if (/selisih|sesuai|cocok|beda/.test(q)) {
    const beda = data.cek.filter((c) => c.fisik !== c.digital);
    if (!beda.length) return { teks: "Semua catatan digital sesuai dengan hitungan fisik." };
    return { zona: beda[0].zona, teks: "Yang belum sesuai: " + beda.map((c) => `${c.nama} (${selisihTeks(c)}, ${ZONA[c.zona]})`).join("; ") + "." };
  }
  if (/omzet|penjualan|pendapatan|laku|terjual/.test(q)) {
    const laris = [...data.produk].sort((a, b) => b.terjual * b.harga - a.terjual * a.harga)[0];
    const omzet = data.produk.reduce((n, p) => n + p.terjual * p.harga, 0);
    return { zona: "zona_uang", teks: `Omzet hari ini Rp ${omzet.toLocaleString("id-ID")}. Paling laris: ${laris.nama} (${laris.terjual} pcs).` };
  }
  if (/sisa|rusak|susut/.test(q)) {
    const sisa = data.produk.map((p) => `${p.nama} ${p.dibuat - p.rusak - p.terjual} sisa, ${p.rusak} rusak`).join("; ");
    return { zona: "zona_etalase", teks: sisa + "." };
  }

  if (zona) return { zona, teks: ringkasZona(zona, data) };
  return { teks: "Belum paham pertanyaannya. Coba sebut bahan (tepung, minyak), zona (etalase, kotak uang), atau topik (selisih, omzet, sisa)." };
}

export function ringkasZona(idZona, data, tab) {
  const isi = data.cek.filter((c) => c.zona === idZona && (!tab || c.tab === tab));
  if (!isi.length) return `Zona ${ZONA[idZona]}: belum ada catatan${tab ? " " + tab : ""}.`;
  const beda = isi.filter((c) => c.fisik !== c.digital);
  return `Zona ${ZONA[idZona]}: ${isi.length - beda.length} dari ${isi.length} catatan sesuai` +
    (beda.length ? `, selisih pada ${beda.map((c) => `${c.nama} (${selisihTeks(c)})`).join(", ")}.` : ".");
}
