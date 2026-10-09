/* ==========================================================
   PIKET GURU DIGITAL — app logic (Vanilla JS + localStorage)
   Struktur data per aktivitas:
   { id, tanggal(YYYY-MM-DD), nama, nis, kelas, jenis,
     keterangan, waktu(HH:MM), status, jenisIzin, judul,
     lokasi, deskripsi, tindakan, createdAt }
   ========================================================== */
(function () {
  'use strict';

  // ---------- Konstanta & state ----------
  var LS_DATA = 'piketDigitalData';
  var LS_THEME = 'piketDigitalTheme';
  var LS_GURU = 'piketDigitalGuru';
  var LS_SCHOOL = 'piketDigitalSchool';

  var KELAS_LIST = [
    'X PPLG 1', 'X PPLG 2', 'XI PPLG 1', 'XI PPLG 2',
    'XII PPLG 1', 'XII PPLG 2', 'X DKV 1', 'XI DKV 1', 'XII DKV 1'
  ];

  var JENIS_LABEL = {
    terlambat: 'Terlambat',
    izin: 'Izin',
    tidak_hadir: 'Tidak Hadir',
    kejadian: 'Kejadian'
  };

  var state = {
    data: [],
    page: 'dashboard',
    filterJenis: 'semua',
    filterTanggal: '',
    filterKelas: '',
    filterStatus: '',
    search: '',
    rekapRange: 'today',
    deleteId: null,
    detailId: null
  };

  // ---------- Helper ----------
  function $(id) { return document.getElementById(id); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return 'id-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function formatTanggal(iso) {
    if (!iso) return '-';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return parseInt(parts[2], 10) + ' ' + bulan[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }
  function formatTanggalPanjang(iso) {
    var hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var d = iso ? new Date(iso + 'T00:00:00') : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var isoStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return hari[d.getDay()] + ', ' + formatTanggal(isoStr);
  }

  // ---------- Toast ----------
  function toast(msg, type) {
    type = type || 'success';
    var wrap = $('toastWrap');
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    var icon = type === 'danger' ? '✕' : type === 'info' ? 'ℹ' : '✓';
    el.innerHTML = '<span>' + icon + '</span><span>' + esc(msg) + '</span>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.classList.add('hide');
      setTimeout(function () { el.remove(); }, 320);
    }, 2800);
  }

  // ---------- Storage ----------
  function loadData() {
    try {
      var raw = localStorage.getItem(LS_DATA);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveData() {
    try { localStorage.setItem(LS_DATA, JSON.stringify(state.data)); } catch (e) {}
  }

  function seedIfEmpty() {
    if (state.data.length > 0) return;
    var t = todayStr();
    state.data = [
      { id: uid(), tanggal: t, nama: 'Andi Saputra', nis: '12001', kelas: 'XII PPLG 1',
        jenis: 'terlambat', keterangan: 'Bangun kesiangan', waktu: '07:35',
        status: 'Tercatat', jenisIzin: '', judul: '', lokasi: '', deskripsi: '', tindakan: '', createdAt: Date.now() - 300000 },
      { id: uid(), tanggal: t, nama: 'Siti Rahma', nis: '12015', kelas: 'XI PPLG 2',
        jenis: 'izin', keterangan: 'Ada acara keluarga', waktu: '08:10',
        status: 'Tercatat', jenisIzin: 'Keperluan keluarga', judul: '', lokasi: '', deskripsi: '', tindakan: '', createdAt: Date.now() - 200000 },
      { id: uid(), tanggal: t, nama: 'Rizky Maulana', nis: '12022', kelas: 'XII PPLG 2',
        jenis: 'tidak_hadir', keterangan: 'Demam, istirahat di rumah', waktu: '-',
        status: 'Sakit', jenisIzin: '', judul: '', lokasi: '', deskripsi: '', tindakan: '', createdAt: Date.now() - 100000 },
      { id: uid(), tanggal: t, nama: 'Keributan di koridor', nis: '-', kelas: 'Koridor lantai 2',
        jenis: 'kejadian', keterangan: 'Beberapa siswa bercanda berlebihan saat jam istirahat, sudah dilerai.',
        waktu: '09:15', status: 'Selesai', jenisIzin: '', judul: 'Keributan di koridor',
        lokasi: 'Koridor', deskripsi: 'Beberapa siswa bercanda berlebihan saat jam istirahat, sudah dilerai.',
        tindakan: 'Diberi teguran dan pembinaan', createdAt: Date.now() - 50000 }
    ];
    saveData();
  }

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(LS_THEME, theme); } catch (e) {}
    var btn = $('themeToggle');
    var btn2 = $('btnThemeSetting');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (btn2) btn2.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(LS_THEME); } catch (e) {}
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  }

  // ---------- Navigasi ----------
  function gotoPage(page) {
    state.page = page;
    var items = document.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-page') === page);
    }
    var pages = document.querySelectorAll('.page');
    for (var j = 0; j < pages.length; j++) pages[j].classList.remove('active');
    var target = $('page-' + page);
    if (target) target.classList.add('active');
    closeSidebarMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openSidebarMobile() {
    $('sidebar').classList.add('open');
    $('sidebarOverlay').classList.add('show');
  }
  function closeSidebarMobile() {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('show');
  }

  // ---------- Modal ----------
  function openModal(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal(id) { $(id).hidden = true; document.body.style.overflow = ''; }

  var TITLES = {
    terlambat: 'Catat Keterlambatan',
    izin: 'Catat Izin',
    tidakhadir: 'Catat Ketidakhadiran',
    kejadian: 'Tambah Kejadian'
  };

  function normalizeJenis(j) {
    if (j === 'tidakhadir' || j === 'tidak_hadir') return 'tidak_hadir';
    return j;
  }

  // Buka form tambah / edit
  function openForm(jenis, editId) {
    jenis = normalizeJenis(jenis);
    var isEdit = !!editId;
    var rec = isEdit ? state.data.find(function (d) { return d.id === editId; }) : null;

    $('formTitle').textContent = (isEdit ? 'Edit ' : '') + (TITLES[jenis] || TITLES[jenis.replace('_', '')] || 'Catat Data');
    // judul khusus tidak_hadir
    if (jenis === 'tidak_hadir') $('formTitle').textContent = (isEdit ? 'Edit' : 'Catat') + ' Ketidakhadiran';

    $('fId').value = isEdit ? rec.id : '';
    $('fJenis').value = jenis;

    var isKejadian = jenis === 'kejadian';
    $('fieldSiswa').hidden = isKejadian;
    $('fieldKejadian').hidden = !isKejadian;

    // Atur field dinamis untuk tiap jenis siswa
    var wrapAlasan = $('wrapAlasan');
    var wrapJenisIzin = $('wrapJenisIzin');
    var wrapKetIzin = $('wrapKetIzin');
    var wrapStatus = $('wrapStatusSiswa');
    var fStatus = $('fStatus');
    var fKet = $('fKeterangan');

    if (jenis === 'terlambat') {
      wrapAlasan.hidden = false;
      wrapJenisIzin.hidden = true;
      wrapKetIzin.hidden = true;
      wrapStatus.hidden = false;
      fStatus.innerHTML = '<option>Tercatat</option>';
      document.querySelector('#wrapAlasan .lbl').textContent = 'Alasan keterlambatan *';
      fKet.placeholder = 'cth: Bangun kesiangan';
    } else if (jenis === 'izin') {
      wrapAlasan.hidden = true;
      wrapJenisIzin.hidden = false;
      wrapKetIzin.hidden = false;
      wrapStatus.hidden = false;
      fStatus.innerHTML = '<option>Tercatat</option><option>Disetujui</option>';
      $('fKeterangan').value = '';
    } else if (jenis === 'tidak_hadir') {
      wrapAlasan.hidden = false;
      wrapJenisIzin.hidden = true;
      wrapKetIzin.hidden = true;
      wrapStatus.hidden = false;
      fStatus.innerHTML = '<option>Sakit</option><option>Izin</option><option>Alpa</option>';
      document.querySelector('#wrapAlasan .lbl').textContent = 'Keterangan *';
      fKet.placeholder = 'cth: Demam, istirahat di rumah';
    }

    clearErrors();

    if (isEdit && rec) {
      if (!isKejadian) {
        $('fNama').value = rec.nama || '';
        $('fNis').value = rec.nis || '';
        $('fKelas').value = rec.kelas || '';
        $('fTanggal').value = rec.tanggal || todayStr();
        $('fWaktu').value = rec.waktu && rec.waktu !== '-' ? rec.waktu : '';
        $('fStatus').value = rec.status || 'Tercatat';
        if (jenis === 'izin') {
          $('fJenisIzin').value = rec.jenisIzin || '';
          $('fKeteranganIzin').value = rec.keterangan || '';
        } else {
          $('fKeterangan').value = rec.keterangan || '';
        }
      } else {
        $('fJudul').value = rec.judul || rec.nama || '';
        $('fLokasi').value = rec.lokasi || '';
        $('fWaktuKejadian').value = rec.waktu && rec.waktu !== '-' ? rec.waktu : '';
        $('fDeskripsi').value = rec.deskripsi || rec.keterangan || '';
        $('fTindakan').value = rec.tindakan || '';
        $('fStatusKejadian').value = rec.status || 'Ditangani';
        $('fTanggalKejadian').value = rec.tanggal || todayStr();
      }
    } else {
      $('piketForm').reset();
      var t = todayStr();
      $('fTanggal').value = t;
      $('fTanggalKejadian').value = t;
      try {
        var now = new Date();
        var hm = pad(now.getHours()) + ':' + pad(now.getMinutes());
        $('fWaktu').value = hm;
        $('fWaktuKejadian').value = hm;
      } catch (e) {}
    }

    closeModal('chooseModal');
    openModal('formModal');
  }

  function clearErrors() {
    var errs = document.querySelectorAll('.err');
    for (var i = 0; i < errs.length; i++) errs[i].textContent = '';
  }
  function setErr(id, msg) { $(id).textContent = msg; }

  // Validasi + simpan
  function handleSubmit(e) {
    e.preventDefault();
    clearErrors();
    var jenis = normalizeJenis($('fJenis').value);
    var editId = $('fId').value || null;
    var ok = true;

    if (jenis === 'kejadian') {
      var judul = $('fJudul').value.trim();
      var lokasi = $('fLokasi').value;
      var deskripsi = $('fDeskripsi').value.trim();
      if (!judul) { setErr('eJudul', 'Judul wajib diisi.'); ok = false; }
      if (!lokasi) { setErr('eLokasi', 'Pilih lokasi kejadian.'); ok = false; }
      if (!deskripsi) { setErr('eDeskripsi', 'Deskripsi wajib diisi.'); ok = false; }
      if (!ok) return;

      var recK = {
        id: editId || uid(),
        tanggal: $('fTanggalKejadian').value || todayStr(),
        nama: judul,
        nis: '-',
        kelas: lokasiDetail($('fLokasi').value),
        jenis: 'kejadian',
        keterangan: deskripsi,
        waktu: $('fWaktuKejadian').value || '-',
        status: $('fStatusKejadian').value,
        jenisIzin: '',
        judul: judul,
        lokasi: lokasi,
        deskripsi: deskripsi,
        tindakan: $('fTindakan').value.trim(),
        createdAt: Date.now()
      };
      upsert(recK, editId, 'Catatan kejadian berhasil ditambahkan', 'Catatan kejadian berhasil diperbarui');
      return;
    }

    // --- validasi siswa ---
    var nama = $('fNama').value.trim();
    var nis = $('fNis').value.trim();
    var kelas = $('fKelas').value;
    var tanggal = $('fTanggal').value;
    var waktu = $('fWaktu').value;
    var status = $('fStatus').value;

    if (nama.length < 3) { setErr('eNama', 'Nama minimal 3 huruf.'); ok = false; }
    if (!nis) { setErr('eNis', 'NIS wajib diisi.'); ok = false; }
    if (!kelas) { setErr('eKelas', 'Pilih kelas.'); ok = false; }
    if (!tanggal) { setErr('eTanggal', 'Tanggal wajib diisi.'); ok = false; }

    var keterangan = '';
    var jenisIzin = '';
    if (jenis === 'terlambat') {
      keterangan = $('fKeterangan').value.trim();
      if (!waktu) { setErr('eWaktu', 'Jam datang wajib diisi.'); ok = false; }
      if (!keterangan) { setErr('eKeterangan', 'Alasan wajib diisi.'); ok = false; }
    } else if (jenis === 'izin') {
      jenisIzin = $('fJenisIzin').value;
      keterangan = $('fKeteranganIzin').value.trim();
      if (!jenisIzin) { setErr('eJenisIzin', 'Pilih jenis izin.'); ok = false; }
      if (!waktu) waktu = '-';
      if (!keterangan) keterangan = jenisIzin;
    } else if (jenis === 'tidak_hadir') {
      keterangan = $('fKeterangan').value.trim();
      if (!keterangan) { setErr('eKeterangan', 'Keterangan wajib diisi.'); ok = false; }
      if (!waktu) waktu = '-';
    }
    if (!ok) return;

    var rec = {
      id: editId || uid(),
      tanggal: tanggal,
      nama: nama,
      nis: nis,
      kelas: kelas,
      jenis: jenis,
      keterangan: keterangan,
      waktu: waktu || '-',
      status: status,
      jenisIzin: jenisIzin,
      judul: '', lokasi: '', deskripsi: '', tindakan: '',
      createdAt: Date.now()
    };
    var msgAdd = jenis === 'terlambat' ? 'Data keterlambatan berhasil disimpan'
      : jenis === 'izin' ? 'Data izin berhasil disimpan'
      : 'Data ketidakhadiran berhasil disimpan';
    upsert(rec, editId, msgAdd, 'Data berhasil diperbarui');
  }

  function lokasiDetail(lokasi) {
    if (lokasi === 'Koridor') return 'Koridor lantai 2';
    if (lokasi === 'Kelas') return 'Ruang kelas';
    return lokasi;
  }

  function upsert(rec, editId, msgAdd, msgEdit) {
    if (editId) {
      var idx = state.data.findIndex(function (d) { return d.id === editId; });
      if (idx > -1) {
        rec.createdAt = state.data[idx].createdAt;
        state.data[idx] = rec;
      }
      toast(msgEdit, 'success');
    } else {
      state.data.unshift(rec);
      toast(msgAdd, 'success');
    }
    saveData();
    closeModal('formModal');
    renderAll();
  }

  // ---------- Detail ----------
  function openDetail(id) {
    var rec = state.data.find(function (d) { return d.id === id; });
    if (!rec) return;
    state.detailId = id;
    var html = '';
    if (rec.jenis === 'kejadian') {
      html += row('Judul', rec.judul || rec.nama);
      html += row('Lokasi', rec.lokasi + (rec.kelas && rec.kelas !== rec.lokasi ? ' — ' + rec.kelas : ''));
      html += row('Tanggal', formatTanggal(rec.tanggal));
      html += row('Waktu', rec.waktu);
      html += row('Deskripsi', rec.deskripsi || rec.keterangan);
      html += row('Tindakan', rec.tindakan || '-');
      html += row('Status', rec.status);
    } else {
      html += row('Nama', rec.nama);
      html += row('NIS', rec.nis);
      html += row('Kelas', rec.kelas);
      html += row('Jenis', JENIS_LABEL[rec.jenis] || rec.jenis);
      if (rec.jenis === 'izin' && rec.jenisIzin) html += row('Jenis Izin', rec.jenisIzin);
      html += row('Waktu', rec.waktu);
      html += row('Keterangan', rec.keterangan || '-');
      html += row('Status', rec.status);
      html += row('Tanggal', formatTanggal(rec.tanggal));
    }
    $('detailBody').innerHTML = html;
    openModal('detailModal');
  }
  function row(k, v) {
    return '<div class="d-row"><span>' + esc(k) + '</span><span>' + esc(v) + '</span></div>';
  }

  // ---------- Hapus ----------
  function askDelete(id) {
    var rec = state.data.find(function (d) { return d.id === id; });
    if (!rec) return;
    state.deleteId = id;
    $('deletePreview').innerHTML = '<strong>' + esc(rec.jenis === 'kejadian' ? (rec.judul || rec.nama) : rec.nama) + '</strong><br><small>' +
      esc(JENIS_LABEL[rec.jenis] || '') + ' • ' + esc(rec.kelas || '') + ' • ' + esc(formatTanggal(rec.tanggal)) + '</small>';
    openModal('deleteModal');
  }
  function confirmDelete() {
    if (!state.deleteId) return;
    state.data = state.data.filter(function (d) { return d.id !== state.deleteId; });
    saveData();
    state.deleteId = null;
    closeModal('deleteModal');
    toast('Data berhasil dihapus', 'success');
    renderAll();
  }

  // ---------- Filter & search ----------
  function filteredData(onlyJenis) {
    var q = state.search.trim().toLowerCase();
    return state.data.filter(function (d) {
      if (onlyJenis && d.jenis !== onlyJenis) return false;
      if (!onlyJenis && state.filterJenis !== 'semua' && d.jenis !== state.filterJenis) return false;
      if (!onlyJenis && state.filterTanggal && d.tanggal !== state.filterTanggal) return false;
      if (!onlyJenis && state.filterKelas && d.kelas !== state.filterKelas) return false;
      if (!onlyJenis && state.filterStatus && d.status !== state.filterStatus) return false;
      if (q) {
        var hay = [d.nama, d.nis, d.kelas, JENIS_LABEL[d.jenis] || d.jenis, d.keterangan,
          d.status, d.judul, d.lokasi, d.deskripsi, d.jenisIzin].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      if (a.tanggal === b.tanggal) return (b.createdAt || 0) - (a.createdAt || 0);
      return a.tanggal < b.tanggal ? 1 : -1;
    });
  }

  // ---------- Render ----------
  function badge(jenis) {
    return '<span class="badge b-' + jenis + '">' + esc(JENIS_LABEL[jenis] || jenis) + '</span>';
  }
  function actionBtns(id) {
    return '<div class="row-actions">' +
      '<button class="btn btn-ghost btn-sm" data-act="detail" data-id="' + id + '">Detail</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="edit" data-id="' + id + '">Edit</button>' +
      '<button class="btn btn-danger btn-sm" data-act="hapus" data-id="' + id + '">Hapus</button></div>';
  }

  function renderStats() {
    var t = todayStr();
    var today = state.data.filter(function (d) { return d.tanggal === t; });
    function count(j) { return today.filter(function (d) { return d.jenis === j; }).length; }
    $('statTotal').textContent = today.length;
    $('statTerlambat').textContent = count('terlambat');
    $('statIzin').textContent = count('izin');
    $('statTidakHadir').textContent = count('tidak_hadir');
    $('todayLabel').textContent = formatTanggalPanjang(t);
  }

  function renderTimeline() {
    var el = $('activityTimeline');
    var latest = state.data.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 5);
    if (!latest.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-ico">📭</div><h3>Belum ada aktivitas</h3><p>Data aktivitas piket akan muncul di sini.</p></div>';
      return;
    }
    var icons = { terlambat: '🕐', izin: '📝', tidak_hadir: '🚫', kejadian: '📋' };
    el.innerHTML = latest.map(function (d) {
      var title = d.jenis === 'kejadian'
        ? 'Kejadian baru dicatat'
        : esc(d.nama) + ' ' + (d.jenis === 'terlambat' ? 'terlambat' : d.jenis === 'izin' ? 'meminta izin' : 'tidak hadir');
      var sub = d.jenis === 'kejadian'
        ? esc(d.judul || d.nama) + ' • ' + esc(d.kelas || d.lokasi || '')
        : 'Kelas ' + esc(d.kelas) + (d.keterangan ? ' • ' + esc(d.keterangan.slice(0, 40)) : '');
      return '<div class="tl-item"><div class="tl-ico">' + (icons[d.jenis] || '📌') + '</div>' +
        '<div class="tl-body"><strong>' + title + '</strong><small>' + sub + '</small></div>' +
        '<span class="tl-time">' + esc(d.waktu || '') + '</span></div>';
    }).join('');
  }

  function renderClassStats() {
    var map = {};
    state.data.forEach(function (d) {
      var k = d.jenis === 'kejadian' ? (d.lokasi || d.kelas || 'Lainnya') : (d.kelas || 'Tanpa kelas');
      map[k] = (map[k] || 0) + 1;
    });
    var entries = Object.keys(map).map(function (k) { return { kelas: k, n: map[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 8);
    var max = entries.length ? entries[0].n : 1;
    $('classStats').innerHTML = entries.length ? entries.map(function (e) {
      var pct = Math.round((e.n / max) * 100);
      return '<div class="class-row"><div class="row-top"><span>' + esc(e.kelas) + '</span><span>' + e.n + ' aktivitas</span></div>' +
        '<div class="progress"><div style="width:' + pct + '%"></div></div></div>';
    }).join('') : '<p class="muted">Belum ada data kelas.</p>';

    // rekap per kelas (bulan berjalan)
    var now = new Date();
    var prefix = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var map2 = {};
    state.data.filter(function (d) { return d.tanggal.indexOf(prefix) === 0 && d.jenis !== 'kejadian'; })
      .forEach(function (d) { map2[d.kelas] = (map2[d.kelas] || 0) + 1; });
    var e2 = Object.keys(map2).map(function (k) { return { kelas: k, n: map2[k] }; }).sort(function (a, b) { return b.n - a.n; });
    var max2 = e2.length ? e2[0].n : 1;
    var rk = $('rekapKelas');
    if (rk) rk.innerHTML = e2.length ? e2.map(function (x) {
      return '<div class="class-row"><div class="row-top"><span>' + esc(x.kelas) + '</span><span>' + x.n + ' aktivitas</span></div>' +
        '<div class="progress"><div style="width:' + Math.round(x.n / max2 * 100) + '%"></div></div></div>';
    }).join('') : '<p class="muted">Belum ada data bulan ini.</p>';
  }

  function renderMainTable() {
    var rows = filteredData(null);
    var tb = $('dataTableBody');
    tb.innerHTML = rows.map(function (d, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(formatTanggal(d.tanggal)) + '</td>' +
        '<td><strong>' + esc(d.jenis === 'kejadian' ? (d.judul || d.nama) : d.nama) + '</strong><br><small style="color:var(--text-2)">' + esc(d.nis || '') + '</small></td>' +
        '<td>' + esc(d.kelas || '-') + '</td><td>' + badge(d.jenis) + '</td>' +
        '<td>' + esc((d.keterangan || '').slice(0, 60)) + '</td>' +
        '<td>' + esc(d.waktu || '-') + '</td>' +
        '<td><span class="badge b-status">' + esc(d.status || '-') + '</span></td>' +
        '<td>' + actionBtns(d.id) + '</td></tr>';
    }).join('');

    // mobile cards
    $('dataMobileList').innerHTML = rows.map(function (d) {
      return '<div class="m-card"><strong>' + esc(d.jenis === 'kejadian' ? (d.judul || d.nama) : d.nama) + '</strong> ' + badge(d.jenis) +
        '<div class="m-meta">' + esc(d.kelas || '') + ' • ' + esc(formatTanggal(d.tanggal)) + ' • ' + esc(d.waktu || '') + '<br>' + esc((d.keterangan || '').slice(0, 80)) + '</div>' +
        actionBtns(d.id) + '</div>';
    }).join('');

    var hasData = state.data.length > 0;
    var hasResult = rows.length > 0;
    $('dataEmpty').hidden = hasData;
    document.querySelector('#page-data .table-wrap').style.display = hasResult ? '' : 'none';
    $('dataMobileList').style.display = hasResult ? '' : 'none';
    var nf = $('dataNotFound');
    nf.hidden = !(hasData && !hasResult);
  }

  function renderJenisTable(jenis, bodyId, mobileId, cols) {
    var rows = filteredData(jenis).filter(function (d) {
      // pencarian global tetap berlaku lewat filteredData
      return true;
    });
    var tb = $(bodyId);
    tb.innerHTML = rows.map(function (d, i) {
      return '<tr>' + cols.map(function (c) {
        if (c === '_no') return '<td>' + (i + 1) + '</td>';
        if (c === '_aksi') return '<td>' + actionBtns(d.id) + '</td>';
        if (c === 'tanggal') return '<td>' + esc(formatTanggal(d.tanggal)) + '</td>';
        if (c === 'jenisIzin') return '<td>' + esc(d.jenisIzin || '-') + '</td>';
        return '<td>' + esc(d[c] != null && d[c] !== '' ? d[c] : '-') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var m = $(mobileId);
    if (m) {
      m.innerHTML = rows.length ? rows.map(function (d) {
        var title = jenis === 'kejadian' ? (d.judul || d.nama) : d.nama;
        return '<div class="m-card"><strong>' + esc(title) + '</strong>' +
          '<div class="m-meta">' + esc(d.kelas || '') + ' • ' + esc(formatTanggal(d.tanggal)) + '</div>' + actionBtns(d.id) + '</div>';
      }).join('') : '<div class="empty-state"><div class="empty-ico">📭</div><h3>Belum ada data</h3><p>Belum ada data pada kategori ini.</p></div>';
    }
  }

  function renderKejadian() {
    var rows = filteredData('kejadian');
    var grid = $('kejadianGrid');
    grid.innerHTML = rows.map(function (d) {
      var st = d.status === 'Selesai' ? 'b-izin' : d.status === 'Dalam proses' ? 'b-terlambat' : 'b-kejadian';
      return '<div class="k-card"><div class="k-foot"><span class="badge b-kejadian">📋 Kejadian</span>' +
        '<span class="badge ' + st + '">' + esc(d.status) + '</span></div>' +
        '<h4>' + esc(d.judul || d.nama) + '</h4>' +
        '<div class="k-meta">📍 ' + esc(d.lokasi || d.kelas || '') + ' • ' + esc(formatTanggal(d.tanggal)) + ' • ' + esc(d.waktu || '') + '</div>' +
        '<p class="k-desc">' + esc(d.deskripsi || d.keterangan || '') + '</p>' +
        (d.tindakan ? '<div class="k-meta">🛠 <strong>Tindakan:</strong> ' + esc(d.tindakan) + '</div>' : '') +
        '<div class="k-foot">' + actionBtns(d.id) + '</div></div>';
    }).join('');
    $('kejadianEmpty').hidden = state.data.filter(function (d) { return d.jenis === 'kejadian'; }).length > 0;
    grid.style.display = rows.length ? '' : 'none';
  }

  // ---------- Rekap ----------
  function inRange(tanggalISO, range) {
    var t = todayStr();
    if (range === 'today') return tanggalISO === t;
    var d = new Date(tanggalISO + 'T00:00:00');
    var now = new Date();
    if (isNaN(d.getTime())) return false;
    if (range === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (range === 'week') {
      var start = new Date(now);
      var day = (now.getDay() + 6) % 7; // Senin = 0
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      var end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    return true;
  }

  function renderRekap() {
    var r = state.rekapRange;
    var rows = state.data.filter(function (d) { return inRange(d.tanggal, r); });
    function c(j) { return rows.filter(function (d) { return d.jenis === j; }).length; }
    var nT = c('terlambat'), nI = c('izin'), nH = c('tidak_hadir'), nK = c('kejadian');
    $('rekapTerlambat').textContent = nT;
    $('rekapIzin').textContent = nI;
    $('rekapTidakHadir').textContent = nH;
    $('rekapKejadian').textContent = nK;
    var labels = { today: 'Hari ini', week: 'Minggu ini', month: 'Bulan ini' };
    $('rekapLabel').textContent = labels[r] || '';
    var max = Math.max(nT, nI, nH, nK, 1);
    function bar(label, n, cls) {
      var pct = Math.round((n / max) * 100);
      return '<div class="bar-row"><span>' + label + '</span><div class="bar"><div class="' + cls + '" style="width:' + pct + '%"></div></div><strong>' + n + '</strong></div>';
    }
    $('barChart').innerHTML =
      bar('Terlambat', nT, 'bar-terlambat') +
      bar('Izin', nI, 'bar-izin') +
      bar('Tidak Hadir', nH, 'bar-tidak') +
      bar('Kejadian', nK, 'bar-kejadian');
    // animasi progress
    requestAnimationFrame(function () {
      var bars = document.querySelectorAll('#barChart .bar > div, #classStats .progress > div');
      for (var i = 0; i < bars.length; i++) {
        var w = bars[i].style.width;
        bars[i].style.width = '0';
        (function (el, ww) { setTimeout(function () { el.style.width = ww; }, 60); })(bars[i], w);
      }
    });
  }

  // ---------- Notifikasi ----------
  function renderNotif() {
    var latest = state.data.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }).slice(0, 4);
    $('notifList').innerHTML = latest.length ? latest.map(function (d) {
      var t = d.jenis === 'kejadian' ? (d.judul || d.nama) : d.nama + ' — ' + (JENIS_LABEL[d.jenis] || '');
      return '<div class="notif-item"><strong>' + esc(t) + '</strong><br><small>' + esc(d.kelas || '') + ' • ' + esc(formatTanggal(d.tanggal)) + '</small></div>';
    }).join('') : '<p class="muted">Belum ada notifikasi.</p>';
    $('notifDot').classList.toggle('show', latest.length > 0);
  }

  function renderAll() {
    renderStats();
    renderTimeline();
    renderClassStats();
    renderMainTable();
    renderJenisTable('terlambat', 'terlambatBody', 'terlambatMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'waktu', 'keterangan', '_aksi']);
    renderJenisTable('izin', 'izinBody', 'izinMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'jenisIzin', 'keterangan', '_aksi']);
    renderJenisTable('tidak_hadir', 'tidakhadirBody', 'tidakhadirMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'status', 'keterangan', '_aksi']);
    renderKejadian();
    renderRekap();
    renderNotif();
  }

  // ---------- Export / print ----------
  function exportCSV() {
    if (!state.data.length) { toast('Belum ada data untuk diekspor', 'info'); return; }
    var head = ['Tanggal', 'Nama', 'NIS', 'Kelas', 'Jenis', 'Keterangan', 'Waktu', 'Status'];
    var lines = [head.join(';')];
    state.data.forEach(function (d) {
      lines.push([d.tanggal, d.nama, d.nis, d.kelas, JENIS_LABEL[d.jenis] || d.jenis,
        (d.keterangan || '').replace(/;/g, ','), d.waktu, d.status].map(function (v) {
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      }).join(';'));
    });
    var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rekap-piket-' + todayStr() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Data berhasil diekspor ke CSV', 'success');
  }

  // ---------- Init ----------
  function fillKelas() {
    var opts = '<option value="">— Pilih kelas —</option>' +
      KELAS_LIST.map(function (k) { return '<option>' + k + '</option>'; }).join('');
    $('fKelas').innerHTML = opts;
    $('filterKelas').innerHTML = '<option value="">Semua Kelas</option>' +
      KELAS_LIST.map(function (k) { return '<option>' + k + '</option>'; }).join('');
  }

  function initHeader() {
    var h = new Date().getHours();
    var sapaan = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
    var guru = '';
    try { guru = localStorage.getItem(LS_GURU) || ''; } catch (e) {}
    var namaTampil = guru ? ', ' + guru.split(' ')[0] : ', Guru';
    // hindari emoji berlebih? spesifikasi meminta 👋 — pertahankan 1 saja
    $('greeting').textContent = sapaan + namaTampil + ' 👋';
    $('currentDate').textContent = formatTanggalPanjang(todayStr());
    if (guru) $('sidebarGuruName').textContent = guru;
    try {
      var sch = localStorage.getItem(LS_SCHOOL);
      if (sch) document.querySelector('.brand-text span').textContent = sch;
    } catch (e) {}
  }

  function bindEvents() {
    // navigasi sidebar
    var navs = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navs.length; i++) {
      navs[i].addEventListener('click', function () { gotoPage(this.getAttribute('data-page')); });
    }
    var gotos = document.querySelectorAll('[data-goto]');
    for (var g = 0; g < gotos.length; g++) {
      gotos[g].addEventListener('click', function () { gotoPage(this.getAttribute('data-goto')); });
    }

    $('hamburger').addEventListener('click', openSidebarMobile);
    $('sidebarClose').addEventListener('click', closeSidebarMobile);
    $('sidebarOverlay').addEventListener('click', closeSidebarMobile);

    // quick action & tombol tambah
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (t) { openForm(t.getAttribute('data-action'), null); return; }
      var act = e.target.closest('[data-act]');
      if (act) {
        var id = act.getAttribute('data-id');
        var a = act.getAttribute('data-act');
        if (a === 'detail') openDetail(id);
        else if (a === 'edit') {
          var rec = state.data.find(function (d) { return d.id === id; });
          if (rec) openForm(rec.jenis, id);
        }
        else if (a === 'hapus') askDelete(id);
      }
    });

    $('btnTambahUmum').addEventListener('click', function () { openModal('chooseModal'); });
    $('chooseClose').addEventListener('click', function () { closeModal('chooseModal'); });
    $('chooseModal').addEventListener('click', function (e) { if (e.target === this) closeModal('chooseModal'); });

    // form
    $('piketForm').addEventListener('submit', handleSubmit);
    var closers = document.querySelectorAll('#formModal [data-close]');
    for (var c = 0; c < closers.length; c++) {
      closers[c].addEventListener('click', function () { closeModal('formModal'); });
    }
    $('formModal').addEventListener('click', function (e) { if (e.target === this) closeModal('formModal'); });

    // detail
    var dcs = document.querySelectorAll('[data-close-detail]');
    for (var d = 0; d < dcs.length; d++) {
      dcs[d].addEventListener('click', function () { closeModal('detailModal'); });
    }
    $('detailModal').addEventListener('click', function (e) { if (e.target === this) closeModal('detailModal'); });
    $('btnDetailEdit').addEventListener('click', function () {
      var rec = state.data.find(function (x) { return x.id === state.detailId; });
      closeModal('detailModal');
      if (rec) openForm(rec.jenis, rec.id);
    });

    // hapus
    $('btnCancelDelete').addEventListener('click', function () { closeModal('deleteModal'); });
    $('btnConfirmDelete').addEventListener('click', confirmDelete);
    $('deleteModal').addEventListener('click', function (e) { if (e.target === this) closeModal('deleteModal'); });

    // ESC menutup modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        ['formModal', 'detailModal', 'deleteModal', 'chooseModal'].forEach(closeModal);
        $('notifDropdown').classList.remove('show');
      }
    });

    // search (header + realtime)
    var searchTimer = null;
    $('globalSearch').addEventListener('input', function () {
      var v = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.search = v;
        renderMainTable();
        // jika sedang di halaman jenis lain, arahkan ke Data Piket saat mencari
        if (v.trim() && (state.page === 'dashboard')) { /* tetap di dashboard */ }
        renderJenisTable('terlambat', 'terlambatBody', 'terlambatMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'waktu', 'keterangan', '_aksi']);
        renderJenisTable('izin', 'izinBody', 'izinMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'jenisIzin', 'keterangan', '_aksi']);
        renderJenisTable('tidak_hadir', 'tidakhadirBody', 'tidakhadirMobile', ['_no', 'tanggal', 'nama', 'nis', 'kelas', 'status', 'keterangan', '_aksi']);
        renderKejadian();
      }, 180);
    });

    // filter chips jenis
    var chips = document.querySelectorAll('#jenisChips .chip');
    for (var k = 0; k < chips.length; k++) {
      chips[k].addEventListener('click', function () {
        for (var x = 0; x < chips.length; x++) chips[x].classList.remove('active');
        this.classList.add('active');
        state.filterJenis = this.getAttribute('data-jenis');
        renderMainTable();
      });
    }
    $('filterTanggal').addEventListener('change', function () { state.filterTanggal = this.value; renderMainTable(); });
    $('filterKelas').addEventListener('change', function () { state.filterKelas = this.value; renderMainTable(); });
    $('filterStatus').addEventListener('change', function () { state.filterStatus = this.value; renderMainTable(); });
    $('btnResetFilter').addEventListener('click', function () {
      state.filterJenis = 'semua'; state.filterTanggal = ''; state.filterKelas = ''; state.filterStatus = ''; state.search = '';
      $('globalSearch').value = '';
      $('filterTanggal').value = ''; $('filterKelas').value = ''; $('filterStatus').value = '';
      var cs = document.querySelectorAll('#jenisChips .chip');
      for (var x = 0; x < cs.length; x++) cs[x].classList.toggle('active', cs[x].getAttribute('data-jenis') === 'semua');
      renderMainTable();
      toast('Filter direset', 'info');
    });

    // rekap range
    var rchips = document.querySelectorAll('#rekapChips .chip');
    for (var r = 0; r < rchips.length; r++) {
      rchips[r].addEventListener('click', function () {
        for (var x = 0; x < rchips.length; x++) rchips[x].classList.remove('active');
        this.classList.add('active');
        state.rekapRange = this.getAttribute('data-range');
        renderRekap();
      });
    }

    // theme
    $('themeToggle').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
    });
    $('btnThemeSetting').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
    });

    // notifikasi
    $('notifBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      $('notifDropdown').classList.toggle('show');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.notif-dropdown') && !e.target.closest('#notifBtn')) {
        $('notifDropdown').classList.remove('show');
      }
    });

    // pengaturan
    $('btnSaveSettings').addEventListener('click', function () {
      var gn = $('settingGuruName').value.trim();
      var sc = $('settingSchoolName').value.trim();
      try {
        localStorage.setItem(LS_GURU, gn);
        localStorage.setItem(LS_SCHOOL, sc);
      } catch (e) {}
      initHeader();
      toast('Pengaturan berhasil disimpan', 'success');
    });
    $('btnExport').addEventListener('click', exportCSV);
    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('btnSeed').addEventListener('click', function () {
      state.data = [];
      seedIfEmpty();
      renderAll();
      toast('Data contoh berhasil dimuat', 'success');
    });
    $('btnClearAll').addEventListener('click', function () {
      if (confirm('Hapus SEMUA data piket? Tindakan ini tidak dapat dibatalkan.')) {
        state.data = [];
        saveData();
        renderAll();
        toast('Semua data dihapus', 'danger');
      }
    });

    // isi input pengaturan
    try {
      $('settingGuruName').value = localStorage.getItem(LS_GURU) || '';
      $('settingSchoolName').value = localStorage.getItem(LS_SCHOOL) || '';
    } catch (e) {}
  }

  // ---------- Start ----------
  function init() {
    state.data = loadData();
    seedIfEmpty();
    initTheme();
    fillKelas();
    initHeader();
    bindEvents();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
