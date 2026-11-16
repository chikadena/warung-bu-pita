-- Tahap 2: input data oleh Operator (UC-01..UC-04) + peringatan stok menipis (UC-07).
-- Jalankan SETELAH peran.sql. Aman dijalankan ulang.
-- Semua penulisan lewat fungsi di bawah: fungsi memeriksa peran Operator lalu mengubah beberapa tabel sekaligus.

-- Kolom tambahan: batas stok minimum & produk yang terkait dengan baris cek.
alter table cek_kesesuaian add column if not exists minimum numeric check (minimum >= 0);
alter table cek_kesesuaian add column if not exists produk_id text references produk (id);

update cek_kesesuaian set minimum = v.m from (values
  ('tepung', 5), ('kulit_risol', 60), ('isi_bakso', 100), ('pisang_kepok', 30), ('coklat', 4), ('minyak', 4)
) as v(id, m) where cek_kesesuaian.id = v.id and cek_kesesuaian.minimum is null;

update cek_kesesuaian set produk_id = v.p from (values
  ('goreng_bakso', 'bakso'), ('sisa_bakso', 'bakso'),
  ('goreng_pisang', 'pisang'), ('sisa_pisang', 'pisang'),
  ('gulung_risol', 'risol'), ('sisa_risol', 'risol')
) as v(id, p) where cek_kesesuaian.id = v.id;

-- Catatan produksi: dicatat dulu (proses), lalu ditandai selesai.
create table if not exists produksi (
  id bigint generated always as identity primary key,
  produk_id text not null references produk (id),
  jumlah integer not null check (jumlah > 0),
  status text not null default 'proses' check (status in ('proses', 'selesai')),
  dibuat_pada timestamptz not null default now(),
  selesai_pada timestamptz,
  oleh uuid default auth.uid()
);
alter table produksi enable row level security;
drop policy if exists "baca berperan" on produksi;
create policy "baca berperan" on produksi for select to authenticated using (peran_saya() is not null);
revoke all on produksi from anon;
grant select on produksi to authenticated;

create or replace function wajib_operator() returns void language plpgsql stable security definer set search_path = public as $$
begin
  if peran_saya() is distinct from 'operator' then
    raise exception 'Hanya Operator yang boleh mencatat data.';
  end if;
end $$;

-- UC-01: catat produksi (status proses).
create or replace function catat_produksi(p_produk text, p_jumlah integer) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform wajib_operator();
  if p_jumlah is null or p_jumlah <= 0 then raise exception 'Jumlah produksi harus lebih dari 0.'; end if;
  if not exists (select 1 from produk where id = p_produk) then raise exception 'Produk tidak ditemukan.'; end if;
  insert into produksi (produk_id, jumlah) values (p_produk, p_jumlah) returning id into v_id;
  return v_id;
end $$;

-- UC-02: tandai produksi selesai -> stok produk (etalase) & catatan produksi bertambah.
create or replace function selesaikan_produksi(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_produk text; v_jumlah integer;
begin
  perform wajib_operator();
  update produksi set status = 'selesai', selesai_pada = now()
    where id = p_id and status = 'proses' returning produk_id, jumlah into v_produk, v_jumlah;
  if not found then raise exception 'Produksi tidak ditemukan atau sudah selesai.'; end if;
  update produk set dibuat = dibuat + v_jumlah where id = v_produk;
  update cek_kesesuaian set digital = digital + v_jumlah, diperbarui = now() where produk_id = v_produk;
end $$;

-- UC-03: ubah stok (catatan digital) bahan atau produk di etalase, beserta batas minimum.
create or replace function ubah_stok(p_id text, p_digital numeric, p_minimum numeric default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform wajib_operator();
  if p_digital is null or p_digital < 0 then raise exception 'Stok harus angka 0 atau lebih.'; end if;
  if p_minimum is not null and p_minimum < 0 then raise exception 'Batas minimum harus angka 0 atau lebih.'; end if;
  update cek_kesesuaian set digital = p_digital, minimum = coalesce(p_minimum, minimum), diperbarui = now()
    where id = p_id and (tab = 'persediaan' or (tab = 'penjualan' and produk_id is not null));
  if not found then raise exception 'Item stok tidak ditemukan.'; end if;
end $$;

-- UC-04: catat penjualan -> stok etalase berkurang, omzet/transaksi/kas bertambah.
-- shortcut: "hari ini" = tanggal terakhir di penjualan_harian dan penjualan_jam tidak bertanggal; ganti ke current_date bila data sudah harian sungguhan.
create or replace function catat_penjualan(p_produk text, p_jumlah integer) returns integer
language plpgsql security definer set search_path = public as $$
declare v_harga integer; v_sisa numeric; v_total integer; v_jam integer;
begin
  perform wajib_operator();
  if p_jumlah is null or p_jumlah <= 0 then raise exception 'Jumlah terjual harus lebih dari 0.'; end if;
  select harga into v_harga from produk where id = p_produk;
  if not found then raise exception 'Produk tidak ditemukan.'; end if;
  select digital into v_sisa from cek_kesesuaian where produk_id = p_produk and tab = 'penjualan' for update;
  if v_sisa is null or v_sisa < p_jumlah then
    raise exception 'Stok di etalase tidak cukup (tersisa %).', coalesce(v_sisa, 0);
  end if;
  v_total := v_harga * p_jumlah;
  v_jam := extract(hour from now() at time zone 'Asia/Jakarta')::integer;

  update produk set terjual = terjual + p_jumlah where id = p_produk;
  update cek_kesesuaian set digital = digital - p_jumlah, diperbarui = now() where produk_id = p_produk and tab = 'penjualan';
  update cek_kesesuaian set digital = digital + v_total, diperbarui = now() where id = 'kas';
  update penjualan_harian set
      omzet = omzet + v_total, transaksi = transaksi + 1, pembeli = pembeli + 1,
      produk = jsonb_set(produk, array[p_produk], to_jsonb(coalesce((produk ->> p_produk)::integer, 0) + v_total))
    where tanggal = (select max(tanggal) from penjualan_harian);
  insert into penjualan_jam (jam, omzet) values (v_jam, v_total)
    on conflict (jam) do update set omzet = penjualan_jam.omzet + excluded.omzet;
  return v_total;
end $$;

revoke execute on function wajib_operator(), catat_produksi(text, integer), selesaikan_produksi(bigint),
  ubah_stok(text, numeric, numeric), catat_penjualan(text, integer) from public, anon;
grant execute on function catat_produksi(text, integer), selesaikan_produksi(bigint),
  ubah_stok(text, numeric, numeric), catat_penjualan(text, integer) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['produksi', 'pengaturan'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
