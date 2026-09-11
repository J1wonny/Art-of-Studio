let activeChapter = null;
let sfxEnabled = true;

const AudioSFX = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },

  playBlip(freq = 750, type = 'sine', duration = 0.04, gainVal = 0.05) {
    if (!sfxEnabled) return;
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) {}
      };

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },

  playTapeClick() {
    if (!sfxEnabled) return;
    this.playBlip(320, 'triangle', 0.05, 0.07);
    setTimeout(() => this.playBlip(880, 'sine', 0.04, 0.05), 35);
  },

  playMechanicalEject() {
    if (!sfxEnabled) return;
    this.playBlip(200, 'sawtooth', 0.08, 0.08);
    setTimeout(() => this.playBlip(440, 'triangle', 0.06, 0.06), 60);
  },

  playGoldChime() {
    if (!sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playBlip(freq, 'sine', 0.2, 0.06), idx * 80);
    });
  }
};

/* ================= 2. 60 FPS TELEMETRY COUNTER ================= */
const fpsCounter = document.getElementById('fps-counter');
let lastFrameTime = performance.now();
let frameCount = 0;

function updateRealFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastFrameTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    if (fpsCounter) fpsCounter.textContent = `${fps} FPS ✦ V-SYNC`;
    frameCount = 0;
    lastFrameTime = now;
  }
  requestAnimationFrame(updateRealFPS);
}
requestAnimationFrame(updateRealFPS);

/* ================= 3. LOW-OVERHEAD AMBIENT CANVAS ================= */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let particlesActive = true;
let matrixEasterEggActive = false;
let matrixDrops = [];

function resizeCanvas() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  if (ctx) ctx.scale(dpr, dpr);

  const columns = Math.floor(window.innerWidth / 22);
  matrixDrops = Array.from({ length: columns }).fill(1);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class AmbientParticle {
  constructor() { this.reset(true); }
  reset(init = false) {
    this.x = Math.random() * window.innerWidth;
    this.y = init ? Math.random() * window.innerHeight : -10;
    this.size = Math.random() * 1.8 + 0.8;
    this.speedY = Math.random() * 0.35 + 0.15;
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.alpha = Math.random() * 0.35 + 0.12;
    this.sparkle = Math.random() * Math.PI * 2;
  }
  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.sparkle += 0.02;
    if (this.y > window.innerHeight + 10) this.reset(false);
  }
  draw() {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = this.alpha * (0.6 + 0.4 * Math.sin(this.sparkle));
    const isGold = document.body.classList.contains('gold-overclock');
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isGold ? '#ffd700' : (isLight ? '#886d52' : '#ffffff');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

for (let i = 0; i < 24; i++) particles.push(new AmbientParticle());

function animateAtmosphere() {
  if (particlesActive && ctx && canvas) {
    if (matrixEasterEggActive) {
      ctx.fillStyle = 'rgba(7, 8, 11, 0.18)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      const isGold = document.body.classList.contains('gold-overclock');
      ctx.fillStyle = isGold ? '#ffd700' : '#2eed9e';
      ctx.font = '14px "VT323", monospace';

      const chars = '01DRAKEヲアイウエオカキサシスセソタチツテ';
      for (let i = 0; i < matrixDrops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 22, matrixDrops[i] * 20);
        if (matrixDrops[i] * 20 > window.innerHeight && Math.random() > 0.98) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
    }
  }
  requestAnimationFrame(animateAtmosphere);
}
requestAnimationFrame(animateAtmosphere);

/* ================= 4. LAG-FREE ADAPTIVE HARDWARE CURSOR ================= */
const retroCursor = document.getElementById('retro-cursor');
let mouseX = -100;
let mouseY = -100;
let cursorX = -100;
let cursorY = -100;
let isCursorMoving = false;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!isCursorMoving) {
    isCursorMoving = true;
    requestAnimationFrame(animateCursor);
  }
}, { passive: true });

function animateCursor() {
  const dx = mouseX - cursorX;
  const dy = mouseY - cursorY;
  cursorX += dx * 0.45;
  cursorY += dy * 0.45;

  if (retroCursor) {
    retroCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
  }

  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
    requestAnimationFrame(animateCursor);
  } else {
    isCursorMoving = false;
  }
}

document.addEventListener('mouseover', (e) => {
  if (!retroCursor) return;
  const isInteractive = e.target.closest('button, a, input, textarea, .slender-card, [role="button"], .archive-vault-row, .elsewhere-track-row');
  retroCursor.classList.toggle('hovered', !!isInteractive);
});

document.addEventListener('mousedown', () => {
  if (retroCursor) retroCursor.classList.add('clicked');
});
document.addEventListener('mouseup', () => {
  if (retroCursor) retroCursor.classList.remove('clicked');
});

