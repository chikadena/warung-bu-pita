// UC-09 Simulasi skenario: proyeksi omzet & stok bahan bila produksi/penjualan diubah.
// Fungsi murni (tanpa DOM/database) supaya mudah dites dan dipakai ulang.

// rencana: { [idProduk]: { produksi: pcs per hari, laku: % yang terjual } }
export function hitungSimulasi({ produk, cek, resep }, { hari, rencana }) {
  if (!Number.isInteger(hari) || hari < 1 || hari > 60) throw new Error("Jumlah hari harus 1 sampai 60.");

  const perProduk = produk.map((p) => {
    const r = rencana[p.id] ?? { produksi: 0, laku: 0 };
    if (!Number.isInteger(r.produksi) || r.produksi < 0) throw new Error(`Produksi ${p.nama} harus bilangan bulat 0 atau lebih.`);
    if (!Number.isFinite(r.laku) || r.laku < 0 || r.laku > 100) throw new Error(`Perkiraan laku ${p.nama} harus 0–100%.`);
    const terjual = Math.round((r.produksi * r.laku) / 100);
    return { id: p.id, nama: p.nama, produksi: r.produksi, laku: r.laku, terjual, sisa: r.produksi - terjual, omzet: terjual * p.harga };
  });

  // Kebutuhan bahan per hari = jumlah (produksi × takaran per pcs) dari resep.
  const perHari = {};
  for (const p of perProduk) {
    for (const [idBahan, takaran] of Object.entries(resep?.[p.id] ?? {})) {
      perHari[idBahan] = (perHari[idBahan] ?? 0) + p.produksi * takaran;
    }
  }
  const bahan = cek
    .filter((c) => c.tab === "persediaan")
    .map((c) => {
      const butuh = perHari[c.id] ?? 0;
      const stok = c.fisik; // stok nyata di gudang, bukan catatan digital
      return {
        id: c.id, nama: c.nama, satuan: c.satuan, zona: c.zona, stok,
        perHari: butuh,
        cukupHari: butuh > 0 ? stok / butuh : Infinity,
        kurang: Math.max(0, butuh * hari - stok),
      };
    })
    .sort((a, b) => a.cukupHari - b.cukupHari);

  const jumlah = (k) => perProduk.reduce((n, p) => n + p[k], 0);
  return {
    hari,
    perProduk,
    bahan,
    omzetHari: jumlah("omzet"),
    omzetTotal: jumlah("omzet") * hari,
    terjualTotal: jumlah("terjual") * hari,
    sisaTotal: jumlah("sisa") * hari,
  };
}
