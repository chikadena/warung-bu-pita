-- Skema database Warung Bu Pita untuk Supabase (PostgreSQL).
-- Jalankan di Supabase: SQL Editor -> New query -> tempel isi file ini -> Run. Lalu jalankan seed.sql.

create table if not exists produk (
  id text primary key,
  nama text not null,
  harga integer not null check (harga >= 0),
  dibuat integer not null default 0 check (dibuat >= 0),
  rusak integer not null default 0 check (rusak >= 0),
  terjual integer not null default 0 check (terjual >= 0),
  warna text not null default '#2f5bff',
  urutan integer not null default 0
);

-- Catatan digital vs hitungan fisik per zona di teras warung.
create table if not exists cek_kesesuaian (
  id text primary key,
  tab text not null check (tab in ('produksi', 'persediaan', 'penjualan')),
  zona text not null check (zona in ('zona_gudang_stok', 'zona_persiapan', 'zona_penggorengan', 'zona_etalase', 'zona_uang')),
  nama text not null,
  satuan text not null,
  digital numeric not null check (digital >= 0),
  fisik numeric not null check (fisik >= 0),
  catatan text check (char_length(catatan) <= 200),
  urutan integer not null default 0,
  diperbarui timestamptz not null default now()
);

create table if not exists penjualan_harian (
  tanggal date primary key,
  hari text not null,
  omzet integer not null check (omzet >= 0),
  transaksi integer not null check (transaksi >= 0),
  pembeli integer not null check (pembeli >= 0),
  produk jsonb not null -- omzet per produk, contoh {"bakso": 210000, "pisang": 130000, "risol": 72000}
);

create table if not exists penjualan_jam (
  jam integer primary key check (jam between 0 and 23),
  omzet integer not null check (omzet >= 0)
);

-- Nilai pembanding & ringkasan (periode lalu, skor minggu lalu, rekonsiliasi).
create table if not exists pengaturan (
  kunci text primary key,
  nilai jsonb not null
);

-- Keamanan: semua orang boleh MEMBACA; pengunjung tanpa login hanya boleh MENGUBAH
-- kolom fisik/catatan/diperbarui di cek_kesesuaian (untuk form "Catat hitungan fisik").
alter table produk enable row level security;
alter table cek_kesesuaian enable row level security;
alter table penjualan_harian enable row level security;
alter table penjualan_jam enable row level security;
alter table pengaturan enable row level security;

drop policy if exists "baca publik" on produk;
create policy "baca publik" on produk for select using (true);
drop policy if exists "baca publik" on cek_kesesuaian;
create policy "baca publik" on cek_kesesuaian for select using (true);
drop policy if exists "baca publik" on penjualan_harian;
create policy "baca publik" on penjualan_harian for select using (true);
drop policy if exists "baca publik" on penjualan_jam;
create policy "baca publik" on penjualan_jam for select using (true);
drop policy if exists "baca publik" on pengaturan;
create policy "baca publik" on pengaturan for select using (true);

drop policy if exists "catat hitungan fisik" on cek_kesesuaian;
create policy "catat hitungan fisik" on cek_kesesuaian for update using (true) with check (true);
revoke insert, update, delete on all tables in schema public from anon;
grant update (fisik, catatan, diperbarui) on cek_kesesuaian to anon;

-- Realtime: dashboard langsung berubah saat data diubah.
do $$
begin
  alter publication supabase_realtime add table cek_kesesuaian, produk, penjualan_harian, penjualan_jam;
exception when duplicate_object then null;
end $$;