/* ================= 5. HARDWARE-ACCELERATED 3D TILT ================= */
function apply3DTilt(element, maxAngle = 10) {
  if (!element) return;
  let ticking = false;

  element.addEventListener('mousemove', (e) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = -((y - centerY) / centerY) * maxAngle;
        const rotateY = ((x - centerX) / centerX) * maxAngle;

        element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) translateY(-6px)`;
        element.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
        element.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
        ticking = false;
      });
      ticking = true;
    }
  });

  element.addEventListener('mouseleave', () => {
    element.style.transform = '';
  });
}
document.querySelectorAll('.slender-card').forEach(card => apply3DTilt(card, 10));

/* ================= 6. RETRO WALKMAN MZ-99 CORE ================= */
const musicMenuBtn = document.getElementById('music-menu-btn');
const retroPlayer = document.getElementById('retro-player');
const closePlayerBtn = document.getElementById('close-player-btn');
const audioCore = document.getElementById('local-audio-core');
const hwPlayBtn = document.getElementById('hw-play');
const hwPrevBtn = document.getElementById('hw-prev');
const hwNextBtn = document.getElementById('hw-next');
const hwMuteBtn = document.getElementById('hw-mute');
const hwEjectBtn = document.getElementById('hw-eject');
const seekSlider = document.getElementById('player-seek-slider');
const volSlider = document.getElementById('player-vol-slider');
const screenTrackName = document.getElementById('player-track-name');
const screenTrackIndex = document.getElementById('screen-track-index');
const screenCurrentTime = document.getElementById('player-current-time');
const screenDuration = document.getElementById('player-duration');
const musicIndicator = document.getElementById('music-playing-indicator');
const playlistList = document.getElementById('playlist-list');
const mdSpinningDisc = document.getElementById('md-spinning-disc');
const mdLaserIndicator = document.getElementById('md-laser-indicator');
const mdSlotBay = document.getElementById('md-slot-bay');

const PLAYLIST = [
  {
    name: "Joyride.mp3",
    title: "Joyride // SIDE A",
    file: "assets/Joyride.mp3",
    candidates: ["assets/Joyride.mp3", "assets/joyride.mp3", "Joyride.mp3"],
    time: "02:37",
    bpm: "124 BPM",
    genre: "INDIE POP"
  },
  {
    name: "OMG.mp3",
    title: "OMG // SIDE B",
    file: "assets/OMG.mp3",
    candidates: ["assets/OMG.mp3", "assets/omg.mp3", "OMG.mp3"],
    time: "03:32",
    bpm: "126 BPM",
    genre: "R&B TAPE"
  }
];

let currentTrack = 0;
let candidatePointer = 0;
let isSyntheticPlayback = false;

function buildPlaylistUI() {
  if (!playlistList) return;
  playlistList.innerHTML = PLAYLIST.map((trk, i) => `
    <li class="playlist-item ${i === currentTrack ? 'active' : ''}" data-index="${i}">
      <span class="p-index">${String(i + 1).padStart(2, '0')}</span>
      <span class="p-name">${trk.name}</span>
      <span class="p-time">${trk.time}</span>
    </li>
  `).join('');
}
buildPlaylistUI();

let synthInterval = null;
let virtualTrackTimer = 0;

function startVirtualSynth(trackIdx) {
  stopVirtualSynth();
  isSyntheticPlayback = true;
  virtualTrackTimer = 0;

  AudioSFX.init();
  const actx = AudioSFX.ctx;
  if (!actx) return;
  if (actx.state === 'suspended') actx.resume();

  const scales = [
    [261.63, 329.63, 392.00, 523.25, 659.25],
    [220.00, 261.63, 293.66, 329.63, 392.00],
    [349.23, 392.00, 440.00, 523.25, 587.33],
    [196.00, 246.94, 293.66, 369.99, 440.00]
  ];
  const scale = scales[trackIdx % scales.length];
  let step = 0;

  synthInterval = setInterval(() => {
    if (!isSyntheticPlayback || !actx) return;
    virtualTrackTimer += 0.25;

    const curM = String(Math.floor(virtualTrackTimer / 60)).padStart(2, '0');
    const curS = String(Math.floor(virtualTrackTimer % 60)).padStart(2, '0');
    if (screenCurrentTime) screenCurrentTime.textContent = `${curM}:${curS}`;
    if (screenDuration) screenDuration.textContent = PLAYLIST[trackIdx].time;

    try {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = (step % 4 === 0) ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(scale[step % scale.length], actx.currentTime);
      gain.gain.setValueAtTime(0.045, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.26);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      };

      osc.start();
      osc.stop(actx.currentTime + 0.28);
    } catch (e) {}
    step++;
  }, 250);

  updateDiscState(true);
  hwPlayBtn.textContent = '❚❚';
  if (musicIndicator) musicIndicator.classList.add('active');
  startSpectrumVisualizer();
  showToast(`✦ SYNTH FM CHIP: ${PLAYLIST[trackIdx].name}`);
}

function stopVirtualSynth() {
  isSyntheticPlayback = false;
  if (synthInterval) clearInterval(synthInterval);
}

const eqCanvas = document.getElementById('walkman-eq-canvas');
const eqCtx = eqCanvas ? eqCanvas.getContext('2d') : null;
let eqAnimId = null;

function renderSpectrumCanvas() {
  if (!eqCtx || !eqCanvas) return;
  eqCtx.clearRect(0, 0, 60, 14);

  const isPlaying = (!audioCore.paused && !audioCore.ended) || isSyntheticPlayback;
  if (isPlaying) {
    for (let i = 0; i < 7; i++) {
      const dynamicH = Math.max(3, 4 + Math.sin(Date.now() * 0.012 + i * 1.5) * 8 + (Math.random() * 3));
      eqCtx.fillStyle = '#2eed9e';
      eqCtx.fillRect(i * 8 + 2, 14 - dynamicH, 5, dynamicH);
    }
    eqAnimId = requestAnimationFrame(renderSpectrumCanvas);
  } else {
    for (let i = 0; i < 7; i++) {
      eqCtx.fillStyle = 'rgba(46, 237, 158, 0.35)';
      eqCtx.fillRect(i * 8 + 2, 11, 5, 3);
    }
    eqAnimId = null;
  }
}

function startSpectrumVisualizer() {
  if (!eqAnimId) renderSpectrumCanvas();
}

function updateDiscState(isPlaying) {
  if (mdSpinningDisc) mdSpinningDisc.classList.toggle('spinning', isPlaying);
  if (mdLaserIndicator) {
    mdLaserIndicator.textContent = isPlaying ? "● LASER READ" : "● STANDBY";
    mdLaserIndicator.classList.toggle('active', isPlaying);
  }
  document.querySelectorAll('.tape-reel').forEach(reel => reel.classList.toggle('spinning', isPlaying));
}

function loadTrack(index, candidateIdx = 0) {
  currentTrack = index;
  candidatePointer = candidateIdx;
  const track = PLAYLIST[index];
  
  const targetPath = track.candidates[candidatePointer] || track.file;
  audioCore.src = targetPath;
  audioCore.load();

  if (screenTrackName) screenTrackName.textContent = track.name;
  if (screenTrackIndex) screenTrackIndex.textContent = `TRK ${String(index + 1).padStart(2, '0')}`;
  if (screenDuration) screenDuration.textContent = track.time;

  document.querySelectorAll('.playlist-item').forEach((item, idx) => {
    item.classList.toggle('active', idx === index);
  });
  document.querySelectorAll('.elsewhere-track-row').forEach((row, idx) => {
    row.classList.toggle('active', idx === index);
  });
}

loadTrack(0);

if (volSlider) {
  audioCore.volume = parseFloat(volSlider.value);
  volSlider.addEventListener('input', () => {
    audioCore.volume = parseFloat(volSlider.value);
  });
}

audioCore.addEventListener('error', () => {
  const track = PLAYLIST[currentTrack];
  if (candidatePointer < track.candidates.length - 1) {
    candidatePointer++;
    audioCore.src = track.candidates[candidatePointer];
    audioCore.load();
    if (!audioCore.paused) {
      audioCore.play().catch(() => startVirtualSynth(currentTrack));
    }
  } else {
    showToast(`✦ '${track.name}' NOT FOUND IN assets/ — ENGAGING SYNTH`);
    startVirtualSynth(currentTrack);
  }
});

audioCore.addEventListener('ended', () => {
  currentTrack = (currentTrack + 1) % PLAYLIST.length;
  loadTrack(currentTrack);
  audioCore.play().then(() => {
    hwPlayBtn.textContent = '❚❚';
    if (musicIndicator) musicIndicator.classList.add('active');
    updateDiscState(true);
    startSpectrumVisualizer();
  }).catch(() => startVirtualSynth(currentTrack));
});

audioCore.addEventListener('timeupdate', () => {
  if (audioCore.duration && !isSyntheticPlayback) {
    seekSlider.value = (audioCore.currentTime / audioCore.duration) * 100;
    const curM = String(Math.floor(audioCore.currentTime / 60)).padStart(2, '0');
    const curS = String(Math.floor(audioCore.currentTime % 60)).padStart(2, '0');
    const durM = String(Math.floor(audioCore.duration / 60)).padStart(2, '0');
    const durS = String(Math.floor(audioCore.duration % 60)).padStart(2, '0');
    if (screenCurrentTime) screenCurrentTime.textContent = `${curM}:${curS}`;
    if (screenDuration) screenDuration.textContent = `${durM}:${durS}`;
  }
});

if (seekSlider) {
  seekSlider.addEventListener('input', () => {
    if (audioCore.duration && !isSyntheticPlayback) {
      audioCore.currentTime = (seekSlider.value / 100) * audioCore.duration;
    }
  });
}

function togglePlay() {
  AudioSFX.playTapeClick();

  if (isSyntheticPlayback) {
    stopVirtualSynth();
    hwPlayBtn.textContent = '▶';
    if (musicIndicator) musicIndicator.classList.remove('active');
    updateDiscState(false);
    renderSpectrumCanvas();
    return;
  }

  if (audioCore.paused) {
    if (volSlider) audioCore.volume = parseFloat(volSlider.value);
    audioCore.muted = false;

    const playPromise = audioCore.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        hwPlayBtn.textContent = '❚❚';
        if (musicIndicator) musicIndicator.classList.add('active');
        updateDiscState(true);
        startSpectrumVisualizer();
        showToast(`✦ SPINNING: ${PLAYLIST[currentTrack].name}`);
      }).catch(() => {
        startVirtualSynth(currentTrack);
      });
    }
  } else {
    audioCore.pause();
    hwPlayBtn.textContent = '▶';
    if (musicIndicator) musicIndicator.classList.remove('active');
    updateDiscState(false);
    renderSpectrumCanvas();
  }
}
if (hwPlayBtn) hwPlayBtn.addEventListener('click', togglePlay);

if (hwPrevBtn) {
  hwPrevBtn.addEventListener('click', () => {
    AudioSFX.playBlip(680, 'sine', 0.04);
    currentTrack = (currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length;
    stopVirtualSynth();
    loadTrack(currentTrack);
    audioCore.play().then(() => {
      hwPlayBtn.textContent = '❚❚';
      if (musicIndicator) musicIndicator.classList.add('active');
      updateDiscState(true);
      startSpectrumVisualizer();
    }).catch(() => startVirtualSynth(currentTrack));
  });
}

if (hwNextBtn) {
  hwNextBtn.addEventListener('click', () => {
    AudioSFX.playBlip(780, 'sine', 0.04);
    currentTrack = (currentTrack + 1) % PLAYLIST.length;
    stopVirtualSynth();
    loadTrack(currentTrack);
    audioCore.play().then(() => {
      hwPlayBtn.textContent = '❚❚';
      if (musicIndicator) musicIndicator.classList.add('active');
      updateDiscState(true);
      startSpectrumVisualizer();
    }).catch(() => startVirtualSynth(currentTrack));
  });
}

if (hwMuteBtn) {
  hwMuteBtn.addEventListener('click', () => {
    AudioSFX.playBlip(600, 'sine', 0.03);
    audioCore.muted = !audioCore.muted;
    hwMuteBtn.textContent = audioCore.muted ? '🔇' : '🔈';
  });
}

if (hwEjectBtn) {
  hwEjectBtn.addEventListener('click', () => {
    AudioSFX.playMechanicalEject();
    if (mdSlotBay) {
      mdSlotBay.classList.toggle('ejected');
      const isEjected = mdSlotBay.classList.contains('ejected');
      showToast(isEjected ? '✦ MINIDISC TRAY EJECTED' : '✦ MINIDISC MOUNTED // READY');
      if (isEjected && (!audioCore.paused || isSyntheticPlayback)) togglePlay();
    }
  });
}

if (playlistList) {
  playlistList.addEventListener('click', (e) => {
    const item = e.target.closest('.playlist-item');
    if (!item) return;
    const index = parseInt(item.getAttribute('data-index'), 10);
    AudioSFX.playTapeClick();
    stopVirtualSynth();
    loadTrack(index);
    audioCore.play().then(() => {
      hwPlayBtn.textContent = '❚❚';
      if (musicIndicator) musicIndicator.classList.add('active');
      updateDiscState(true);
      startSpectrumVisualizer();
    }).catch(() => startVirtualSynth(index));
  });
}

if (musicMenuBtn) {
  musicMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    AudioSFX.playTapeClick();
    retroPlayer.classList.toggle('open');
  });
}

if (closePlayerBtn) {
  closePlayerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    AudioSFX.playBlip(500, 'sine', 0.03);
    retroPlayer.classList.remove('open');
  });
}

/* ================= 7. PROJECTS DATABASE ================= */
const PROJECTS_DATABASE = [
  {
    id: "proj-1",
    name: "CYBERDEBUG 2077",
    tag: "WEB",
    thumb: "assets/CYBERDEBUG.gif",
    fallback: "CYBERDEBUG.gif",
    desc: "Cyber Debug is an educational coding game where players learn HTML, CSS, and JavaScript by solving quizzes, fixing errors, and using interactive coding challenges.",
    metrics: { fps: "60 FPS", size: "38 KB", perf: "< 1.2ms QUERY" },
    tech: ["UI", "JS", "HTML", "CSS"],
    liveUrl: "https://cyberdebug2077.netlify.app/",
    challenge: "Creating engaging interactive challenges while managing DOM updates efficiently.",
    architecture: "Lightweight vanilla JavaScript state machine with dynamic feedback loops."
  },
  {
    id: "proj-2",
    name: "The Liminal Space",
    tag: "EXHIBITS",
    thumb: "assets/DREAMCORE.gif",
    fallback: "DREAMCORE.gif",
    desc: "A dreamcore-inspired digital space exploring liminal memories, surreal environments, and nostalgic distortion.",
    metrics: { fps: "60 FPS", size: "38 KB", perf: "< 1.2ms QUERY" },
    tech: ["UI", "JS", "HTML", "CSS"],
    liveUrl: "https://theliminalspace.vercel.app/",
    challenge: "Balancing aesthetic filters and scanlines with smooth scrolling performance.",
    architecture: "CSS 3D perspective layers combined with hardware-accelerated ambient animations."
  }
];

const CODEX_DATA = {
  about: {
    num: "TRACK 01",
    title: "About Me",
    category: "Identity & Profile",
    accent: "#ff477e",
    coverImg: "assets/ABOUT ME - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
    avatarImg: "assets/profile-avatar.png",
    fallbackAvatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80",
    render() {
      return `
      <div class="profile-full-wrapper">
        <div class="fb-discord-cover">
          <img class="fb-discord-cover-img" src="${this.coverImg}" alt="About Cover" onerror="this.src='${this.fallbackCover}'" />
          <div class="fb-discord-cover-scrim"></div>

          <div class="cover-top-controls">
            <span class="cover-tag-callout">ART OF DRAKE ✦</span>
            <span class="cover-tag-callout">MANILA / TOKYO DIRECT</span>
          </div>

          <div class="cover-bottom-caption">
            <span class="cover-kicker">analog visualist & student developer</span>
            <h2 class="cover-main-title">Web Developer</h2>
          </div>
        </div>

        <div class="profile-bar-shelf">
          <div class="profile-avatar-container">
            <img class="profile-avatar-img" src="${this.avatarImg}" alt="Profile Picture" onerror="this.src='${this.fallbackAvatar}'" />
            <div class="profile-online-dot" title="Status: Online & Ready"></div>
          </div>

          <div class="profile-text-content">
            <div class="profile-primary-row">
              <div>
                <h1 class="profile-username">DRAKE <span class="profile-verified-star">✦</span></h1>
                <span class="profile-user-handle">@artofdrake // UID: 0042-99</span>
              </div>
              <div class="profile-action-btns">
                <a href="assets/resume.pdf" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn" style="background:#ff477e;">
                  📄 View Resume [PDF]
                </a>
                <button class="sunakku-cta-btn" onclick="copyToClipboard('artof.lab.studio@gmail.com')">✉ Say Hello</button>
                <button class="profile-sub-btn" onclick="copyToClipboard('artof.lab.studio@gmail.com')">Copy Email</button>
              </div>
            </div>

            <div class="profile-badge-rack">
              <span class="profile-role-chip">BSIT Student</span>
              <span class="profile-role-chip">Front-End Builder</span>
              <span class="profile-role-chip">Analog Aesthetics Enthusiast</span>
              <span class="profile-status-chip">● AVAILABLE FOR PROJECTS</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sunakku-grid">
        <div class="sunakku-left-col">
          <div class="sunakku-card">
            <h3 class="sunakku-heading">WHO I AM</h3>
            <p class="sunakku-copy">
              Hey, I’m Drake. I’m a 2nd year BSIT student from the Philippines who enjoys making websites, experimenting with designs, and turning random ideas into actual projects.
            </p>
            <p class="sunakku-copy">
              I started learning web development from scratch, and I’m still figuring things out as I go. I’ve worked with HTML, CSS, JavaScript, and a few other things — with a lot of trial, error, and probably way too many tabs open.
            </p>
            <p class="sunakku-copy">
              Outside of coding, I’m into games, digital design, creative stuff, and basically anything that gives me an excuse to build something. I’m still a student, still learning, and still improving.
            </p>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:4px;">
              <a href="assets/resume.pdf" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn">
                📄 curriculum vitae [pdf]
              </a>
              <button class="sunakku-cta-btn" style="background:transparent; border:1px solid var(--current-accent); color:var(--current-accent);" onclick="copyToClipboard('hello@drakeportfolio.dev')">
                say hello ✉
              </button>
            </div>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">STATUS & VITALS</h3>
            <div class="sunakku-copy" style="font-family:'Space Mono', monospace; font-size:0.75rem; display:flex; flex-direction:column; gap:8px;">
              <div>CURRENT STATUS: <strong style="color:var(--current-accent);">STILL LEARNING / OPEN TO OPPORTUNITIES</strong></div>
              <div>EXPERIENCE: <strong>2+ YEARS OF LEARNING & BUILDING</strong></div>
              <div>FOCUS: <strong>WEB DESIGN / CREATIVE UI / FRONT-END</strong></div>
              <div>LOCATION: <strong>PHILIPPINES / REMOTE</strong></div>
              <div>CURRENT LEVEL: <strong>BSIT — YEAR 2</strong></div>
              <div>CURRENT MISSION: <strong>BUILD. LEARN. IMPROVE. REPEAT.</strong></div>
            </div>
          </div>
        </div>

        <div class="sunakku-right-col">
          <div class="sunakku-card">
            <h3 class="sunakku-heading">CHRONICLE & MILESTONES</h3>
            <div style="display:flex; flex-direction:column; gap:14px; margin-top:6px;">
              <div style="border-left: 2px solid var(--current-accent); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--current-accent);">2026 — PRESENT</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">BSIT STUDENT & WEB DEVELOPER IN PROGRESS</h4>
                <p class="sunakku-copy">Currently in my 2nd year of BSIT, learning more about programming, databases, and web development while building projects along the way.</p>
              </div>

              <div style="border-left: 2px solid var(--glass-border); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">2025 — NEW SAVE FILE</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">BSIT STUDENT</h4>
                <p class="sunakku-copy">Started my BSIT journey and began exploring more than just websites — including programming, databases, and core IT topics.</p>
              </div>

              <div style="border-left: 2px solid var(--glass-border); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">2024 — LEVELING UP</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">LEARNING & EXPERIMENTING</h4>
                <p class="sunakku-copy">Started building more websites and messing around with different designs, layouts, and ideas. A lot of trial and error happened here.</p>
              </div>

              <div style="border-left: 2px solid var(--glass-border); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">2023 — THE START</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">ICT STUDENT</h4>
                <p class="sunakku-copy">Started learning computers, HTML, CSS, and the basics of web development. Eventually, things started making a lot more sense.</p>
              </div>
            </div>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">STUDIO RIG</h3>
            <p class="sunakku-copy">
              Dual monitors setup, mechanical keyboard, VS Code daily driver, and lofi playlist in the background.
            </p>
          </div>
        </div>
      </div>
      `;
    },
    prev: "elsewhere",
    next: "projects"
  },

  projects: {
    num: "TRACK 02",
    title: "Projects",
    category: "Missions & Builds",
    accent: "#ff9248",
    coverImg: "assets/PROJECTS - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Projects Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs" id="project-filter-bar">
            <button class="cover-tab-btn active" onclick="filterProjects('ALL', this)">ALL</button>
            <button class="cover-tab-btn" onclick="filterProjects('WEB', this)">WEB</button>
            <button class="cover-tab-btn" onclick="filterProjects('EXHIBITS', this)">EXHIBITS</button>
          </div>
          <div class="cover-tag-callout">
            <span id="proj-count-label">PROJECT BUILDS</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">student builds & web prototypes</span>
          <h2 class="cover-main-title">PROJECT SHOWCASE</h2>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span style="font-family:'Space Mono',monospace; font-size:0.75rem; color:var(--current-accent); font-weight:700;">
          ✦ PROJECT SHOWCASE // CLICK A CARD FOR DETAILS
        </span>
        <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">
          SWIPE OR USE BUTTONS TO NAVIGATE →
        </span>
      </div>

      <div class="carousel-outer-shell">
        <button class="carousel-nav-btn prev-btn" onclick="scrollProjectCarousel('left')" aria-label="Scroll Projects Left">◀</button>
        <button class="carousel-nav-btn next-btn" onclick="scrollProjectCarousel('right')" aria-label="Scroll Projects Right">▶</button>

        <div class="projects-horizontal-track" id="projects-track">
          ${renderProjectCards(PROJECTS_DATABASE)}
        </div>
      </div>
      `;
    },
    prev: "about",
    next: "skills"
  },

  skills: {
    num: "TRACK 03",
    title: "Skills",
    category: "Capabilities Cockpit",
    accent: "#2eed9e",
    coverImg: "assets/SKILLS - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Skills Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs" id="skill-filter-bar">
            <button class="cover-tab-btn active" onclick="filterSkills('ALL', this)">ALL SKILLS</button>
            <button class="cover-tab-btn" onclick="filterSkills('FRONTEND', this)">FRONT-END</button>
            <button class="cover-tab-btn" onclick="filterSkills('UI', this)">CREATIVE UI</button>
            <button class="cover-tab-btn" onclick="filterSkills('PROG', this)">PROGRAMMING & DB</button>
            <button class="cover-tab-btn" onclick="filterSkills('TOOLS', this)">WORKFLOW</button>
          </div>
          <div class="cover-tag-callout">
            <span>BSIT YR-2 TELEMETRY ACTIVE</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">current tech stack & learning progression</span>
          <h2 class="cover-main-title">CAPABILITIES COCKPIT</h2>
        </div>
      </div>

      <div class="skills-telemetry-ribbon">
        <div class="telemetry-cell">
          <span class="telemetry-val">2ND YR</span>
          <span class="telemetry-lbl">BSIT UNDERGRAD LEVEL</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">68% AVG</span>
          <span class="telemetry-lbl">CORE STACK READINESS</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">VANILLA</span>
          <span class="telemetry-lbl">FOUNDATIONAL FOCUS</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">ACTIVE</span>
          <span class="telemetry-lbl">SKILL TREE LEVELING</span>
        </div>
      </div>

      <div class="skills-cockpit-layout">
        <div class="radar-telemetry-pod">
          <h3 class="radar-head-tag">6-AXIS CAPABILITY RADAR</h3>
          <div class="radar-canvas-housing">
            <canvas id="skills-radar-canvas" width="240" height="240"></canvas>
          </div>
          <div class="radar-diag-info" id="radar-diag-tooltip">
            ✦ HOVER RADAR NODES TO INSPECT PROFICIENCY
          </div>
          <button class="sunakku-cta-btn" onclick="triggerCrtTransition(() => openChapter('projects'))" style="width:100%;">
            VIEW MY PROJECTS →
          </button>
        </div>

        <div class="skills-grid-wrapper" id="skills-grid-container">
          <!-- Category 1: Front-End & Web Development -->
          <div class="skill-category-card" data-domain="FRONTEND">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🌐</span>
              <div>
                <h3 class="skill-cat-title">Front-End & Web Development</h3>
                <p class="skill-cat-desc">Building structured markup and writing clean scripts to make static pages interactive.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">HTML5 & Semantic Markup</span>
                  <span class="skill-tier-badge">TIER III // 75%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:75%;"></div></div>
                <span class="skill-note-sub">Accessible layouts, proper page structure, forms, and clean markup without tag soup.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">JavaScript (ES6+ Core)</span>
                  <span class="skill-tier-badge">TIER II // 65%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:65%;"></div></div>
                <span class="skill-note-sub">DOM manipulation, event handling, simple fetch requests, and interactive UI logic.</span>
              </div>
            </div>
          </div>

          <!-- Category 2: Creative UI & Interaction -->
          <div class="skill-category-card" data-domain="UI">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🎨</span>
              <div>
                <h3 class="skill-cat-title">Creative UI & Interaction</h3>
                <p class="skill-cat-desc">Designing interfaces that look clean, feel responsive, and carry a distinct retro/digital personality.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">UI / Web Design</span>
                  <span class="skill-tier-badge">TIER IV // 80%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:80%;"></div></div>
                <span class="skill-note-sub">Wireframing, visual hierarchy, retro-tech aesthetics, and intuitive user experiences.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">CSS3 & Responsive Styling</span>
                  <span class="skill-tier-badge">TIER III // 78%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:78%;"></div></div>
                <span class="skill-note-sub">Flexbox, CSS Grid, media queries for mobile, clean transitions, and custom dark/light themes.</span>
              </div>
            </div>
          </div>

          <!-- Category 3: Programming & Databases -->
          <div class="skill-category-card" data-domain="PROG">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">💾</span>
              <div>
                <h3 class="skill-cat-title">Programming & Databases</h3>
                <p class="skill-cat-desc">Foundations from college coursework covering OOP logic, simple algorithms, and structured tables.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">Java (OOP Fundamentals)</span>
                  <span class="skill-tier-badge">TIER II // 55%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:55%;"></div></div>
                <span class="skill-note-sub">Object-oriented programming, classes, control structures, and simple console/school apps.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">SQLite & Database Basics</span>
                  <span class="skill-tier-badge">TIER I // 45%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:45%;"></div></div>
                <span class="skill-note-sub">Relational schema design, primary keys, and basic CRUD queries (SELECT, INSERT, UPDATE).</span>
              </div>
            </div>
          </div>

          <!-- Category 4: Tools & Workflow -->
          <div class="skill-category-card" data-domain="TOOLS">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🛠️</span>
              <div>
                <h3 class="skill-cat-title">Tools & Workflow</h3>
                <p class="skill-cat-desc">The software and development environment I rely on every time I sit down to build.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">VS Code & DevTools</span>
                  <span class="skill-tier-badge">TIER III // 75%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:75%;"></div></div>
                <span class="skill-note-sub">My daily editor setup, browser inspect element, live-server preview, and console debugging.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">Git & GitHub</span>
                  <span class="skill-tier-badge">TIER II // 65%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:65%;"></div></div>
                <span class="skill-note-sub">Version control, managing commits, syncing repositories, and deploying live static pages.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      `;
    },
    prev: "projects",
    next: "archive"
  },

  archive: {
    num: "TRACK 04",
    title: "Archive",
    category: "Floppy ROM Excavator",
    accent: "#d2d8e4",
    coverImg: "assets/ARCHIVE - COVER.jpg",
    fallbackCover: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Archive Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs">
            <button class="cover-tab-btn active">all sectors</button>
            <button class="cover-tab-btn" onclick="showToast('✦ FLOPPY DISKETTE MOUNTED')">diskette bay</button>
          </div>
          <div class="cover-tag-callout">
            <span>DRIVE A: 1.44MB READY</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">historical builds & prototypes</span>
          <h2 class="cover-main-title">THE ARCHIVE VAULT</h2>
        </div>
      </div>

      <div class="archive-vault-table" style="margin-top: 10px;">
        <div class="archive-vault-row" onclick="openRomInspector('v4.2-CODEX', 'Art of Drake Cyber Codex v4.2 stable build featuring hardware-accelerated 3D tilt cards, CRT scanlines, and ATRAC Walkman player.')">
          <span class="arc-id">SEC-01</span>
          <div class="arc-details">
            <span class="arc-title">Art of Drake Cyber Codex v4.2</span>
            <span class="arc-desc">Production portfolio build with retro Walkman player and interactive chapters.</span>
          </div>
          <span class="arc-meta">STABLE // 15 BLOCKS</span>
          <button class="arc-btn">MOUNT</button>
        </div>
      </div>
      `;
    },
    prev: "skills",
    next: "contact"
  },

  contact: {
    num: "TRACK 05",
    title: "Comm-Link",
    category: "Direct Transmission",
    accent: "#38bdf8",
    coverImg: "assets/ABOUT ME - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1544816155-1200x800",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Contact Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs">
            <button class="cover-tab-btn active">comm-link</button>
            <button class="cover-tab-btn" onclick="copyToClipboard('hello@drakeportfolio.dev')">copy email</button>
          </div>
          <div class="cover-tag-callout">
            <span>FREQ: 144.39 MHz ACTIVE</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">direct dispatch & platforms</span>
          <h2 class="cover-main-title">CONNECT WITH ME</h2>
        </div>
      </div>

      <div class="contact-platforms-grid" style="margin-top: 10px; grid-template-columns: repeat(3, 1fr);">
        <a href="https://facebook.com/share/1GhzeRRh3H" target="_blank" rel="noopener noreferrer" class="social-card-btn">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div class="social-info">
            <span class="social-name">Facebook</span>
            <span class="social-handle">@artofdrake</span>
          </div>
        </a>

        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-card-btn">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </div>
          <div class="social-info">
            <span class="social-name">Instagram</span>
            <span class="social-handle">@artofdrake</span>
          </div>
        </a>

        <div class="social-card-btn" onclick="copyToClipboard('hello@drakeportfolio.dev')">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div class="social-info">
            <span class="social-name">Email</span>
            <span class="social-handle">drakeportfolio.dev</span>
          </div>
        </div>
      </div>

      <div class="world-clocks-rack" style="margin-top:12px;">
        <div class="clock-pod"><span class="clock-city">TOKYO (JST)</span><span class="clock-time" id="clock-tokyo">--:--:--</span></div>
        <div class="clock-pod"><span class="clock-city">MANILA (PHT)</span><span class="clock-time" id="clock-manila">--:--:--</span></div>
        <div class="clock-pod"><span class="clock-city">LONDON (GMT)</span><span class="clock-time" id="clock-london">--:--:--</span></div>
        <div class="clock-pod"><span class="clock-city">NEW YORK (EST)</span><span class="clock-time" id="clock-ny">--:--:--</span></div>
      </div>

      <div class="contact-split-view" style="margin-top:12px;">
        <div class="dispatch-form-card">
          <h3 class="sunakku-heading">TRANSMIT DISPATCH</h3>
          <input type="text" class="dispatch-input" id="disp-name" placeholder="Your Name or Call-Sign" required />
          <input type="email" class="dispatch-input" id="disp-email" placeholder="Your Frequency (Email)" required />
          <textarea class="dispatch-input dispatch-textarea" id="disp-msg" placeholder="Your transmission or message..." required></textarea>
          <button class="sunakku-cta-btn" onclick="sendDispatch()">SEND TRANSMISSION ✈</button>
        </div>

        <div class="interactive-terminal">
          <div class="terminal-history" id="terminal-history">
            <div class="terminal-line output-accent">★ ART OF DRAKE COMM TERMINAL v4.2</div>
            <div class="terminal-line">Direct interactive link online. Type 'help' for command matrix.</div>
          </div>
          <div class="terminal-input-row">
            <span class="terminal-prompt">operator@drake:~$</span>
            <input type="text" class="terminal-input" id="terminal-input" placeholder="Type: help, specs, resume, matrix, play 1..." autocomplete="off" />
          </div>
        </div>
      </div>
      `;
    },
    prev: "archive",
    next: "elsewhere"
  },

  elsewhere: {
    num: "TRACK 06",
    title: "Elsewhere",
    category: "Radio & Film Optics",
    accent: "#c084fc",
    coverImg: "assets/ELSEWHERE - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Elsewhere Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs">
            <button class="cover-tab-btn active">analog radio hub</button>
            <button class="cover-tab-btn" onclick="showToast('✦ 35MM OPTICS READY // CLICK PHOTO TO INSPECT')">35mm optics</button>
          </div>
          <div class="cover-tag-callout">
            <span>FM 88.5 MHz ON AIR</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">photography · rotation playlist</span>
          <h2 class="cover-main-title">ELSEWHERE & SOUNDS</h2>
        </div>
      </div>

      <div class="elsewhere-sound-console">
        <div class="tape-deck-station">
          <div class="tape-deck-header">
            <span class="tape-brand-title">SONY HI-FI CASSETTE DECK TC-WE475</span>
            <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:#2eed9e;">DOLBY B-C NR</span>
          </div>

          <div class="cassette-visual-deck">
            <div class="tape-reel" id="tape-reel-l"><div class="tape-reel-teeth"></div></div>
            <div class="tape-center-window"><span id="tape-counter-readout">00:00</span></div>
            <div class="tape-reel" id="tape-reel-r"><div class="tape-reel-teeth"></div></div>
          </div>

          <div class="tape-station-controls">
            <button class="tape-control-btn active" onclick="togglePlay()">▶ PLAY / PAUSE</button>
            <button class="tape-control-btn" onclick="openWalkmanDrawer()">OPEN WALKMAN ↗</button>
          </div>

          <div class="elsewhere-track-list">
            ${PLAYLIST.slice(0, 4).map((trk, i) => `
              <div class="elsewhere-track-row ${i === currentTrack ? 'active' : ''}" onclick="selectTrackFromConsole(${i})">
                <span class="ew-trk-num">0${i+1}</span>
                <div class="ew-trk-info">
                  <span class="ew-trk-name">${trk.name}</span>
                  <span class="ew-trk-meta">${trk.bpm} · ${trk.genre}</span>
                </div>
                <span class="ew-trk-time">${trk.time}</span>
                <span class="ew-trk-play-icon">▶</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sunakku-right-col">
          <div class="analog-optics-grid">
            <div class="analog-photo-card" onclick="openPhotoLightbox('assets/image5.png', 'Olympus Mju-II 35mm', 'Olympus Mju-II (35mm f/2.8)', 'Kodak Portra 400', 'Shinjuku Neon District')">
              <img class="analog-photo-img" src="assets/image5.png" alt="Olympus" onerror="this.src='https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80'" />
              <div class="analog-photo-meta">
                <span class="analog-photo-title">Olympus Mju-II 35mm ↗</span>
                <span class="analog-photo-tag">KODAK PORTRA 400 // SHINJUKU STREETS</span>
              </div>
            </div>

            <div class="analog-photo-card" onclick="openPhotoLightbox('assets/image6.png', 'Sony DCR-VX1000 MiniDV', 'Sony DCR-VX1000 3CCD', 'MiniDV Tape (DVCAM)', 'Akihabara Station South')">
              <img class="analog-photo-img" src="assets/image6.png" alt="Sony Camcorder" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'" />
              <div class="analog-photo-meta">
                <span class="analog-photo-title">Sony DCR-VX1000 MiniDV ↗</span>
                <span class="analog-photo-tag">CENTURY MK1 FISHEYE // 3CCD OPTICS</span>
              </div>
            </div>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">COOL GADGETS & GEAR</h3>
            <p class="sunakku-copy">
              Sony MZ-99 MiniDisc Walkman, Game Boy Color Atomic Purple, Casio vintage watch, and retro audio gear.
            </p>
          </div>
        </div>
      </div>
      `;
    },
    prev: "contact",
    next: "about"
  }
};

window.selectTrackFromConsole = function(index) {
  AudioSFX.playTapeClick();
  stopVirtualSynth();
  loadTrack(index);
  audioCore.play().then(() => {
    hwPlayBtn.textContent = '❚❚';
    if (musicIndicator) musicIndicator.classList.add('active');
    updateDiscState(true);
    startSpectrumVisualizer();
  }).catch(() => startVirtualSynth(index));
};

window.openWalkmanDrawer = function() {
  if (retroPlayer) retroPlayer.classList.add('open');
  AudioSFX.playTapeClick();
};

/* ================= 9. PROJECT RENDERING & FILTERS ================= */
function renderProjectCards(list) {
  return list.map((proj) => {
    const origIdx = PROJECTS_DATABASE.findIndex(p => p.id === proj.id);
    return `
      <article class="project-h-card" onclick="openProjectModal(${origIdx})">
        <div class="project-h-thumb-wrap">
          <img class="project-h-thumb" src="${proj.thumb}" alt="${proj.name}" onerror="this.src='${proj.fallback}'" />
          <span class="project-h-badge">${proj.tag}</span>
        </div>
        <div class="project-h-info">
          <div>
            <h3 class="project-h-title">${proj.name}</h3>
            <p class="project-h-desc">${proj.desc}</p>
          </div>
          <button class="project-h-action-btn">VIEW DETAILS ↗</button>
        </div>
      </article>
    `;
  }).join('');
}

window.filterProjects = function(category, btnElement) {
  AudioSFX.playBlip(680, 'sine', 0.03);
  const container = document.getElementById('projects-track');
  const countLabel = document.getElementById('proj-count-label');
  const bar = document.getElementById('project-filter-bar');

  if (bar) {
    bar.querySelectorAll('.cover-tab-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
  }

  const filtered = category === 'ALL'
    ? PROJECTS_DATABASE
    : PROJECTS_DATABASE.filter(p => p.tag === category);

  if (container) {
    container.innerHTML = renderProjectCards(filtered);
    container.scrollTo({ left: 0, behavior: 'smooth' });
  }

  if (countLabel) {
    countLabel.textContent = `${filtered.length} BUILDS FOUND`;
  }
};

window.filterSkills = function(domain, btnElement) {
  AudioSFX.playBlip(750, 'sine', 0.03);
  const bar = document.getElementById('skill-filter-bar');
  if (bar) {
    bar.querySelectorAll('.cover-tab-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
  }

  const skillCards = document.querySelectorAll('.skill-category-card');
  skillCards.forEach(c => {
    c.style.display = (domain === 'ALL' || c.getAttribute('data-domain') === domain) ? 'flex' : 'none';
  });
};

/* ================= 10. DOM REFERENCES & MODALS ================= */
const rack = document.getElementById('slender-rack');
const cards = document.querySelectorAll('.slender-card');
const menuView = document.getElementById('menu-view');
const readerView = document.getElementById('reader-view');
const closeBtn = document.getElementById('close-reader');
const prevBtn = document.getElementById('btn-prev-chap');
const nextBtn = document.getElementById('btn-next-chap');
const toast = document.getElementById('toast-alert');
const toastMsg = document.getElementById('toast-message');
const crtShutter = document.getElementById('crt-shutter');
const themeBtn = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');
const fxBtn = document.getElementById('fx-toggle');
const fxLabel = document.getElementById('fx-label');
const modeBtn = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');
const sfxBtn = document.getElementById('sfx-toggle');
const sfxLabel = document.getElementById('sfx-label');
const recTimer = document.getElementById('live-rec-timer');
const readerBadge = document.getElementById('reader-badge');
const readerStatusTag = document.getElementById('reader-status-tag');
const readerContentBody = document.getElementById('reader-content-body');
const readerDiscIcon = document.getElementById('dossier-disc-icon');
const backdropImgTarget = document.getElementById('backdrop-img-target');

const retroModal = document.getElementById('retro-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function openRetroModal() {
  if (!retroModal) return;
  retroModal.classList.add('active');
  retroModal.setAttribute('aria-hidden', 'false');
}

function closeRetroModal() {
  if (!retroModal) return;
  AudioSFX.playBlip(500, 'sine', 0.03);
  retroModal.classList.remove('active');
  retroModal.setAttribute('aria-hidden', 'true');
}

if (modalClose) {
  modalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeRetroModal();
  });
}

if (retroModal) {
  retroModal.addEventListener('click', (e) => {
    if (!e.target.closest('.modal-box')) {
      closeRetroModal();
    }
  });
}

/* ================= 11. WORLD CLOCKS & REC TIMERS ================= */
let recSeconds = 1452;
const timeFormatters = {
  tokyo: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  manila: new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  london: new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  ny: new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit' })
};

setInterval(() => {
  recSeconds++;
  const hrs = String(Math.floor(recSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((recSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(recSeconds % 60).padStart(2, '0');
  if (recTimer) recTimer.textContent = `REC ${hrs}:${mins}:${secs} [SP]`;

  if (activeChapter === 'contact') updateWorldClocks();
  if (activeChapter === 'elsewhere') {
    const tapeReadout = document.getElementById('tape-counter-readout');
    if (tapeReadout) {
      const cur = Math.floor(audioCore.currentTime || virtualTrackTimer);
      const m = String(Math.floor(cur / 60)).padStart(2, '0');
      const s = String(cur % 60).padStart(2, '0');
      tapeReadout.textContent = `${m}:${s}`;
    }
  }
}, 1000);

function updateWorldClocks() {
  const now = new Date();
  const cTokyo = document.getElementById('clock-tokyo');
  const cManila = document.getElementById('clock-manila');
  const cLondon = document.getElementById('clock-london');
  const cNY = document.getElementById('clock-ny');
  if (cTokyo) cTokyo.textContent = timeFormatters.tokyo.format(now);
  if (cManila) cManila.textContent = timeFormatters.manila.format(now);
  if (cLondon) cLondon.textContent = timeFormatters.london.format(now);
  if (cNY) cNY.textContent = timeFormatters.ny.format(now);
}

/* ================= 12. HUD & THEME SWITCHERS ================= */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('portfolio-theme', theme);
  if (themeLabel) themeLabel.textContent = theme.toUpperCase();
}
setTheme(localStorage.getItem('portfolio-theme') || 'dark');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    AudioSFX.playBlip(720, 'sine', 0.05);
    showToast(`✦ THEME: ${nextTheme.toUpperCase()}`);
  });
}

if (modeBtn) {
  modeBtn.addEventListener('click', () => {
    document.body.classList.toggle('recruiter-mode');
    const isRecruiter = document.body.classList.contains('recruiter-mode');
    if (modeLabel) modeLabel.textContent = isRecruiter ? "VIEW: RECRUITER" : "VIEW: CODEX";
    AudioSFX.playBlip(isRecruiter ? 1046 : 520, 'triangle', 0.06);
    showToast(isRecruiter ? "📄 RECRUITER DOSSIER MODE ACTIVE" : "✦ CYBER CODEX RESTORED");
  });
}

if (fxBtn) {
  fxBtn.addEventListener('click', () => {
    document.body.classList.toggle('clean-fx');
    const isClean = document.body.classList.contains('clean-fx');
    if (fxLabel) fxLabel.textContent = isClean ? "FX: CLEAN" : "FX: CRT";
    AudioSFX.playBlip(800, 'sine', 0.03);
    showToast(isClean ? "📺 SCANLINES & VIGNETTE DISABLED" : "📺 CRT EFFECTS ACTIVE");
  });
}

if (sfxBtn) {
  sfxBtn.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    if (sfxLabel) sfxLabel.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: MUTE';
    if (sfxEnabled) AudioSFX.playBlip(880, 'triangle', 0.05);
    showToast(sfxEnabled ? '✦ SFX: ENABLED' : '✦ SFX: MUTED');
  });
}

const creditsBtn = document.getElementById('credits-btn');
if (creditsBtn) {
  creditsBtn.addEventListener('click', () => {
    AudioSFX.playTapeClick();
    modalTitle.textContent = "MEDIA CREDITS & DISCLAIMER";
    modalBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <p style="font-size:0.85rem; line-height:1.6; color:var(--text-silver);">
          Just a quick note: all GIFs, photos, aesthetic edits, and visuals used across this portfolio are sourced from <strong>Pinterest</strong> and the web. They are used purely for personal student learning, UI practice, and creative non-commercial portfolio presentation.
        </p>
        
        <div style="background:rgba(0,0,0,0.35); border:1px solid var(--glass-border); padding:12px 16px; border-radius:6px;">
          <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--current-accent); font-weight:700; display:block; margin-bottom:4px;">
            ✦ RESPECT TO ORIGINAL CREATORS
          </span>
          <p style="font-size:0.78rem; line-height:1.55; color:var(--text-silver);">
            All rights, copyright, and credit belong entirely to the original artists, photographers, and creators who made them.
          </p>
        </div>

        <p style="font-size:0.8rem; line-height:1.55; color:var(--text-muted);">
          If you are the owner of any photo or GIF featured here and would like proper credit linked, or if you prefer having it removed, please reach out via the contact form or email me at <span style="color:var(--current-accent);">artof.lab.studio.@gmail.com</span> and I will gladly take care of it right away.
        </p>
      </div>
    `;
    openRetroModal();
    if (modalBody) modalBody.scrollTop = 0;
  });
}

