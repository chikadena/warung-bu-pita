-- Tambahan data penjualan 1–8 Nov 2026 untuk tampilan Bulanan. Aman dijalankan ulang.

insert into penjualan_harian (tanggal, hari, omzet, transaksi, pembeli, produk) values
  ('2026-11-01', 'Min', 398000, 102, 91, '{"bakso":201000,"pisang":125000,"risol":72000}'::jsonb),
  ('2026-11-02', 'Sen', 352000, 90, 81, '{"bakso":177000,"pisang":108000,"risol":67000}'::jsonb),
  ('2026-11-03', 'Sel', 336000, 86, 78, '{"bakso":168000,"pisang":103000,"risol":65000}'::jsonb),
  ('2026-11-04', 'Rab', 371000, 95, 86, '{"bakso":186000,"pisang":115000,"risol":70000}'::jsonb),
  ('2026-11-05', 'Kam', 359000, 92, 83, '{"bakso":180000,"pisang":111000,"risol":68000}'::jsonb),
  ('2026-11-06', 'Jum', 432000, 110, 99, '{"bakso":216000,"pisang":135000,"risol":81000}'::jsonb),
  ('2026-11-07', 'Sab', 498000, 126, 113, '{"bakso":249000,"pisang":156000,"risol":93000}'::jsonb),
  ('2026-11-08', 'Min', 405000, 104, 93, '{"bakso":204000,"pisang":127000,"risol":74000}'::jsonb)
on conflict (tanggal) do nothing;
