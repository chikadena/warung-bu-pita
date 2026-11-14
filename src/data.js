// Satu-satunya pintu data. Nanti isi ambilData() diganti query Supabase/API,
// bentuk objek yang dikembalikan harus tetap sama.

const INTERVAL_POLLING_MS = 6000;

export const ZONA = {
  zona_gudang_stok: "Gudang stok",
  zona_persiapan: "Persiapan",
  zona_penggorengan: "Penggorengan",
  zona_etalase: "Etalase",
  zona_uang: "Kotak uang",
};

// Data dummy hari Minggu, 15 Nov 2026.
const dataDummy = {
  tanggal: "2026-11-15",
  produk: [
    { id: "bakso", nama: "Bakso goreng", harga: 3000, dibuat: 80, rusak: 3, terjual: 70, warna: "#22a447" },
    { id: "pisang", nama: "Pisang coklat", harga: 2500, dibuat: 60, rusak: 2, terjual: 52, warna: "#2f5bff" },
    { id: "risol", nama: "Risol", harga: 2000, dibuat: 45, rusak: 2, terjual: 36, warna: "#e0488e" },
  ],
  // Pembanding: hari yang sama minggu lalu (harian) dan total minggu lalu (mingguan).
  lalu: {
    harian: { omzet: 358000, transaksi: 98, pembeli: 87, produk: { bakso: 180000, pisang: 112500, risol: 65500 } },
    mingguan: { omzet: 2580000, transaksi: 640, pembeli: 571, produk: { bakso: 1290000, pisang: 815000, risol: 475000 } },
  },
  // Senin 9 Nov s.d. Minggu 15 Nov.
  minggu: [
    { hari: "Sen", omzet: 385000, transaksi: 98, pembeli: 88, produk: { bakso: 192000, pisang: 121000, risol: 72000 } },
    { hari: "Sel", omzet: 342000, transaksi: 87, pembeli: 79, produk: { bakso: 171000, pisang: 105000, risol: 66000 } },
    { hari: "Rab", omzet: 410000, transaksi: 104, pembeli: 93, produk: { bakso: 207000, pisang: 128000, risol: 75000 } },
    { hari: "Kam", omzet: 368000, transaksi: 94, pembeli: 85, produk: { bakso: 186000, pisang: 112000, risol: 70000 } },
    { hari: "Jum", omzet: 455000, transaksi: 115, pembeli: 103, produk: { bakso: 228000, pisang: 142000, risol: 85000 } },
    { hari: "Sab", omzet: 520000, transaksi: 131, pembeli: 118, produk: { bakso: 261000, pisang: 163000, risol: 96000 } },
    { hari: "Min", omzet: 412000, transaksi: 106, pembeli: 94, produk: { bakso: 210000, pisang: 130000, risol: 72000 } },
  ],
  // Omzet per jam hari ini (jam buka 06.00-19.00).
  perJam: [
    { jam: 6, omzet: 12000 }, { jam: 7, omzet: 38000 }, { jam: 8, omzet: 46000 }, { jam: 9, omzet: 31000 },
    { jam: 10, omzet: 22000 }, { jam: 11, omzet: 27000 }, { jam: 12, omzet: 35000 }, { jam: 13, omzet: 24000 },
    { jam: 14, omzet: 18000 }, { jam: 15, omzet: 41000 }, { jam: 16, omzet: 52000 }, { jam: 17, omzet: 44000 },
    { jam: 18, omzet: 22000 },
  ],
  // Cek kesesuaian: catatan digital vs hitungan fisik per zona.
  cek: [
    { id: "tepung", tab: "persediaan", zona: "zona_persiapan", nama: "Tepung terigu", satuan: "kg", digital: 12, fisik: 10.5,
      catatan: "Pemakaian adonan risol pagi belum dicatat (±1,5 kg)." },
    { id: "kulit_risol", tab: "persediaan", zona: "zona_gudang_stok", nama: "Kulit risol", satuan: "lembar", digital: 120, fisik: 120 },
    { id: "isi_bakso", tab: "persediaan", zona: "zona_gudang_stok", nama: "Bakso mentah", satuan: "butir", digital: 150, fisik: 150 },
    { id: "pisang_kepok", tab: "persediaan", zona: "zona_gudang_stok", nama: "Pisang kepok", satuan: "buah", digital: 25, fisik: 25 },
    { id: "coklat", tab: "persediaan", zona: "zona_gudang_stok", nama: "Meses coklat", satuan: "bungkus", digital: 6, fisik: 6 },
    { id: "minyak", tab: "persediaan", zona: "zona_penggorengan", nama: "Minyak goreng", satuan: "liter", digital: 5, fisik: 5 },
    { id: "goreng_bakso", tab: "produksi", zona: "zona_penggorengan", nama: "Bakso goreng digoreng", satuan: "pcs", digital: 80, fisik: 80 },
    { id: "goreng_pisang", tab: "produksi", zona: "zona_penggorengan", nama: "Pisang coklat digoreng", satuan: "pcs", digital: 60, fisik: 60 },
    { id: "gulung_risol", tab: "produksi", zona: "zona_persiapan", nama: "Risol digulung", satuan: "pcs", digital: 45, fisik: 45 },
    { id: "sisa_bakso", tab: "penjualan", zona: "zona_etalase", nama: "Sisa bakso goreng", satuan: "pcs", digital: 7, fisik: 7 },
    { id: "sisa_pisang", tab: "penjualan", zona: "zona_etalase", nama: "Sisa pisang coklat", satuan: "pcs", digital: 6, fisik: 6 },
    { id: "sisa_risol", tab: "penjualan", zona: "zona_etalase", nama: "Sisa risol", satuan: "pcs", digital: 7, fisik: 7 },
    { id: "kas", tab: "penjualan", zona: "zona_uang", nama: "Uang di kaleng", satuan: "Rp", digital: 412000, fisik: 412000 },
  ],
  skorMingguLalu: 88,
  rekonsiliasi: { ditemukan: 12, selesai: 11 },
};