function showToast(message) {
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    AudioSFX.playBlip(1020, 'sine', 0.08);
    showToast(`✦ COPIED: ${text}`);
  }).catch(() => showToast(`✦ ${text}`));
}

function triggerCrtTransition(callback) {
  AudioSFX.playTapeClick();
  if (!crtShutter) { callback(); return; }
  crtShutter.classList.add('shutter-active');
  setTimeout(() => {
    callback();
    setTimeout(() => { crtShutter.classList.remove('shutter-active'); }, 100);
  }, 140);
}

/* ================= 13. CHAPTER NAVIGATION ================= */
function openChapter(key) {
  const data = CODEX_DATA[key];
  if (!data) return;

  activeChapter = key;
  particlesActive = false;

  document.documentElement.style.setProperty('--current-accent', data.accent);
  document.title = `ART OF DRAKE ★ ${data.title}`;

  if (backdropImgTarget) {
    backdropImgTarget.style.backgroundImage = `url('${data.coverImg}'), url('${data.fallbackCover}')`;
  }

  if (readerBadge) readerBadge.textContent = data.num;
  if (readerStatusTag) readerStatusTag.textContent = `ART OF DRAKE // ${data.category.toUpperCase()}`;

  if (readerDiscIcon) {
    readerDiscIcon.style.transform = 'rotate(180deg)';
    setTimeout(() => { readerDiscIcon.style.transform = 'rotate(0deg)'; }, 350);
  }

  if (readerContentBody) {
    readerContentBody.innerHTML = data.render();
    readerContentBody.scrollTop = 0;
  }

  if (key === 'skills') {
    setTimeout(initRadarChart, 60);
  } else if (key === 'contact') {
    setTimeout(() => {
      initTerminal();
      updateWorldClocks();
    }, 60);
  }

  if (menuView) menuView.classList.add('dismissed');
  if (readerView) {
    readerView.classList.add('active');
    readerView.setAttribute('aria-hidden', 'false');
  }

  if (window.location.hash !== `#${key}`) {
    history.pushState(null, '', `#${key}`);
  }
}

