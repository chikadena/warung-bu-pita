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
  produk: [
    { id: "bakso", nama: "Bakso goreng", harga: 3000, dibuat: 80, rusak: 3, terjual: 70, warna: "#22a447" },
    { id: "pisang", nama: "Pisang coklat", harga: 2500, dibuat: 60, rusak: 2, terjual: 52, warna: "#2f5bff" },
    { id: "risol", nama: "Risol", harga: 2000, dibuat: 45, rusak: 2, terjual: 36, warna: "#e0488e" },
  ],
  // Penjualan harian 1–15 Nov 2026. "minggu" (7 hari terakhir) & "bulan" diturunkan di ambilData().
  harian: [
    { tanggal: "2026-11-01", hari: "Min", omzet: 398000, transaksi: 102, pembeli: 91, produk: { bakso: 201000, pisang: 125000, risol: 72000 } },
    { tanggal: "2026-11-02", hari: "Sen", omzet: 352000, transaksi: 90, pembeli: 81, produk: { bakso: 177000, pisang: 108000, risol: 67000 } },
    { tanggal: "2026-11-03", hari: "Sel", omzet: 336000, transaksi: 86, pembeli: 78, produk: { bakso: 168000, pisang: 103000, risol: 65000 } },
    { tanggal: "2026-11-04", hari: "Rab", omzet: 371000, transaksi: 95, pembeli: 86, produk: { bakso: 186000, pisang: 115000, risol: 70000 } },
    { tanggal: "2026-11-05", hari: "Kam", omzet: 359000, transaksi: 92, pembeli: 83, produk: { bakso: 180000, pisang: 111000, risol: 68000 } },
    { tanggal: "2026-11-06", hari: "Jum", omzet: 432000, transaksi: 110, pembeli: 99, produk: { bakso: 216000, pisang: 135000, risol: 81000 } },
    { tanggal: "2026-11-07", hari: "Sab", omzet: 498000, transaksi: 126, pembeli: 113, produk: { bakso: 249000, pisang: 156000, risol: 93000 } },
    { tanggal: "2026-11-08", hari: "Min", omzet: 405000, transaksi: 104, pembeli: 93, produk: { bakso: 204000, pisang: 127000, risol: 74000 } },
    { tanggal: "2026-11-09", hari: "Sen", omzet: 385000, transaksi: 98, pembeli: 88, produk: { bakso: 192000, pisang: 121000, risol: 72000 } },
    { tanggal: "2026-11-10", hari: "Sel", omzet: 342000, transaksi: 87, pembeli: 79, produk: { bakso: 171000, pisang: 105000, risol: 66000 } },
    { tanggal: "2026-11-11", hari: "Rab", omzet: 410000, transaksi: 104, pembeli: 93, produk: { bakso: 207000, pisang: 128000, risol: 75000 } },
    { tanggal: "2026-11-12", hari: "Kam", omzet: 368000, transaksi: 94, pembeli: 85, produk: { bakso: 186000, pisang: 112000, risol: 70000 } },
    { tanggal: "2026-11-13", hari: "Jum", omzet: 455000, transaksi: 115, pembeli: 103, produk: { bakso: 228000, pisang: 142000, risol: 85000 } },
    { tanggal: "2026-11-14", hari: "Sab", omzet: 520000, transaksi: 131, pembeli: 118, produk: { bakso: 261000, pisang: 163000, risol: 96000 } },
    { tanggal: "2026-11-15", hari: "Min", omzet: 412000, transaksi: 106, pembeli: 94, produk: { bakso: 210000, pisang: 130000, risol: 72000 } },
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
    { id: "tepung", tab: "persediaan", zona: "zona_persiapan", nama: "Tepung terigu", satuan: "kg", digital: 12, fisik: 10.5, minimum: 5,
      catatan: "Pemakaian adonan risol pagi belum dicatat (±1,5 kg)." },
    { id: "kulit_risol", tab: "persediaan", zona: "zona_gudang_stok", nama: "Kulit risol", satuan: "lembar", digital: 120, fisik: 120, minimum: 60 },
    { id: "isi_bakso", tab: "persediaan", zona: "zona_gudang_stok", nama: "Bakso mentah", satuan: "butir", digital: 150, fisik: 150, minimum: 100 },
    { id: "pisang_kepok", tab: "persediaan", zona: "zona_gudang_stok", nama: "Pisang kepok", satuan: "buah", digital: 25, fisik: 25, minimum: 30 },
    { id: "coklat", tab: "persediaan", zona: "zona_gudang_stok", nama: "Meses coklat", satuan: "bungkus", digital: 6, fisik: 6, minimum: 4 },
    { id: "minyak", tab: "persediaan", zona: "zona_penggorengan", nama: "Minyak goreng", satuan: "liter", digital: 5, fisik: 5, minimum: 4 },
    { id: "goreng_bakso", tab: "produksi", zona: "zona_penggorengan", nama: "Bakso goreng digoreng", satuan: "pcs", digital: 80, fisik: 80, produk_id: "bakso" },
    { id: "goreng_pisang", tab: "produksi", zona: "zona_penggorengan", nama: "Pisang coklat digoreng", satuan: "pcs", digital: 60, fisik: 60, produk_id: "pisang" },
    { id: "gulung_risol", tab: "produksi", zona: "zona_persiapan", nama: "Risol digulung", satuan: "pcs", digital: 45, fisik: 45, produk_id: "risol" },
    { id: "sisa_bakso", tab: "penjualan", zona: "zona_etalase", nama: "Sisa bakso goreng", satuan: "pcs", digital: 7, fisik: 7, produk_id: "bakso" },
    { id: "sisa_pisang", tab: "penjualan", zona: "zona_etalase", nama: "Sisa pisang coklat", satuan: "pcs", digital: 6, fisik: 6, produk_id: "pisang" },
    { id: "sisa_risol", tab: "penjualan", zona: "zona_etalase", nama: "Sisa risol", satuan: "pcs", digital: 7, fisik: 7, produk_id: "risol" },
    { id: "kas", tab: "penjualan", zona: "zona_uang", nama: "Uang di kaleng", satuan: "Rp", digital: 412000, fisik: 412000 },
  ],
  produksi: [],
  skenario: [],
  // Takaran bahan per 1 pcs (sama dengan pengaturan "resep" di supabase/simulasi.sql).
  resep: {
    bakso: { isi_bakso: 1, tepung: 0.02, minyak: 0.01 },
    pisang: { pisang_kepok: 0.5, coklat: 0.05, tepung: 0.03, minyak: 0.01 },
    risol: { kulit_risol: 1, tepung: 0.02, minyak: 0.01 },
  },
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
  const [produk, cek, hari, jam, atur, produksi, skenario] = await Promise.all([
    tanya(db.from("produk").select("*").order("urutan")),
    tanya(db.from("cek_kesesuaian").select("*").order("urutan")),
    tanya(db.from("penjualan_harian").select("*").order("tanggal", { ascending: false }).limit(31)),
    tanya(db.from("penjualan_jam").select("*").order("jam")),
    tanya(db.from("pengaturan").select("*")),
    // tabel produksi baru ada setelah input-operator.sql dijalankan; tanpa itu dashboard tetap jalan
    tanya(db.from("produksi").select("id, produk_id, jumlah, status, dibuat_pada").order("id", { ascending: false }).limit(20)).catch(() => []),
    // tabel skenario baru ada setelah simulasi.sql dijalankan
    tanya(db.from("skenario").select("id, nama, parameter, hasil, dibuat_pada").order("id", { ascending: false }).limit(20)).catch(() => []),
  ]);
  const p = Object.fromEntries(atur.map((r) => [r.kunci, r.nilai]));
  return {
    produk: produk.map(({ urutan, ...r }) => r),
    harian: hari.reverse().map((r) => ({ tanggal: r.tanggal, hari: r.hari, omzet: r.omzet, transaksi: r.transaksi, pembeli: r.pembeli, produk: r.produk })),
    perJam: jam.map((r) => ({ jam: r.jam, omzet: r.omzet })),
    cek: cek.map((r) => ({
      id: r.id, tab: r.tab, zona: r.zona, nama: r.nama, satuan: r.satuan,
      digital: Number(r.digital), fisik: Number(r.fisik), ...(r.catatan ? { catatan: r.catatan } : {}),
      minimum: r.minimum == null ? null : Number(r.minimum), produk_id: r.produk_id ?? null,
    })),
    produksi,
    skenario,
    resep: p.resep ?? dataDummy.resep,
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
  // Hari terakhir yang tercatat = "hari ini"; minggu = 7 hari terakhir; bulan = bulan dari hari terakhir.
  const akhir = data.harian.at(-1)?.tanggal ?? "";
  data.tanggal = akhir;
  data.minggu = data.harian.slice(-7);
  data.bulan = data.harian.filter((h) => h.tanggal.slice(0, 7) === akhir.slice(0, 7));
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
    if (!data.length) throw new Error("Item tidak ditemukan, atau akun ini bukan Operator.");
    return;
  }
  const item = dataDummy.cek.find((c) => c.id === id);
  if (!item) throw new Error("Item tidak ditemukan.");
  item.fisik = isi.fisik;
  if (isi.catatan) item.catatan = isi.catatan; else delete item.catatan;
}

