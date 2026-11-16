-- Tahap 3: simulasi skenario untuk Pemilik (UC-09). Jalankan SETELAH input-operator.sql. Aman dijalankan ulang.

-- Takaran bahan per 1 pcs jajanan (dipakai menghitung kebutuhan bahan di simulasi).
insert into pengaturan (kunci, nilai) values ('resep', '{
  "bakso":  {"isi_bakso": 1, "tepung": 0.02, "minyak": 0.01},
  "pisang": {"pisang_kepok": 0.5, "coklat": 0.05, "tepung": 0.03, "minyak": 0.01},
  "risol":  {"kulit_risol": 1, "tepung": 0.02, "minyak": 0.01}
}'::jsonb)
on conflict (kunci) do nothing;

-- Data Skenario Simulasi: disimpan oleh Pemilik.
create table if not exists skenario (
  id bigint generated always as identity primary key,
  nama text not null check (char_length(nama) between 1 and 80),
  parameter jsonb not null,
  hasil jsonb not null,
  dibuat_pada timestamptz not null default now(),
  oleh uuid default auth.uid()
);
alter table skenario enable row level security;
drop policy if exists "baca berperan" on skenario;
create policy "baca berperan" on skenario for select to authenticated using (peran_saya() is not null);
drop policy if exists "pemilik simpan" on skenario;
create policy "pemilik simpan" on skenario for insert to authenticated with check (peran_saya() = 'pemilik');
drop policy if exists "pemilik hapus" on skenario;
create policy "pemilik hapus" on skenario for delete to authenticated using (peran_saya() = 'pemilik');
revoke all on skenario from anon;
grant select, insert, delete on skenario to authenticated;

do $$
begin
  alter publication supabase_realtime add table skenario;
exception when duplicate_object then null;
end $$;