function closeReader() {
  triggerCrtTransition(() => {
    if (readerView) {
      readerView.classList.remove('active');
      readerView.setAttribute('aria-hidden', 'true');
    }
    if (menuView) menuView.classList.remove('dismissed');
    particlesActive = true;
    document.title = "ART OF DRAKE ★ // CYBER CODEX";
    activeChapter = null;
    history.pushState(null, '', window.location.pathname);
  });
}

if (closeBtn) closeBtn.addEventListener('click', closeReader);
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (activeChapter) triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].prev));
  });
}
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (activeChapter) triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].next));
  });
}

/* ================= 14. CARD SELECTION LISTENERS ================= */
cards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    if (rack) rack.classList.add('has-hover');
    card.classList.add('is-hovered');
    AudioSFX.playBlip(540, 'triangle', 0.02);
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('is-hovered');
    const anyHovered = Array.from(cards).some(c => c.matches(':hover'));
    if (!anyHovered && rack) rack.classList.remove('has-hover');
  });

  card.addEventListener('click', () => {
    const chapterKey = card.getAttribute('data-chapter');
    triggerCrtTransition(() => openChapter(chapterKey));
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerCrtTransition(() => openChapter(card.getAttribute('data-chapter')));
    }
  });
});

/* ================= 15. CAROUSEL & MODAL ACTIONS ================= */
window.scrollProjectCarousel = function(dir) {
  const track = document.getElementById('projects-track');
  if (!track) return;
  AudioSFX.playBlip(600, 'sine', 0.03);
  const amount = dir === 'left' ? -320 : 320;
  track.scrollBy({ left: amount, behavior: 'smooth' });
};

