# Warung Bu Pita — Dashboard Digital Twin

Dashboard monitoring produksi, persediaan, dan penjualan warung jajanan di teras rumah Bu Pita,
dengan denah 3D interaktif (Three.js). Klik zona di denah untuk melihat datanya; catatan digital
dibandingkan dengan hitungan fisik (Cek Kesesuaian).

## Menjalankan

```bash
npm install
npm run dev
```

Tes: `npm test` · Build produksi: `npm run build` (hasil di folder `dist`).

## Database (Supabase)

Tanpa konfigurasi, web memakai **data contoh** (lihat tulisan "Sumber data" di bawah halaman).
Untuk memakai database sungguhan:

1. Buat project gratis di supabase.com.
2. Buka **SQL Editor**, jalankan berurutan: `supabase/schema.sql`, `supabase/seed.sql`, `supabase/peran.sql`,
   `supabase/data-bulan.sql`, `supabase/input-operator.sql`, `supabase/simulasi.sql`.
3. **Authentication → Users → Add user**: buat dua akun (centang *Auto Confirm User*), lalu beri peran
   lewat SQL di bagian bawah `supabase/peran.sql` (ganti emailnya). Matikan pendaftaran publik di
   **Authentication → Sign In / Providers → Email → Allow new users to sign up**.
3. Salin `.env.example` menjadi `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). Jangan pernah memakai `service_role` key.
4. Jalankan ulang `npm run dev`. Tulisan di bawah halaman berubah menjadi "Sumber data: Supabase".

Tabel: `produk`, `cek_kesesuaian`, `penjualan_harian`, `penjualan_jam`, `pengaturan`.
Pengunjung boleh membaca semua tabel, tetapi hanya boleh mengubah kolom `fisik` dan `catatan`
di `cek_kesesuaian` lewat form **Catat hitungan fisik** (halaman Cek Kesesuaian/Produksi/Persediaan/Penjualan).
Perubahan langsung tampil di dashboard (Supabase Realtime).

## Deploy (GitHub Pages)

Setiap push ke branch `main` otomatis di-build dan di-deploy oleh `.github/workflows/deploy.yml`.

1. **Settings → Pages → Source:** pilih **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret:** tambahkan
   `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (isinya sama dengan `.env`).
3. Push ke `main`, tunggu tab **Actions** hijau, lalu buka `https://<username>.github.io/<nama-repo>/`.

## Struktur

- `src/data.js` — satu-satunya pintu data (Supabase atau data contoh)
- `src/scene.js` — memuat model 3D teras warung (Three.js) dan menambahkan klik, label, serta warna status zona
- `blender/denah_warung.blend` — file model 3D (Blender). Nama objek zona (`zona_gudang_stok`, `zona_persiapan`,
  `zona_penggorengan`, `zona_etalase`, `zona_uang`) harus sama dengan id zona di `src/data.js`
- `src/assets/denah-warung.glb` — hasil ekspor model (File → Export → glTF 2.0) yang dimuat web. Setelah mengubah
  model di Blender, ekspor ulang ke file ini
- `src/main.js`, `src/style.css` — tampilan & interaksi
- `src/tanya.js` — "Tanya sistem" (rule-based, siap diganti LLM)
- `supabase/` — skema & data awal database
