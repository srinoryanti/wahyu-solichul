// Perilaku undangan Wahyu Ariyani & Solichul Umam.
// RSVP & ucapan disimpan di localStorage (tanpa Supabase).

// ── Pembantu ─────────────────────────────────────────────────────────────────
const parameterUrl = new URLSearchParams(window.location.search);

function ambilParameter(nama) {
  const nilai = parameterUrl.get(nama);
  return nilai && nilai.trim() ? nilai.trim() : '';
}

function teksElemen(pemilih) {
  return document.querySelector(pemilih).textContent.replace(/\s+/g, ' ').trim();
}

function keUtc(waktuIso) {
  return new Date(waktuIso).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

const namaTamu = ambilParameter('to') || 'Bapak/Ibu/Saudara/i';
const varianUndangan = Object.hasOwn(RANGKAIAN_ACARA, ambilParameter('from'))
  ? ambilParameter('from')
  : VARIAN_ACARA_BAWAAN;
const acaraTerpilih = RANGKAIAN_ACARA[varianUndangan];

// ── Nama tamu ────────────────────────────────────────────────────────────────
document.querySelectorAll('[data-isi="nama-tamu"]').forEach((elemen) => {
  elemen.textContent = namaTamu;
});

// ── Tanggal utama ────────────────────────────────────────────────────────────
const acaraUndangan = acaraTerpilih[acaraTerpilih.length - 1];

document.querySelectorAll('[data-isi="tanggal-utama"]').forEach((elemen) => {
  elemen.textContent = `${acaraUndangan.hari}, ${acaraUndangan.tanggal}`;
});

// ── Sorotan kalender ─────────────────────────────────────────────────────────
const tanggalHariH = String(Number(acaraUndangan.mulai.slice(8, 10)));

document.querySelectorAll('.kalender__kisi span').forEach((selKalender) => {
  selKalender.classList.toggle('kalender__hari-h', selKalender.textContent.trim() === tanggalHariH);
});

// ── Rangkaian acara, peta, dan tautan kalender ───────────────────────────────
const namaPendekPasangan = teksElemen('.sampul__nama');
const namaLengkapPasangan = teksElemen('.hero__nama');

function tautanGoogleKalender(acara) {
  const rincian = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${acara.jenis} — ${namaPendekPasangan}`,
    dates: `${keUtc(acara.mulai)}/${keUtc(acara.selesai)}`,
    details: `${acara.jenis} pernikahan ${namaLengkapPasangan}.`,
    location: acara.lokasi.alamat,
    ctz: 'Asia/Jakarta',
  });
  return `https://calendar.google.com/calendar/render?${rincian}`;
}

function tautanPetaTersemat(lokasi) {
  return `https://www.google.com/maps?q=${lokasi.lintang},${lokasi.bujur}&hl=id&z=16&output=embed`;
}

function tautanPetaLuar(lokasi) {
  return `https://www.google.com/maps/search/?api=1&query=${lokasi.lintang},${lokasi.bujur}`;
}

function markupKartuAcara(acara, urutan) {
  return `
    <article class="kartu-acara reveal" style="--jeda-animasi:${urutan * 120}ms">
      <p class="kartu-acara__jenis">${acara.jenis}</p>
      <p class="kartu-acara__waktu">${acara.waktu}</p>
      <p class="kartu-acara__tanggal">${acara.hari}, ${acara.tanggal}</p>
      <div class="kartu-acara__garis" aria-hidden="true"></div>
      <p class="kartu-acara__tempat"><strong>${acara.lokasi.nama}</strong><br /><span class="kartu-acara__alamat">${acara.lokasi.alamat}</span></p>
      <div class="peta">
        <iframe
          src="${tautanPetaTersemat(acara.lokasi)}"
          title="Peta lokasi ${acara.jenis}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen></iframe>
      </div>
      <div class="aksi-lokasi">
        <a class="tombol-kecil" href="${tautanPetaLuar(acara.lokasi)}" target="_blank" rel="noreferrer">Buka Peta</a>
        <button class="tombol-kecil" type="button" data-salin=".kartu-acara__alamat">Salin Alamat</button>
        <a class="tombol-kecil" href="${tautanGoogleKalender(acara)}" target="_blank" rel="noreferrer">Tambah ke Kalender</a>
      </div>
    </article>`;
}

document.querySelector('[data-isi="acara"]').innerHTML = acaraTerpilih.map(markupKartuAcara).join('');

// ── Tombol salin ─────────────────────────────────────────────────────────────
function salinLewatElemenBayangan(teks) {
  const kotakBayangan = document.createElement('textarea');
  kotakBayangan.value = teks;
  kotakBayangan.setAttribute('readonly', '');
  kotakBayangan.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.append(kotakBayangan);
  kotakBayangan.select();
  const berhasil = document.execCommand('copy');
  kotakBayangan.remove();
  return berhasil;
}

async function salinTeks(teks) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(teks);
      return true;
    } catch {
      // Jatuh ke cara cadangan di bawah.
    }
  }
  try {
    return salinLewatElemenBayangan(teks);
  } catch {
    return false;
  }
}