window.openProjectModal = function(index) {
  const proj = PROJECTS_DATABASE[index];
  if (!proj) return;
  AudioSFX.playTapeClick();

  modalTitle.textContent = `PROJECT DETAILS // ${proj.name.toUpperCase()}`;
  modalBody.innerHTML = `
    <div style="width:100%; height:200px; border-radius:6px; overflow:hidden; border:1px solid var(--glass-border); background:#000;">
      <img src="${proj.thumb}" alt="${proj.name}" onerror="this.src='${proj.fallback}'" style="width:100%; height:100%; object-fit:cover;" />
    </div>

    <div class="case-metrics-grid">
      <div class="case-metric-pod">
        <span class="case-metric-val">${proj.metrics.fps}</span>
        <span class="case-metric-lbl">FRAME RATE</span>
      </div>
      <div class="case-metric-pod">
        <span class="case-metric-val">${proj.metrics.size}</span>
        <span class="case-metric-lbl">ASSET SIZE</span>
      </div>
      <div class="case-metric-pod">
        <span class="case-metric-val">${proj.metrics.perf}</span>
        <span class="case-metric-lbl">RESPONSE</span>
      </div>
    </div>

    <div>
      <h3 style="font-family:'Righteous',sans-serif; font-size:1.2rem; color:var(--text-pure); margin-bottom:4px;">${proj.name}</h3>
      <p style="font-size:0.84rem; line-height:1.6; color:var(--text-silver);">${proj.desc}</p>
    </div>

    <div>
      <div class="case-section-lbl">✦ WHAT I LEARNED:</div>
      <p style="font-size:0.8rem; line-height:1.55; color:var(--text-muted);">${proj.challenge}</p>
    </div>

    <div>
      <div class="case-section-lbl">✦ TECH & APPROACH:</div>
      <p style="font-size:0.8rem; line-height:1.55; color:var(--text-muted);">${proj.architecture}</p>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
      ${proj.tech.map(t => `<span style="background:var(--panel-glass); border:1px solid var(--glass-border); padding:3px 10px; border-radius:999px; font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--current-accent);">${t}</span>`).join('')}
    </div>

    <!-- CLEAN DEMO BUTTON (REPO BUTTON REMOVED) -->
    <div style="display:flex; gap:10px; margin-top:8px;">
      <a href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn">
        ↗ LAUNCH DEMO
      </a>
    </div>
  `;
  
  openRetroModal();
  if (modalBody) modalBody.scrollTop = 0;
};