export const dataContoh = dataDummy;

// ---------- Supabase ----------
// Aktif bila VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY diisi (file .env). Tanpa itu, web memakai data contoh.
const env = import.meta.env ?? {};
const URL_SB = env.VITE_SUPABASE_URL;
const KEY_SB = env.VITE_SUPABASE_ANON_KEY;
export const pakaiSupabase = Boolean(URL_SB && KEY_SB);

let klien = null;
async function sb() {
  if (!klien) {
    const { createClient } = await import("@supabase/supabase-js");
    klien = createClient(URL_SB, KEY_SB);
  }
  return klien;
}

async function ambilDariSupabase() {
  const db = await sb();
  const tanya = (q) => q.then(({ data, error }) => { if (error) throw error; return data; });
  const [produk, cek, hari, jam, atur] = await Promise.all([
    tanya(db.from("produk").select("*").order("urutan")),
    tanya(db.from("cek_kesesuaian").select("*").order("urutan")),
    tanya(db.from("penjualan_harian").select("*").order("tanggal", { ascending: false }).limit(7)),
    tanya(db.from("penjualan_jam").select("*").order("jam")),
    tanya(db.from("pengaturan").select("*")),
  ]);
  const p = Object.fromEntries(atur.map((r) => [r.kunci, r.nilai]));
  const minggu = hari.reverse();
  return {
    tanggal: minggu.at(-1)?.tanggal,
    produk: produk.map(({ urutan, ...r }) => r),
    lalu: p.lalu,
    minggu: minggu.map((r) => ({ hari: r.hari, omzet: r.omzet, transaksi: r.transaksi, pembeli: r.pembeli, produk: r.produk })),
    perJam: jam.map((r) => ({ jam: r.jam, omzet: r.omzet })),
    cek: cek.map((r) => ({
      id: r.id, tab: r.tab, zona: r.zona, nama: r.nama, satuan: r.satuan,
      digital: Number(r.digital), fisik: Number(r.fisik), ...(r.catatan ? { catatan: r.catatan } : {}),
    })),
    skorMingguLalu: p.skor_minggu_lalu,
    rekonsiliasi: p.rekonsiliasi,
  };
}

// Mengembalikan Promise; bentuk objek sama untuk Supabase maupun data contoh.
export async function ambilData() {
  let data, sumber = "contoh";
  if (pakaiSupabase) {
    try {
      data = await ambilDariSupabase();
      sumber = "supabase";
    } catch (e) {
      console.error("Gagal memuat dari Supabase, memakai data contoh:", e);
      sumber = "contoh-gagal";
    }
  }
  data ??= structuredClone(dataDummy);
  data.sumber = sumber;
  data.diperbarui = new Date().toISOString();
  return data;
}

// Simpan hasil hitung fisik satu item. Tanpa Supabase, perubahan hanya tersimpan di tab browser ini.
export async function simpanHitunganFisik(id, fisik, catatan) {
  if (!Number.isFinite(fisik) || fisik < 0) throw new Error("Jumlah fisik harus angka 0 atau lebih.");
  const isi = { fisik, catatan: catatan?.trim().slice(0, 200) || null };
  if (pakaiSupabase) {
    const db = await sb();
    const { data, error } = await db.from("cek_kesesuaian").update({ ...isi, diperbarui: new Date().toISOString() }).eq("id", id).select("id");
    if (error) throw error;
    if (!data.length) throw new Error("Item tidak ditemukan atau izin ubah belum dibuka (cek policy di Supabase).");
    return;
  }
  const item = dataDummy.cek.find((c) => c.id === id);
  if (!item) throw new Error("Item tidak ditemukan.");
  item.fisik = isi.fisik;
  if (isi.catatan) item.catatan = isi.catatan; else delete item.catatan;
}

// Memanggil callback(data) sekarang, lalu tiap ada perubahan (Supabase Realtime) atau tiap interval polling.
// Mengembalikan fungsi untuk berhenti.
export function subscribeRealtime(callback) {
  const muat = () => ambilData().then(callback).catch((e) => console.error("Gagal memuat data:", e));
  muat();
  const timer = setInterval(muat, pakaiSupabase ? 60000 : INTERVAL_POLLING_MS);
  let kanal = null;
  if (pakaiSupabase) {
    sb().then((db) => {
      kanal = db.channel("warung").on("postgres_changes", { event: "*", schema: "public" }, muat).subscribe();
    });
  }
  return () => { clearInterval(timer); kanal?.unsubscribe(); };
}
