# Profil Pengguna & Panduan Kolaborasi

## Identitas & Akun GitHub
- Akun GitHub: **zilkyazriel** (sudah terhubung dan terotentikasi di lingkungan lokal via GitHub CLI `gh`).
- Izin Git: Agen diizinkan secara default untuk menjalankan perintah Git (`git commit`, `git push origin <branch>`, `git pull`, `git status`) saat menyelesaikan tugas kode yang diminta pengguna.
- Format Pesan Commit: Gunakan konvensi Conventional Commits yang rapi dan deskriptif:
  - `feat(ui): ...` untuk penambahan atau revisi tampilan/antarmuka.
  - `feat(core): ...` atau `feat(api): ...` untuk logika bisnis/fitur sistem.
  - `fix(...): ...` untuk perbaikan bug atau error.

## Pemahaman Peran Dinamis (Role Awareness)
Agen harus selalu tanggap terhadap peran atau fokus kerja yang disebutkan pengguna:
1. **Fokus Frontend / UI** (contoh: "feat ui", "tampilan", "frontend"):
   - Agen memprioritaskan estetika antarmuka, layout responsif (mobile-first), kenyamanan jempol (*touch-friendly*), animasi halus, dan visual modern.
   - Gunakan data mock/dummy bila backend belum tersedia agar pengembangan UI tidak terhambat.
2. **Fokus Backend / Logika** (contoh: "feat backend", "logika", "skema data"):
   - Agen memprioritaskan kebenaran algoritma, efisiensi komputasi, keutuhan struktur data, validasi input, dan penanganan kasus ekstrem (*edge cases*).