window.openPhotoLightbox = function(src, title, camera, film, location) {
  AudioSFX.playTapeClick();
  modalTitle.textContent = `OPTICAL INSPECTOR // ${title.toUpperCase()}`;
  modalBody.innerHTML = `
    <div style="width:100%; max-height:360px; border-radius:6px; overflow:hidden; border:1px solid var(--glass-border); background:#000;">
      <img src="${src}" alt="${title}" style="width:100%; height:100%; object-fit:contain;" />
    </div>
    <div style="background:var(--panel-glass-solid); border:1px solid var(--glass-border); padding:12px 16px; border-radius:6px; font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--text-silver); display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      <div><span style="color:var(--text-muted)">DEVICE:</span> ${camera}</div>
      <div><span style="color:var(--text-muted)">MEDIA:</span> ${film}</div>
      <div><span style="color:var(--text-muted)">LOCATION:</span> ${location}</div>
      <div><span style="color:var(--text-muted)">STATUS:</span> ARCHIVED</div>
    </div>
  `;
  openRetroModal();
  if (modalBody) modalBody.scrollTop = 0;
};

window.openRomInspector = function(title, description) {
  AudioSFX.playTapeClick();
  modalTitle.textContent = `ARCHIVE INSPECTOR // ${title.toUpperCase()}`;
  modalBody.innerHTML = `
    <p style="margin-bottom:10px; font-size:0.85rem; line-height:1.6;">${description}</p>
    <div style="background:var(--panel-glass-solid); border:1px solid var(--glass-border); padding:12px; border-radius:4px; font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--current-accent); display:flex; flex-direction:column; gap:4px;">
      <span>STATUS: ARCHIVED BUILD</span>
      <span>SYSTEM: VANILLA STACK</span>
      <span>READY FOR INSPECTION</span>
    </div>
  `;
  openRetroModal();
};