document.addEventListener('click', async (peristiwa) => {
  const tombol = peristiwa.target.closest('[data-salin]');
  if (!tombol) return;

  const sumber = tombol.closest('article').querySelector(tombol.dataset.salin);
  const teksAsli = tombol.textContent;
  tombol.textContent = (await salinTeks(sumber.textContent.trim())) ? 'Tersalin' : 'Gagal menyalin';
  tombol.classList.add('tersalin');
  setTimeout(() => {
    tombol.textContent = teksAsli;
    tombol.classList.remove('tersalin');
  }, 1800);
});

// ── Lightbox galeri ──────────────────────────────────────────────────────────
const fotoGaleri = [...document.querySelectorAll('.galeri__butir img')];
const lightbox = document.querySelector('#lightbox');
const lightboxGambar = document.querySelector('#lightbox-gambar');
let urutanFotoAktif = 0;

function tampilkanFoto(urutan) {
  urutanFotoAktif = (urutan + fotoGaleri.length) % fotoGaleri.length;
  const foto = fotoGaleri[urutanFotoAktif];
  lightboxGambar.src = foto.getAttribute('src');
  lightboxGambar.alt = foto.alt;
}

function bukaLightbox(urutan) {
  tampilkanFoto(urutan);
  lightbox.classList.add('terbuka');
  document.body.classList.add('terkunci');
}

function tutupLightbox() {
  lightbox.classList.remove('terbuka');
  document.body.classList.remove('terkunci');
}

if (lightbox) {
  document.addEventListener('click', (peristiwa) => {
    const butir = peristiwa.target.closest('.galeri__butir');
    if (butir) bukaLightbox(fotoGaleri.findIndex((foto) => butir.contains(foto)));
  });

  lightbox.querySelector('.lightbox__tutup').addEventListener('click', tutupLightbox);
  lightbox.querySelector('.lightbox__sebelum').addEventListener('click', () => tampilkanFoto(urutanFotoAktif - 1));
  lightbox.querySelector('.lightbox__sesudah').addEventListener('click', () => tampilkanFoto(urutanFotoAktif + 1));
  lightbox.addEventListener('click', (peristiwa) => {
    if (peristiwa.target === lightbox) tutupLightbox();
  });

  document.addEventListener('keydown', (peristiwa) => {
    if (!lightbox.classList.contains('terbuka')) return;
    if (peristiwa.key === 'Escape') tutupLightbox();
    if (peristiwa.key === 'ArrowLeft') tampilkanFoto(urutanFotoAktif - 1);
    if (peristiwa.key === 'ArrowRight') tampilkanFoto(urutanFotoAktif + 1);
  });
}

// ── Hitung mundur ────────────────────────────────────────────────────────────
const SATUAN_HITUNG_MUNDUR = [
  { kunci: 'hari', milidetik: 86_400_000 },
  { kunci: 'jam', milidetik: 3_600_000 },
  { kunci: 'menit', milidetik: 60_000 },
  { kunci: 'detik', milidetik: 1_000 },
];

const kisiHitungMundur = document.querySelector('#kisi-hitung-mundur');

if (kisiHitungMundur) {
  const sasaranHitungMundur = document.querySelector('#sasaran-hitung-mundur');
  const selesaiHitungMundur = document.querySelector('#selesai-hitung-mundur');
  const waktuAcaraUndangan = new Date(acaraUndangan.mulai).getTime();
  const angkaSatuan = SATUAN_HITUNG_MUNDUR.map((satuan) => ({
    elemen: kisiHitungMundur.querySelector(`[data-satuan="${satuan.kunci}"]`),
    milidetik: satuan.milidetik,
  }));

  sasaranHitungMundur.textContent = `${acaraUndangan.hari}, ${acaraUndangan.tanggal} · ${acaraUndangan.waktu}`;

  const penghitungMundur = setInterval(perbaruiHitungMundur, 1000);

  function perbaruiHitungMundur() {
    let sisaWaktu = waktuAcaraUndangan - Date.now();
    if (sisaWaktu <= 0) {
      clearInterval(penghitungMundur);
      kisiHitungMundur.hidden = true;
      sasaranHitungMundur.hidden = true;
      selesaiHitungMundur.hidden = false;
      return;
    }
    angkaSatuan.forEach(({ elemen, milidetik }) => {
      const angkaBaru = String(Math.floor(sisaWaktu / milidetik)).padStart(2, '0');
      if (elemen.textContent !== angkaBaru) {
        elemen.textContent = angkaBaru;
        elemen.classList.remove('berdetak');
        void elemen.offsetWidth;
        elemen.classList.add('berdetak');
      }
      sisaWaktu %= milidetik;
    });
  }

  perbaruiHitungMundur();
}

