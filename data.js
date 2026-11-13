// Data acara & lokasi undangan Wahyu Ariyani & Solichul Umam.

// ── Lokasi acara ─────────────────────────────────────────────────────────────
const LOKASI_MEMPELAI_WANITA = {
  nama: 'Kediaman Mempelai Wanita',
  alamat: 'Rahtawu, Krajan, Gebog, Kudus',
  lintang: -6.744,
  bujur: 110.844,
};

const LOKASI_MEMPELAI_PRIA = {
  nama: 'Kediaman Mempelai Pria',
  alamat: 'Getassrabi, Gebog, Kudus',
  lintang: -6.746,
  bujur: 110.846,
};

// ── Rangkaian acara ──────────────────────────────────────────────────────────
const ACARA_AKAD_NIKAH = {
  jenis: 'Akad Nikah',
  hari: 'Minggu',
  tanggal: '18 Oktober 2026',
  waktu: '09.00 WIB',
  mulai: '2026-10-18T09:00:00+07:00',
  selesai: '2026-10-18T11:00:00+07:00',
  lokasi: LOKASI_MEMPELAI_WANITA,
};

const ACARA_RESEPSI = {
  jenis: 'Resepsi',
  hari: 'Minggu',
  tanggal: '18 Oktober 2026',
  waktu: '11.00 – 13.00 WIB',
  mulai: '2026-10-18T11:00:00+07:00',
  selesai: '2026-10-18T13:00:00+07:00',
  lokasi: LOKASI_MEMPELAI_PRIA,
};

const RANGKAIAN_ACARA = {
  1: [ACARA_AKAD_NIKAH, ACARA_RESEPSI],
};

const VARIAN_ACARA_BAWAAN = '1';
