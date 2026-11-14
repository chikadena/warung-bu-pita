// Jalankan: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { ambilData } from "./data.js";
import { tanyaSistem } from "./tanya.js";

test("tepung tidak sesuai diarahkan ke zona persiapan", async () => {
  const data = await ambilData();
  const r = await tanyaSistem("kenapa stok tepung tidak sesuai?", { data });
  assert.equal(r.zona, "zona_persiapan");
  assert.match(r.teks, /-1,5 kg/);
});

test("omzet dan selisih umum", async () => {
  const data = await ambilData();
  assert.match((await tanyaSistem("berapa omzet hari ini", { data })).teks, /Rp 412\.000/);
  assert.match((await tanyaSistem("apa saja yang selisih?", { data })).teks, /Tepung terigu/);
  assert.equal((await tanyaSistem("sisa di etalase", { data })).zona, "zona_etalase");
});

test("simpan hitungan fisik (mode data contoh) & validasi", async () => {
  const { simpanHitunganFisik } = await import("./data.js");
  await assert.rejects(simpanHitunganFisik("tepung", -1), /angka 0 atau lebih/);
  await assert.rejects(simpanHitunganFisik("tidak_ada", 1), /tidak ditemukan/);
  await simpanHitunganFisik("tepung", 12, "  sudah dicatat  ");
  const tepung = (await ambilData()).cek.find((c) => c.id === "tepung");
  assert.equal(tepung.fisik, 12);
  assert.equal(tepung.catatan, "sudah dicatat");
  assert.equal((await ambilData()).sumber, "contoh");
});