// ── RSVP & ucapan (localStorage) ─────────────────────────────────────────────
const UCAPAN_PER_HALAMAN = 5;
const JEDA_MINIMAL_KIRIM = 5_000;
const KUNCI_KIRIM_TERAKHIR = 'undangan-ws:kirim-terakhir';
const KUNCI_UCAPAN = 'undangan-ws:ucapan';

const formUcapan = document.querySelector('#form-ucapan');

if (formUcapan) {
  const masukanNama = document.querySelector('#masukan-nama');
  const tombolKirim = document.querySelector('#tombol-kirim-ucapan');
  const kabarForm = document.querySelector('#kabar-form');
  const dindingUcapan = document.querySelector('#dinding-ucapan');
  const halamanUcapan = document.querySelector('#halaman-ucapan');
  const keteranganHalaman = document.querySelector('#keterangan-halaman');
  const tombolSebelumnya = document.querySelector('#ucapan-sebelumnya');
  const tombolSelanjutnya = document.querySelector('#ucapan-selanjutnya');

  let halamanAktif = 0;
  let totalUcapan = 0;

  if (namaTamu !== 'Bapak/Ibu/Saudara/i') masukanNama.value = namaTamu;

  function muatDaftarUcapan() {
    try {
      return JSON.parse(localStorage.getItem(KUNCI_UCAPAN)) || [];
    } catch {
      return [];
    }
  }

  function simpanDaftarUcapan(daftar) {
    localStorage.setItem(KUNCI_UCAPAN, JSON.stringify(daftar));
  }

  // Data awal contoh
  if (!localStorage.getItem(KUNCI_UCAPAN)) {
    simpanDaftarUcapan([
      {
        nama: 'Keluarga Besar',
        kehadiran: 'hadir',
        pesan: 'Barakallahu laka wa baraka alaika wa jamaa bainakuma fii khair. Selamat Wahyu & Solichul!',
        dibuat_pada: new Date().toISOString(),
      },
      {
        nama: 'Sahabat',
        kehadiran: 'hadir',
        pesan: 'MasyaAllah, insyaAllah hadir. Lancar sampai hari H!',
        dibuat_pada: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }

  function tampilkanKabar(pesan, jenis) {
    kabarForm.textContent = pesan;
    kabarForm.className = jenis ? `kabar-form kabar-form--${jenis}` : 'kabar-form';
  }

  async function perbaruiPenghitung() {
    const daftar = muatDaftarUcapan();
    const jumlahHadir = daftar.filter((u) => u.kehadiran === 'hadir').length;
    const jumlahTidak = daftar.filter((u) => u.kehadiran === 'tidak').length;
    document.querySelector('#jumlah-hadir').textContent = jumlahHadir;
    document.querySelector('#jumlah-tidak-hadir').textContent = jumlahTidak;
    totalUcapan = daftar.length;
  }

  function kartuUcapan(ucapan) {
    const kartu = document.createElement('article');
    kartu.className = 'kartu-ucapan';

    const kepala = document.createElement('div');
    kepala.className = 'kartu-ucapan__kepala';

    const nama = document.createElement('span');
    nama.className = 'kartu-ucapan__nama';
    nama.textContent = ucapan.nama;

    const lencana = document.createElement('span');
    lencana.className = `kartu-ucapan__lencana kartu-ucapan__lencana--${ucapan.kehadiran}`;
    lencana.textContent = ucapan.kehadiran === 'hadir' ? 'Hadir' : 'Berhalangan';

    const pesan = document.createElement('p');
    pesan.className = 'kartu-ucapan__pesan';
    pesan.textContent = ucapan.pesan;

    const waktu = document.createElement('time');
    waktu.className = 'kartu-ucapan__waktu';
    waktu.dateTime = ucapan.dibuat_pada;
    waktu.textContent = new Date(ucapan.dibuat_pada).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    kepala.append(nama, lencana);
    kartu.append(kepala, pesan, waktu);
    return kartu;
  }

  async function muatUcapan() {
    const daftar = muatDaftarUcapan();
    totalUcapan = daftar.length;

    const awal = halamanAktif * UCAPAN_PER_HALAMAN;
    const akhir = awal + UCAPAN_PER_HALAMAN;
    const halamanIni = daftar.slice(awal, akhir);

    dindingUcapan.innerHTML = '';
    if (!daftar.length) {
      dindingUcapan.innerHTML = '<p class="kabar-form">Belum ada ucapan. Jadilah yang pertama.</p>';
      halamanUcapan.hidden = true;
      return;
    }
    halamanIni.forEach((ucapan, urutan) => {
      const kartu = kartuUcapan(ucapan);
      kartu.style.animationDelay = `${urutan * 70}ms`;
      dindingUcapan.append(kartu);
    });

    const totalHalaman = Math.ceil(totalUcapan / UCAPAN_PER_HALAMAN);
    halamanUcapan.hidden = totalHalaman <= 1;
    keteranganHalaman.textContent = `Halaman ${halamanAktif + 1} dari ${totalHalaman} · ${totalUcapan} ucapan`;
    tombolSebelumnya.disabled = halamanAktif === 0;
    tombolSelanjutnya.disabled = halamanAktif >= totalHalaman - 1;
  }

  async function segarkanRsvp() {
    try {
      await Promise.all([perbaruiPenghitung(), muatUcapan()]);
    } catch (galat) {
      dindingUcapan.innerHTML =
        '<p class="kabar-form kabar-form--gagal">Ucapan gagal dimuat.</p>';
      halamanUcapan.hidden = true;
      console.error('Gagal memuat ucapan:', galat);
    }
  }

  tombolSebelumnya.addEventListener('click', () => {
    if (halamanAktif === 0) return;
    halamanAktif -= 1;
    muatUcapan();
  });

  tombolSelanjutnya.addEventListener('click', () => {
    halamanAktif += 1;
    muatUcapan();
  });

  formUcapan.addEventListener('submit', async (peristiwa) => {
    peristiwa.preventDefault();

    const isian = new FormData(formUcapan);
    const nama = String(isian.get('nama') || '').trim();
    const kehadiran = isian.get('kehadiran');
    const pesan = String(isian.get('pesan') || '').trim();

    if (!nama || !kehadiran || !pesan) {
      tampilkanKabar('Nama, konfirmasi kehadiran, dan ucapan wajib diisi.', 'gagal');
      return;
    }

    const kirimTerakhir = Number(localStorage.getItem(KUNCI_KIRIM_TERAKHIR) || 0);
    const sisaJeda = JEDA_MINIMAL_KIRIM - (Date.now() - kirimTerakhir);
    if (sisaJeda > 0) {
      tampilkanKabar(`Mohon tunggu ${Math.ceil(sisaJeda / 1000)} detik sebelum mengirim ucapan lagi.`, 'gagal');
      return;
    }

    tombolKirim.disabled = true;
    tampilkanKabar('Mengirim...', '');

    try {
      const daftar = muatDaftarUcapan();
      daftar.unshift({
        nama,
        kehadiran,
        pesan,
        asal_undangan: varianUndangan,
        dibuat_pada: new Date().toISOString(),
      });
      simpanDaftarUcapan(daftar);

      localStorage.setItem(KUNCI_KIRIM_TERAKHIR, String(Date.now()));
      formUcapan.reset();
      masukanNama.value = nama;
      halamanAktif = 0;
      tampilkanKabar('Terima kasih, ucapan Anda sudah kami terima.', 'berhasil');
      await segarkanRsvp();
    } catch (galat) {
      tampilkanKabar('Ucapan gagal dikirim. Coba lagi.', 'gagal');
      console.error('Gagal mengirim ucapan:', galat);
    } finally {
      tombolKirim.disabled = false;
    }
  });

  segarkanRsvp();
}

// ── Pemutar musik ────────────────────────────────────────────────────────────
const musikLatar = document.querySelector('#musik-latar');
musikLatar.volume = 0.55;

let unduhanMusikSudahDimulai = false;

function mulaiUnduhMusik() {
  if (unduhanMusikSudahDimulai) return;
  unduhanMusikSudahDimulai = true;
  musikLatar.preload = 'auto';
  musikLatar.load();
}

function jadwalkanUnduhMusikSetelahHalamanSiap() {
  const jadwalkanSaatSenggang = window.requestIdleCallback
    || ((tugas) => setTimeout(tugas, 1200));
  jadwalkanSaatSenggang(() => mulaiUnduhMusik(), { timeout: 5000 });
}

if (document.readyState === 'complete') jadwalkanUnduhMusikSetelahHalamanSiap();
else window.addEventListener('load', jadwalkanUnduhMusikSetelahHalamanSiap, { once: true });

const tombolMusik = document.querySelector('#tombol-musik');
const IKON_MUSIK_MENYALA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>';
const IKON_MUSIK_MATI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/><path d="M3 3l18 18"/></svg>';

function perbaruiTombolMusik() {
  const sedangMain = !musikLatar.paused;
  tombolMusik.innerHTML = sedangMain ? IKON_MUSIK_MENYALA : IKON_MUSIK_MATI;
  tombolMusik.classList.toggle('berputar', sedangMain);
  tombolMusik.setAttribute('aria-label', sedangMain ? 'Matikan musik' : 'Nyalakan musik');
  tombolMusik.setAttribute('aria-pressed', String(sedangMain));
}

if (tombolMusik) {
  perbaruiTombolMusik();
  tombolMusik.addEventListener('click', () => {
    if (musikLatar.paused) {
      mulaiUnduhMusik();
      musikLatar.play().catch(() => {});
    } else {
      musikLatar.pause();
    }
    perbaruiTombolMusik();
  });
  musikLatar.addEventListener('play', perbaruiTombolMusik);
  musikLatar.addEventListener('pause', perbaruiTombolMusik);
}

// ── Navigasi bawah ───────────────────────────────────────────────────────────
const navigasiBawah = document.querySelector('#navigasi-bawah');

if (navigasiBawah) {
  const tautanNavigasi = new Map(
    [...navigasiBawah.querySelectorAll('a')].map((tautan) => [tautan.getAttribute('href').slice(1), tautan]),
  );

  const pengamatNavigasi = new IntersectionObserver((daftarEntri) => {
    daftarEntri.forEach((entri) => {
      if (!entri.isIntersecting) return;
      tautanNavigasi.forEach((tautan) => tautan.classList.remove('aktif'));
      const tautanAktif = tautanNavigasi.get(entri.target.id);
      if (tautanAktif) {
        tautanAktif.classList.add('aktif');
        tautanAktif.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  tautanNavigasi.forEach((_, id) => {
    const bagian = document.querySelector(`#${id}`);
    if (bagian) pengamatNavigasi.observe(bagian);
  });
}

// ── Buka undangan ────────────────────────────────────────────────────────────
document.querySelector('#buka-undangan').addEventListener('click', () => {
  const undangan = document.querySelector('#undangan');
  document.body.classList.remove('terkunci');
  document.body.classList.add('dibuka');
  undangan.setAttribute('aria-hidden', 'false');
  document.querySelector('#sampul').classList.add('sampul--terbuka');
  undangan.focus({ preventScroll: true });
  mulaiUnduhMusik();
  musikLatar.play().catch(() => {});
});

// ── Animasi muncul saat elemen masuk layar ───────────────────────────────────
const ELEMEN_BERANIMASI = [
  '.alis', '.judul-bagian', '.pengantar', '.mempelai', '.pemisah-mempelai',
  '.tanda-kutip', 'blockquote', 'cite', '.hitung-mundur__satuan',
  '.hitung-mundur__sasaran', '.hitung-mundur__selesai', '.tanda-penutup',
  '.penutup h2', '.salam-penutup',
].join(', ');

const JEDA_ANTAR_ELEMEN = 90;
const JEDA_MAKSIMAL = 540;

const pengamatTampilan = new IntersectionObserver((daftarEntri) => {
  daftarEntri.forEach((entri) => {
    if (!entri.isIntersecting) return;
    entri.target.classList.add('tampil');
    pengamatTampilan.unobserve(entri.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('#undangan .bagian:not(.hero)').forEach((bagian) => {
  bagian.querySelectorAll(ELEMEN_BERANIMASI).forEach((elemen, urutan) => {
    elemen.classList.add('reveal');
    elemen.style.setProperty('--jeda-animasi', `${Math.min(urutan * JEDA_ANTAR_ELEMEN, JEDA_MAKSIMAL)}ms`);
  });
});

document.querySelectorAll('#undangan .reveal').forEach((elemen) => pengamatTampilan.observe(elemen));