/* ================= 16. SKILLS RADAR ================= */
function initRadarChart() {
  const radarCanvas = document.getElementById('skills-radar-canvas');
  const tooltip = document.getElementById('radar-diag-tooltip');
  if (!radarCanvas) return;
  const rCtx = radarCanvas.getContext('2d');
  const size = 240;
  const center = size / 2;
  const radius = 80;

  // Realistic skills telemetry based on 2nd year BSIT student level
  const skills = [
    { label: "UI / Design", value: 0.80 },
    { label: "CSS3 Styling", value: 0.78 },
    { label: "HTML5 Core", value: 0.75 },
    { label: "JavaScript", value: 0.65 },
    { label: "Java (OOP)", value: 0.55 },
    { label: "SQLite / DB", value: 0.45 }
  ];

  function drawRadar() {
    rCtx.clearRect(0, 0, size, size);

    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      rCtx.beginPath();
      for (let i = 0; i < skills.length; i++) {
        const angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        if (i === 0) rCtx.moveTo(x, y);
        else rCtx.lineTo(x, y);
      }
      rCtx.closePath();
      rCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      rCtx.stroke();
    }

    skills.forEach((_, i) => {
      const angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
      rCtx.beginPath();
      rCtx.moveTo(center, center);
      rCtx.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
      rCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      rCtx.stroke();
    });

    rCtx.beginPath();
    skills.forEach((skill, i) => {
      const angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
      const r = radius * skill.value;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      if (i === 0) rCtx.moveTo(x, y);
      else rCtx.lineTo(x, y);
    });
    rCtx.closePath();
    rCtx.fillStyle = 'rgba(46, 237, 158, 0.28)';
    rCtx.fill();
    rCtx.strokeStyle = '#2eed9e';
    rCtx.lineWidth = 2;
    rCtx.stroke();

    skills.forEach((skill, i) => {
      const angle = (Math.PI * 2 / skills.length) * i - Math.PI / 2;
      const r = radius * skill.value;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      rCtx.beginPath();
      rCtx.arc(x, y, 3.5, 0, Math.PI * 2);
      rCtx.fillStyle = '#ffffff';
      rCtx.fill();
    });
  }
  drawRadar();

  radarCanvas.onmousemove = (e) => {
    const rect = radarCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const index = Math.floor((angle / (Math.PI * 2)) * skills.length) % skills.length;
    if (tooltip) {
      tooltip.textContent = `DIAGNOSTIC: ${skills[index].label.toUpperCase()} — ${(skills[index].value * 100).toFixed(0)}% PROFICIENCY`;
    }
  };
}

