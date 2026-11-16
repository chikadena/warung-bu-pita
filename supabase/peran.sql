-- Tahap 1: login & dua peran (Operator, Pemilik). Jalankan SETELAH schema.sql dan seed.sql.
-- Operator: mencatat data (UC-01..UC-05). Pemilik: hanya melihat (UC-06..UC-09).

create table if not exists profil (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  peran text not null check (peran in ('operator', 'pemilik'))
);
alter table profil enable row level security;
drop policy if exists "baca profil sendiri" on profil;
create policy "baca profil sendiri" on profil for select to authenticated using (id = auth.uid());

-- Peran pengguna yang sedang login (null bila belum login / belum diberi peran).
create or replace function peran_saya() returns text
language sql stable security definer set search_path = public as $$
  select peran from profil where id = auth.uid()
$$;

-- Baca data: hanya akun yang sudah diberi peran. Pengunjung tanpa login tidak bisa membaca apa pun.
do $$
declare t text;
begin
  foreach t in array array['produk', 'cek_kesesuaian', 'penjualan_harian', 'penjualan_jam', 'pengaturan'] loop
    execute format('drop policy if exists "baca publik" on %I', t);
    execute format('drop policy if exists "baca berperan" on %I', t);
    execute format('create policy "baca berperan" on %I for select to authenticated using (peran_saya() is not null)', t);
  end loop;
end $$;

-- Tulis: hanya Operator, dan hanya kolom hitungan fisik.
drop policy if exists "catat hitungan fisik" on cek_kesesuaian;
drop policy if exists "operator catat fisik" on cek_kesesuaian;
create policy "operator catat fisik" on cek_kesesuaian for update to authenticated
  using (peran_saya() = 'operator') with check (peran_saya() = 'operator');

revoke all on all tables in schema public from anon;
revoke insert, update, delete on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;
grant update (fisik, catatan, diperbarui) on cek_kesesuaian to authenticated;

-- Setelah membuat 2 akun di Authentication -> Users, beri perannya (ganti email sesuai akunmu):
-- insert into profil (id, nama, peran) select id, 'Operator Warung', 'operator' from auth.users where email = 'operator@contoh.com'
--   on conflict (id) do update set nama = excluded.nama, peran = excluded.peran;
-- insert into profil (id, nama, peran) select id, 'Bu Pita', 'pemilik' from auth.users where email = 'pemilik@contoh.com'
--   on conflict (id) do update set nama = excluded.nama, peran = excluded.peran;
