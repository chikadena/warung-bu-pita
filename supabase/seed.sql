-- Data awal Warung Bu Pita (1–15 Nov 2026). Jalankan SETELAH schema.sql.

insert into produk (id, nama, harga, dibuat, rusak, terjual, warna, urutan) values
  ('bakso', 'Bakso goreng', 3000, 80, 3, 70, '#22a447', 0),
  ('pisang', 'Pisang coklat', 2500, 60, 2, 52, '#2f5bff', 1),
  ('risol', 'Risol', 2000, 45, 2, 36, '#e0488e', 2)
on conflict (id) do nothing;

insert into cek_kesesuaian (id, tab, zona, nama, satuan, digital, fisik, catatan, urutan) values
  ('tepung', 'persediaan', 'zona_persiapan', 'Tepung terigu', 'kg', 12, 10.5, 'Pemakaian adonan risol pagi belum dicatat (±1,5 kg).', 0),
  ('kulit_risol', 'persediaan', 'zona_gudang_stok', 'Kulit risol', 'lembar', 120, 120, null, 1),
  ('isi_bakso', 'persediaan', 'zona_gudang_stok', 'Bakso mentah', 'butir', 150, 150, null, 2),
  ('pisang_kepok', 'persediaan', 'zona_gudang_stok', 'Pisang kepok', 'buah', 25, 25, null, 3),
  ('coklat', 'persediaan', 'zona_gudang_stok', 'Meses coklat', 'bungkus', 6, 6, null, 4),
  ('minyak', 'persediaan', 'zona_penggorengan', 'Minyak goreng', 'liter', 5, 5, null, 5),
  ('goreng_bakso', 'produksi', 'zona_penggorengan', 'Bakso goreng digoreng', 'pcs', 80, 80, null, 6),
  ('goreng_pisang', 'produksi', 'zona_penggorengan', 'Pisang coklat digoreng', 'pcs', 60, 60, null, 7),
  ('gulung_risol', 'produksi', 'zona_persiapan', 'Risol digulung', 'pcs', 45, 45, null, 8),
  ('sisa_bakso', 'penjualan', 'zona_etalase', 'Sisa bakso goreng', 'pcs', 7, 7, null, 9),
  ('sisa_pisang', 'penjualan', 'zona_etalase', 'Sisa pisang coklat', 'pcs', 6, 6, null, 10),
  ('sisa_risol', 'penjualan', 'zona_etalase', 'Sisa risol', 'pcs', 7, 7, null, 11),
  ('kas', 'penjualan', 'zona_uang', 'Uang di kaleng', 'Rp', 412000, 412000, null, 12)
on conflict (id) do nothing;

insert into penjualan_harian (tanggal, hari, omzet, transaksi, pembeli, produk) values
  ('2026-11-01', 'Min', 398000, 102, 91, '{"bakso":201000,"pisang":125000,"risol":72000}'::jsonb),
  ('2026-11-02', 'Sen', 352000, 90, 81, '{"bakso":177000,"pisang":108000,"risol":67000}'::jsonb),
  ('2026-11-03', 'Sel', 336000, 86, 78, '{"bakso":168000,"pisang":103000,"risol":65000}'::jsonb),
  ('2026-11-04', 'Rab', 371000, 95, 86, '{"bakso":186000,"pisang":115000,"risol":70000}'::jsonb),
  ('2026-11-05', 'Kam', 359000, 92, 83, '{"bakso":180000,"pisang":111000,"risol":68000}'::jsonb),
  ('2026-11-06', 'Jum', 432000, 110, 99, '{"bakso":216000,"pisang":135000,"risol":81000}'::jsonb),
  ('2026-11-07', 'Sab', 498000, 126, 113, '{"bakso":249000,"pisang":156000,"risol":93000}'::jsonb),
  ('2026-11-08', 'Min', 405000, 104, 93, '{"bakso":204000,"pisang":127000,"risol":74000}'::jsonb),
  ('2026-11-09', 'Sen', 385000, 98, 88, '{"bakso":192000,"pisang":121000,"risol":72000}'::jsonb),
  ('2026-11-10', 'Sel', 342000, 87, 79, '{"bakso":171000,"pisang":105000,"risol":66000}'::jsonb),
  ('2026-11-11', 'Rab', 410000, 104, 93, '{"bakso":207000,"pisang":128000,"risol":75000}'::jsonb),
  ('2026-11-12', 'Kam', 368000, 94, 85, '{"bakso":186000,"pisang":112000,"risol":70000}'::jsonb),
  ('2026-11-13', 'Jum', 455000, 115, 103, '{"bakso":228000,"pisang":142000,"risol":85000}'::jsonb),
  ('2026-11-14', 'Sab', 520000, 131, 118, '{"bakso":261000,"pisang":163000,"risol":96000}'::jsonb),
  ('2026-11-15', 'Min', 412000, 106, 94, '{"bakso":210000,"pisang":130000,"risol":72000}'::jsonb)
on conflict (tanggal) do nothing;

insert into penjualan_jam (jam, omzet) values
  (6, 12000),
  (7, 38000),
  (8, 46000),
  (9, 31000),
  (10, 22000),
  (11, 27000),
  (12, 35000),
  (13, 24000),
  (14, 18000),
  (15, 41000),
  (16, 52000),
  (17, 44000),
  (18, 22000)
on conflict (jam) do nothing;

insert into pengaturan (kunci, nilai) values
  ('skor_minggu_lalu', '88'::jsonb),
  ('rekonsiliasi', '{"ditemukan":12,"selesai":11}'::jsonb)
on conflict (kunci) do nothing;