/* ================= 17. CONTACT & INTERACTIVE TERMINAL ================= */
/* ================= 17. CONTACT & INTERACTIVE TERMINAL ================= */

window.sendDispatch = async function() {

  const name = document.getElementById('disp-name');
  const email = document.getElementById('disp-email');
  const msg = document.getElementById('disp-msg');

  if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {

    showToast('✦ PLEASE COMPLETE ALL FIELDS');
    AudioSFX.playBlip(400, 'sine', 0.05);

    return;
  }

  AudioSFX.playTapeClick();

  const formData = new FormData();

  formData.append('name', name.value.trim());
  formData.append('email', email.value.trim());
  formData.append('message', msg.value.trim());

  try {

    const response = await fetch('https://formspree.io/f/mvkoldrn', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {

      showToast(
        `✦ TRANSMISSION SENT! THANK YOU, ${name.value.toUpperCase()}`
      );

      name.value = '';
      email.value = '';
      msg.value = '';

      AudioSFX.playBlip(900, 'sine', 0.08);

    } else {

      showToast('✦ TRANSMISSION FAILED — TRY AGAIN');
      AudioSFX.playBlip(300, 'sine', 0.08);

    }

  } catch (error) {

    console.error('Formspree error:', error);

    showToast('✦ CONNECTION ERROR — TRY AGAIN');
    AudioSFX.playBlip(300, 'sine', 0.08);

  }

};


function initTerminal() {

  const input = document.getElementById('terminal-input');

  const history = document.getElementById('terminal-history');

  if (!input || !history) return;

  if (input.dataset.terminalBound === "true") return;

  input.dataset.terminalBound = "true";

  input.addEventListener('keydown', (e) => {

    if (e.key === 'Enter') {

      const rawCmd = input.value.trim();

      const command = rawCmd.toLowerCase();

      if (!command) return;

      AudioSFX.playBlip(750, 'triangle', 0.03);

      const userLine = document.createElement('div');

      userLine.className = 'terminal-line';

      userLine.textContent = `operator@drake:~$ ${rawCmd}`;

      history.appendChild(userLine);

      const responseLine = document.createElement('div');

      responseLine.className = 'terminal-line output-accent';


      if (command === 'help') {

        responseLine.innerHTML =
          "COMMAND MATRIX:\n • help       - Display directives\n • specs      - Terminal system info\n • resume     - Resume summary\n • email      - Direct email relay\n • matrix     - Digital rain toggle\n • konami     - 24K Gold theme override\n • eject      - Eject Walkman tray\n • play [1-6] - Play track\n • pause      - Pause playback\n • clear      - Clear terminal screen";

      }
      else if (command === 'specs' || command === 'neofetch') {

        responseLine.textContent = `

    ___   ___  ___  _  __ ___ 
   / _ \\ / _ \\/ _ || |/ // _/
  / // // // // __ ||   // _/  
 /____//_/|_//_/ |_||_|\\_\\___/  
 -----------------------------

 USER: Drake [BSIT Year 2]

 OS: Cyber Codex v4.2

 STACK: HTML5 / CSS3 / JavaScript / Java / SQLite

 FOCUS: Web Design & Front-End Development

 AUDIO: ATRAC Engine / WebAudio API`;
      }

      else if (command === 'resume' || command === 'cat resume') {
        responseLine.textContent =
          `[DRAKE // 2ND YEAR BSIT STUDENT]\n• Front-End & Web Design focus\n• HTML5, CSS3, JavaScript, Java, SQLite\n• PDF CV: Click 'RESUME.PDF' in top HUD`;

      }
      else if (command === 'email') {
        responseLine.textContent =
          "DIRECT FREQUENCY: hello@drakeportfolio.dev";
      }

      else if (command === 'matrix') {
        matrixEasterEggActive = true;
        particlesActive = true;
        responseLine.textContent =
          "✦ ENGAGING DIGITAL RAIN ON AMBIENT CANVAS (10s)...";
        setTimeout(() => {
          matrixEasterEggActive = false;
        }, 10000);
      }

      else if (
        command === 'konami' ||
        command === 'hack' ||
        command === 'secret'
      ) {
        activateGoldOverclock();
        responseLine.textContent =
          "★ OVERCLOCK VERIFIED: 24K GOLD THEME UNLOCKED!";

      }

      else if (command === 'eject') {
        if (hwEjectBtn) hwEjectBtn.click();
        responseLine.textContent =
          "✦ MINIDISC TRAY EJECTED";

      }

      else if (command.startsWith('play')) {
        const parts = command.split(' ');
        const idx = parts[1]
          ? parseInt(parts[1], 10) - 1
          : 0;

        if (
          !isNaN(idx) &&
          idx >= 0 &&
          idx < PLAYLIST.length
        ) {

          loadTrack(idx);
          stopVirtualSynth();
          audioCore.play().then(() => {
            hwPlayBtn.textContent = '❚❚';
            if (musicIndicator) {
              musicIndicator.classList.add('active');
            }

            updateDiscState(true);
            startSpectrumVisualizer();
          }).catch(() => startVirtualSynth(idx));

          responseLine.textContent =
            `✦ ENGAGING TRACK 0${idx + 1}: ${PLAYLIST[idx].name}`;
        } else {
          responseLine.textContent =
            "✦ USAGE: play [1-6]";

        }
      }

      else if (command === 'pause') {
        audioCore.pause();
        stopVirtualSynth();
        hwPlayBtn.textContent = '▶';
        if (musicIndicator) {
          musicIndicator.classList.remove('active');
        }
        updateDiscState(false);
        renderSpectrumCanvas();
        responseLine.textContent =
          "✦ WALKMAN PLAYBACK PAUSED";
      }
      else if (command === 'clear') {
        history.innerHTML = "";
        input.value = "";
        return;
      }
      else {
        responseLine.textContent =
          `COMMAND NOT RECOGNIZED: '${rawCmd}'. Type 'help' for directives.`;
      }
      history.appendChild(responseLine);
      history.scrollTop = history.scrollHeight;
      input.value = "";
    }
  });
}

/* ================= 18. KONAMI CODE & ESC CONFLICT FIX ================= */
const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIndex = 0;

function activateGoldOverclock() {
  document.body.classList.add('gold-overclock');
  AudioSFX.playGoldChime();
  matrixEasterEggActive = true;
  particlesActive = true;
  setTimeout(() => { matrixEasterEggActive = false; }, 8000);
  showToast("⚡ 24K GOLD OVERCLOCK ENGAGED!");
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (retroModal && retroModal.classList.contains('active')) {
      e.preventDefault();
      closeRetroModal();
      return;
    }
    if (readerView && readerView.classList.contains('active')) {
      closeReader();
      return;
    }
  }

  if (e.target.matches('input, textarea')) return;

  if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateGoldOverclock();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }

  if (e.key === 'm' || e.key === 'M') {
    retroPlayer.classList.toggle('open');
    AudioSFX.playTapeClick();
  }

  if (readerView && readerView.classList.contains('active')) {
    if (e.key === 'ArrowLeft') {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].prev));
    } else if (e.key === 'ArrowRight') {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].next));
    }
  }
});

/* ================= 19. MOBILE TOUCH SWIPE NAVIGATION ================= */
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const diffX = touchEndX - touchStartX;
  if (e.target.closest('.projects-horizontal-track, .contact-platforms-grid, .retro-audio-pod')) return;

  if (readerView && readerView.classList.contains('active') && Math.abs(diffX) > 65) {
    if (diffX > 0) {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].prev));
    } else {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].next));
    }
  }
}, { passive: true });

/* ================= 20. HASH ROUTING ================= */
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  if (CODEX_DATA[hash]) openChapter(hash);
});

window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '');
  if (CODEX_DATA[hash]) openChapter(hash);
  else closeReader();
});