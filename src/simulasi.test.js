// Jalankan: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { hitungSimulasi } from "./simulasi.js";

const data = {
  produk: [
    { id: "bakso", nama: "Bakso goreng", harga: 3000 },
    { id: "risol", nama: "Risol", harga: 2000 },
  ],
  cek: [
    { id: "tepung", tab: "persediaan", nama: "Tepung", satuan: "kg", zona: "zona_persiapan", digital: 12, fisik: 10 },
    { id: "kulit", tab: "persediaan", nama: "Kulit", satuan: "lembar", zona: "zona_gudang_stok", digital: 50, fisik: 50 },
    { id: "kas", tab: "penjualan", nama: "Kas", satuan: "Rp", zona: "zona_uang", digital: 1, fisik: 1 },
  ],
  resep: { bakso: { tepung: 0.02 }, risol: { tepung: 0.02, kulit: 1 } },
};

test("proyeksi omzet & kebutuhan bahan", () => {
  const h = hitungSimulasi(data, { hari: 5, rencana: { bakso: { produksi: 100, laku: 90 }, risol: { produksi: 20, laku: 50 } } });
  assert.equal(h.perProduk[0].terjual, 90);
  assert.equal(h.omzetHari, 90 * 3000 + 10 * 2000);
  assert.equal(h.omzetTotal, h.omzetHari * 5);
  const tepung = h.bahan.find((b) => b.id === "tepung");
  assert.equal(tepung.perHari, 2.4); // (100 + 20) × 0,02
  assert.ok(Math.abs(tepung.kurang - 2) < 1e-9); // butuh 12 kg selama 5 hari, stok fisik 10
  const kulit = h.bahan.find((b) => b.id === "kulit");
  assert.equal(kulit.cukupHari, 2.5); // 50 lembar ÷ 20 per hari
  assert.equal(h.bahan[0].id, "kulit"); // diurutkan dari yang paling cepat habis
  assert.equal(h.bahan.length, 2); // hanya bahan persediaan
});

test("validasi input skenario", () => {
  assert.throws(() => hitungSimulasi(data, { hari: 0, rencana: {} }), /1 sampai 60/);
  assert.throws(() => hitungSimulasi(data, { hari: 3, rencana: { bakso: { produksi: -1, laku: 50 } } }), /Produksi Bakso/);
  assert.throws(() => hitungSimulasi(data, { hari: 3, rencana: { bakso: { produksi: 5, laku: 120 } } }), /0–100%/);
});