// ---------- Input Operator (fungsi di supabase/input-operator.sql) ----------
// Fungsi database memeriksa peran Operator dan mengubah beberapa tabel sekaligus.
async function panggil(fungsi, argumen) {
  if (!pakaiSupabase) throw new Error("Fitur ini butuh koneksi Supabase.");
  const { data, error } = await (await sb()).rpc(fungsi, argumen);
  if (error) {
    if (error.code === "PGRST202") throw new Error("Fungsi input belum dipasang. Jalankan supabase/input-operator.sql di Supabase.");
    throw new Error(error.message);
  }
  return data;
}
const bulatPositif = (n, label) => {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${label} harus bilangan bulat lebih dari 0.`);
  return n;
};
export const catatProduksi = async (produk, jumlah) => panggil("catat_produksi", { p_produk: produk, p_jumlah: bulatPositif(jumlah, "Jumlah produksi") });
export const selesaikanProduksi = async (id) => panggil("selesaikan_produksi", { p_id: id });
export const catatPenjualan = async (produk, jumlah) => panggil("catat_penjualan", { p_produk: produk, p_jumlah: bulatPositif(jumlah, "Jumlah terjual") });
// Skenario simulasi (Pemilik).
export async function simpanSkenario(nama, parameter, hasil) {
  nama = String(nama ?? "").trim().slice(0, 80);
  if (!nama) throw new Error("Beri nama skenario dulu.");
  if (!pakaiSupabase) throw new Error("Fitur ini butuh koneksi Supabase.");
  const { error } = await (await sb()).from("skenario").insert({ nama, parameter, hasil });
  if (error) {
    if (error.code === "42501") throw new Error("Hanya Pemilik yang boleh menyimpan skenario.");
    throw new Error(error.code === "42P01" || error.code === "PGRST205" ? "Tabel skenario belum ada. Jalankan supabase/simulasi.sql di Supabase." : error.message);
  }
}
export async function hapusSkenario(id) {
  if (!pakaiSupabase) throw new Error("Fitur ini butuh koneksi Supabase.");
  const { data, error } = await (await sb()).from("skenario").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data.length) throw new Error("Skenario tidak ditemukan, atau akun ini bukan Pemilik.");
}

export async function ubahStok(id, digital, minimum) {
  if (!Number.isFinite(digital) || digital < 0) throw new Error("Stok harus angka 0 atau lebih.");
  if (minimum != null && (!Number.isFinite(minimum) || minimum < 0)) throw new Error("Batas minimum harus angka 0 atau lebih.");
  return panggil("ubah_stok", { p_id: id, p_digital: digital, p_minimum: minimum ?? null });
}

// ---------- Login & peran ----------
// Tanpa Supabase (mode contoh) peran dipilih langsung di layar masuk, tanpa kata sandi.
let sesiContoh = null;

// Mengembalikan { email, nama, peran } atau null bila belum login.
export async function sesiSaya() {
  if (!pakaiSupabase) return sesiContoh;
  const db = await sb();
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;
  const { data, error } = await db.from("profil").select("nama, peran").eq("id", session.user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    await db.auth.signOut();
    throw new Error("Akun ini belum diberi peran Operator atau Pemilik.");
  }
  return { email: session.user.email, ...data };
}

export async function masuk(email, sandi) {
  const db = await sb();
  const { error } = await db.auth.signInWithPassword({ email: email.trim(), password: sandi });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message);
  return sesiSaya();
}

export function masukContoh(peran) {
  if (!["operator", "pemilik"].includes(peran)) throw new Error("Peran tidak dikenal.");
  sesiContoh = { email: null, nama: peran === "pemilik" ? "Bu Pita" : "Operator Warung", peran };
  return sesiContoh;
}

export async function keluar() {
  sesiContoh = null;
  if (pakaiSupabase) await (await sb()).auth.signOut();
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
