/**
 * ART OF STUDIO ★ // COLLECTIVE CORE v4.2
 * Complete Studio Script Engine: Scalable Member Roster, Walkman Audio,
 * Interactive Chapters, Radar Telemetry, and Performance Optimizations.
 */

let activeChapter = null;
let sfxEnabled = true;

/* ================= 1. PROCEDURAL AUDIO SFX SYNTHESIZER ================= */
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

/* ================= 2. 60 FPS V-SYNC TELEMETRY ================= */
const fpsCounter = document.getElementById('fps-counter');
let lastFpsTime = performance.now();
let fpsFrameCount = 0;

function updateRealFPS() {
  const now = performance.now();
  fpsFrameCount++;
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round((fpsFrameCount * 1000) / (now - lastFpsTime));
    if (fpsCounter) fpsCounter.textContent = `${fps} FPS ✦ V-SYNC`;
    fpsFrameCount = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(updateRealFPS);
}
requestAnimationFrame(updateRealFPS);

/* ================= 3. MOBILE CANVAS OPTIMIZATIONS ================= */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let particlesActive = true;
let matrixEasterEggActive = false;
let matrixDrops = [];

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let isReducedMotion = motionQuery.matches;
motionQuery.addEventListener('change', (e) => {
  isReducedMotion = e.matches;
  reinitParticles();
});

function isMobileScreen() {
  return window.innerWidth < 768;
}

function resizeCanvas() {
  if (!canvas) return;
  const dpr = isMobileScreen() ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  if (ctx) ctx.scale(dpr, dpr);

  const columns = Math.floor(window.innerWidth / 22);
  matrixDrops = Array.from({ length: columns }).fill(1);
}
window.addEventListener('resize', () => {
  resizeCanvas();
  reinitParticles();
}, { passive: true });
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

function reinitParticles() {
  particles = [];
  if (isReducedMotion) return;
  const count = isMobileScreen() ? 6 : 22;
  for (let i = 0; i < count; i++) {
    particles.push(new AmbientParticle());
  }
}
reinitParticles();

let lastCanvasFrame = 0;
function animateAtmosphere(timestamp) {
  const targetInterval = isMobileScreen() ? 33 : 16;
  const elapsed = timestamp - lastCanvasFrame;

  if (elapsed >= targetInterval) {
    lastCanvasFrame = timestamp - (elapsed % targetInterval);

    if (particlesActive && ctx && canvas && !isReducedMotion) {
      if (matrixEasterEggActive) {
        ctx.fillStyle = 'rgba(7, 8, 11, 0.18)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        const isGold = document.body.classList.contains('gold-overclock');
        ctx.fillStyle = isGold ? '#ffd700' : '#2eed9e';
        ctx.font = '14px "VT323", monospace';

        const chars = '01STUDIOヲアイウエオカキサシスセソタチツテ';
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
  }
  requestAnimationFrame(animateAtmosphere);
}
requestAnimationFrame(animateAtmosphere);

/* ================= 4. HARDWARE CURSOR ================= */
const retroCursor = document.getElementById('retro-cursor');
let mouseX = -100, mouseY = -100, cursorX = -100, cursorY = -100;
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
  const isInteractive = e.target.closest('button, a, input, textarea, .slender-card, [role="button"], .archive-vault-row, .elsewhere-track-row, .member-operative-card');
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
  if (!element || isMobileScreen() || isReducedMotion) return;
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

/* ================= 6. AUDIO ENGINE (WALKMAN) ================= */
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

if (audioCore) {
  audioCore.autoplay = false;
  audioCore.muted = true;
  audioCore.pause();
}

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
    [220.00, 261.63, 293.66, 329.63, 392.00]
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
  if (hwPlayBtn) hwPlayBtn.textContent = '❚❚';
  if (musicIndicator) musicIndicator.classList.add('active');
  startSpectrumVisualizer();
  showToast(`✦ SYNTH CHIP: ${PLAYLIST[trackIdx].name}`);
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
    const bars = isMobileScreen() ? 5 : 7;
    for (let i = 0; i < bars; i++) {
      const dynamicH = Math.max(3, 4 + Math.sin(Date.now() * 0.012 + i * 1.5) * 8 + (Math.random() * 3));
      eqCtx.fillStyle = '#2eed9e';
      eqCtx.fillRect(i * 9 + 2, 14 - dynamicH, 6, dynamicH);
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
  if (!eqAnimId && !isReducedMotion) renderSpectrumCanvas();
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
    showToast(`✦ '${track.name}' NOT FOUND — ENGAGING SYNTH`);
    startVirtualSynth(currentTrack);
  }
});

audioCore.addEventListener('ended', () => {
  currentTrack = (currentTrack + 1) % PLAYLIST.length;
  loadTrack(currentTrack);
  executeExplicitPlay();
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

function executeExplicitPlay() {
  AudioSFX.init();
  if (AudioSFX.ctx && AudioSFX.ctx.state === 'suspended') {
    AudioSFX.ctx.resume().catch(() => {});
  }

  audioCore.muted = false;
  if (volSlider) audioCore.volume = parseFloat(volSlider.value);

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
    executeExplicitPlay();
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
    executeExplicitPlay();
  });
}

if (hwNextBtn) {
  hwNextBtn.addEventListener('click', () => {
    AudioSFX.playBlip(780, 'sine', 0.04);
    currentTrack = (currentTrack + 1) % PLAYLIST.length;
    stopVirtualSynth();
    loadTrack(currentTrack);
    executeExplicitPlay();
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
    executeExplicitPlay();
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

/* ================= 7. SCALABLE MEMBERS DATABASE (1 TO 2 MEMBERS) ================= */
/**
 * TO ADD MORE MEMBERS IN THE FUTURE:
 * Simply add another member object to this array. The grid layout automatically adapts!
 */
const MEMBERS_DATABASE = [
  {
    id: "drake",
    name: "DRAKE",
    handle: "@artofdrake",
    uid: "UID: 0042-99",
    role: "Co-Founder / Front-End Architect",
    specialty: "Creative UI & Responsive Interaction",
    status: "AVAILABLE FOR PROJECTS",
    statusColor: "#ff477e",
    level: "BSIT — Year 2",
    location: "Philippines / Remote",
    avatar: "assets/PFP3.jpg",
    fallbackAvatar: "HEADER1.jpg",
    cover: "assets/HEADER1.jpg",
    fallbackCover: "HEADER1.jpg",
    email: "artof.lab.studio@gmail.com",
    resume: "assets/resume.pdf",
    shortBio: "Front-end enthusiast focused on turning retro cyber aesthetics into fluid, modern interactive web experiences.",
    bio: [
      "Hey, I’m Drake. I’m a 2nd year BSIT student from the Philippines who enjoys making websites, experimenting with designs, and turning random ideas into actual projects.",
      "In our studio, I lead the front-end styling, typography, retro UI interactions, and visual layout. I’ve worked with HTML5, CSS3, JavaScript, and WebAudio with lots of experimentation and attention to detail.",
      "Outside of coding, I’m into gaming, analog cameras, audio gear, and finding new ways to make web apps feel tactile."
    ],
    vitals: {
      status: "BUILDING & EXPLORING",
      experience: "2+ YEARS OF WEB CRAFT",
      focus: "FRONT-END / RETRO UI / AESTHETICS",
      location: "PHILIPPINES / REMOTE",
      level: "BSIT — YEAR 2",
      mission: "CREATE MEMORABLE INTERFACES."
    },
    milestones: [
      { period: "2026 — PRESENT", title: "STUDIO CO-FOUNDER & FRONT-END", desc: "Leading the creative UI direction and component architecture for Art of Studio." },
      { period: "2025 — ADVANCEMENT", title: "BSIT CORE EXPLORATION", desc: "Studied relational databases, OOP programming with Java, and scalable web structure." },
      { period: "2024 — EXPERIMENTS", title: "UI PROTOTYPER", desc: "Crafted retro interactive widgets, CSS 3D perspective cards, and custom themes." },
      { period: "2023 — FOUNDATIONS", title: "ICT BASICS", desc: "Began coding with semantic HTML, CSS stylesheets, and core JavaScript logic." }
    ],
    rig: "Dual monitors setup, mechanical keyboard, VS Code daily driver, and lofi playlist running in background.",
    tags: ["Front-End Lead", "UI/UX Design", "BSIT Year 2", "Vanilla JS"]
  },
  {
    id: "Gab",
    name: "Gab",
    handle: "@Gab.dev",
    uid: "UID: 0043-01",
    role: "Co-Founder / Systems & Backend",
    specialty: "Logic Architecture & Data Schemas",
    status: "OPEN TO COLLABS",
    statusColor: "#38bdf8",
    level: "BSIT — Year 2",
    location: "Philippines / Remote",
    avatar: "assets/PFP2.jpg",
    fallbackAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    cover: "assets/HEADER2.jpg",
    fallbackCover: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80",
    email: "artof.lab.studio@gmail.com",
    resume: "assets/resume.pdf",
    shortBio: "Specializing in software architecture, database management, and building clean, resilient logic engines.",
    bio: [
      "Yo, I’m Gab. I’m a 2nd year BSIT student handling system logic, database modeling, and technical optimization for our studio.",
      "I make sure our projects don't just look amazing, but run smoothly with clean structure, reliable data flow, and minimal latency.",
      "When I'm off keyboard, I'm usually testing Linux distros, reading technical documentation, or tweaking PC hardware setups."
    ],
    vitals: {
      status: "OPTIMIZING SYSTEMS",
      experience: "2+ YEARS OF CODE & SYSTEMS",
      focus: "BACKEND LOGIC / DATABASES / OOP",
      location: "PHILIPPINES / REMOTE",
      level: "BSIT — YEAR 2",
      mission: "RELIABLE CODE. ZERO BOTTLENECK."
    },
    milestones: [
      { period: "2026 — PRESENT", title: "SYSTEMS CO-FOUNDER", desc: "Co-founded Art of Studio, handling technical data schemas, Git workflows, and stability." },
      { period: "2025 — DATABASES", title: "SQL & DATA MODELING", desc: "Designed normalized schemas, queries, and studied Java Object-Oriented patterns." },
      { period: "2024 — COMPUTING", title: "LOGIC BUILDER", desc: "Built algorithmic CLI tools, explored modular JS, and worked with async data handling." },
      { period: "2023 — ORIGINS", title: "ICT STUDENT", desc: "Started computer hardware fundamentals, networking basics, and early script logic." }
    ],
    rig: "Ultra-wide workstation, custom tactile switches, Arch Linux / VS Code, dark mode terminal.",
    tags: ["Systems Lead", "Databases", "BSIT Year 2", "OOP & Java"]
  }
];

// Currently selected member (null = Show Studio Collective Overview + Roster)
let selectedMemberId = null;

/* ================= 8. PROJECTS DATABASE ================= */
const PROJECTS_DATABASE = [
  {
    id: "proj-1",
    name: "CYBERDEBUG 2077",
    tag: "WEB",
    thumb: "assets/CYBERDEBUG.gif",
    fallback: "CYBERDEBUG.gif",
    desc: "Cyber Debug is an educational coding game where players learn HTML, CSS, and JavaScript by solving quizzes, fixing errors, and using interactive coding challenges.",
    missionBrief: "Provides an interactive gamified cyberdeck environment where students reinforce core HTML, CSS, and JS debugging fundamentals with instant live-editor feedback.",
    metrics: { fps: "60 FPS", size: "38 KB", perf: "< 1.2ms QUERY" },
    tech: ["UI", "JS", "HTML", "CSS"],
    liveUrl: "https://cyberdebug2077.netlify.app/",
    repoUrl: "https://github.com/artofdrake/cyberdebug2077",
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
    missionBrief: "Explores psychological ambience and nostalgic digital distortion using interactive CSS 3D depth stages, scanline filters, and ambient atmospheric audio.",
    metrics: { fps: "60 FPS", size: "38 KB", perf: "< 1.2ms QUERY" },
    tech: ["UI", "JS", "HTML", "CSS"],
    liveUrl: "https://theliminalspace.vercel.app/",
    repoUrl: "https://github.com/artofdrake/the-liminal-space",
    challenge: "Balancing aesthetic filters and scanlines with smooth scrolling performance.",
    architecture: "CSS 3D perspective layers combined with hardware-accelerated ambient animations."
  }
];

/* ================= 9. CHAPTER CONTENT ENGINE ================= */
const CODEX_DATA = {
  about: {
    num: "TRACK 01",
    title: "About Us",
    category: "Studio Collective & Roster",
    accent: "#ff477e",
    coverImg: "assets/ABOUT ME - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
    
    render() {
      // If a specific member is selected, render their individual dossier!
      if (selectedMemberId) {
        return renderMemberProfile(selectedMemberId);
      }

      // Otherwise, render the Studio Collective Hub + Member Roster
      return `
      <!-- STUDIO COLLECTIVE COVER -->
      <div class="profile-full-wrapper">
        <div class="fb-discord-cover">
          <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Studio Cover" onerror="this.src='${this.fallbackCover}'" />
          <div class="fb-discord-cover-scrim"></div>

          <div class="cover-top-controls">
            <span class="cover-tag-callout">ART OF STUDIO ✦ COLLECTIVE</span>
            <span class="cover-tag-callout">${MEMBERS_DATABASE.length} ACTIVE OPERATIVES</span>
          </div>

          <div class="cover-bottom-caption" style="margin-left:0; max-width:100%;">
            <span class="cover-kicker">creative tech & front-end studio collective</span>
            <h2 class="cover-main-title">ABOUT US // THE COLLECTIVE</h2>
          </div>
        </div>

        <div class="profile-bar-shelf" style="padding-top:20px;">
          <div class="profile-text-content">
            <div class="profile-primary-row">
              <div>
                <h1 class="profile-username">ART OF STUDIO <span class="profile-verified-star">✦</span></h1>
                <span class="profile-user-handle">@artofstudio // CO-OP CODEX</span>
              </div>
              <div class="profile-action-btns">
                <a href="assets/resume.pdf" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn" style="background:#ff477e;">
                  📄 Studio Deck [PDF]
                </a>
                <button class="profile-sub-btn" onclick="copyBufferInteraction(this, 'artof.lab.studio@gmail.com')">Copy Studio Email</button>
              </div>
            </div>

            <div class="profile-badge-rack">
              <span class="profile-role-chip">Creative Dev Group</span>
              <span class="profile-role-chip">BSIT Undergraduates</span>
              <span class="profile-role-chip">Analog & Y2K Aesthetics</span>
              <span class="profile-status-chip">● OPEN FOR NEW PROJECTS</span>
            </div>
          </div>
        </div>
      </div>

      <!-- MEMBER ROSTER SECTION (1 TO 2 MEMBERS, SCALABLE) -->
      <div class="roster-navigation-header">
        <span class="roster-header-title">✦ STUDIO OPERATIVE ROSTER // CLICK A MEMBER TO VIEW THEIR PROFILE</span>
        <span style="font-family:'Space Mono', monospace; font-size:0.65rem; color:var(--text-muted);">${MEMBERS_DATABASE.length} MEMBERS REGISTERED</span>
      </div>

      <div class="members-roster-grid">
        ${MEMBERS_DATABASE.map((member) => `
          <div class="member-operative-card" onclick="viewMemberDossier('${member.id}')" tabindex="0" role="button" aria-label="View ${member.name}'s profile">
            <div class="member-op-header">
              <div class="member-op-avatar-wrap">
                <img class="member-op-avatar-img" src="${member.avatar}" alt="${member.name}" onerror="this.src='${member.fallbackAvatar}'" />
                <div class="member-op-status-dot" style="background:${member.statusColor}; box-shadow:0 0 8px ${member.statusColor};"></div>
              </div>
              <div class="member-op-meta">
                <h3 class="member-op-callsign">${member.name} ✦</h3>
                <span class="member-op-role">${member.role}</span>
                <span class="member-op-uid">${member.uid} · ${member.location}</span>
              </div>
            </div>

            <p class="member-op-snippet">${member.shortBio}</p>

            <div class="member-op-tags-row">
              ${member.tags.map(t => `<span class="member-op-chip">${t}</span>`).join('')}
            </div>

            <div class="member-op-cta-strip">
              <span class="member-op-action-lbl">INSPECT DOSSIER ↗</span>
              <span style="font-family:'Space Mono', monospace; font-size:0.62rem; color:var(--text-muted);">${member.level}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- STUDIO BENTO OVERVIEW -->
      <div class="sunakku-grid">
        <div class="sunakku-left-col">
          <div class="sunakku-card">
            <h3 class="sunakku-heading">WHO WE ARE</h3>
            <p class="sunakku-copy">
              We are <strong>Art of Studio</strong>, a creative development collective formed by 2nd year BSIT students from the Philippines. We combine front-end experimentation, retro analog aesthetics, and clean modern web engineering.
            </p>
            <p class="sunakku-copy">
              Instead of building ordinary websites, we craft tactile digital spaces that draw inspiration from late 90s cyberdecks, Sony MiniDisc players, and nostalgic digital relics.
            </p>
            <p class="sunakku-copy">
              We learn together, prototype together, and constantly level up our craft with every build.
            </p>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">STUDIO VITALS</h3>
            <div class="sunakku-copy" style="font-family:'Space Mono', monospace; font-size:0.75rem; display:flex; flex-direction:column; gap:8px;">
              <div>TEAM STATUS: <strong style="color:var(--current-accent);">ACTIVE / OPEN FOR COLLABS</strong></div>
              <div>COLLECTIVE FOCUS: <strong>CREATIVE WEB APPS / UI-UX / FRONT-END</strong></div>
              <div>LOCATION: <strong>MANILA / REMOTE DIRECT</strong></div>
              <div>EDUCATION: <strong>BSIT UNDERGRADUATE SQUAD</strong></div>
              <div>MISSION: <strong>EXPERIMENT. DESIGN. SHIP. REPEAT.</strong></div>
            </div>
          </div>
        </div>

        <div class="sunakku-right-col">
          <div class="sunakku-card">
            <h3 class="sunakku-heading">COLLECTIVE MILESTONES</h3>
            <div style="display:flex; flex-direction:column; gap:14px; margin-top:6px;">
              <div style="border-left: 2px solid var(--current-accent); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--current-accent);">2026 — PRESENT</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">STUDIO CODEX & COLLABORATIVE LAB</h4>
                <p class="sunakku-copy">Unified our individual projects under Art of Studio to ship modular web experiments and interactive portfolios.</p>
              </div>

              <div style="border-left: 2px solid var(--glass-border); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">2025 — CO-OP FOUNDATION</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">BSIT STUDY SQUAD</h4>
                <p class="sunakku-copy">Teamed up across coursework, programming logic, system design, and database architecture.</p>
              </div>

              <div style="border-left: 2px solid var(--glass-border); padding-left: 14px;">
                <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:var(--text-muted);">2024 — EARLY BUILDS</span>
                <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">WEB PROTOTYPES</h4>
                <p class="sunakku-copy">First independent websites, CSS animations, and exploring retro-tech UI trends.</p>
              </div>
            </div>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">OUR STUDIO RIG</h3>
            <p class="sunakku-copy">
              Multi-monitor developer battlestations, mechanical keyboards, Git collaboration pipelines, and 24/7 lofi playlists.
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
    category: "Missions & Studio Builds",
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
            <span id="proj-count-label">STUDIO BUILDS</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">our collective builds & web prototypes</span>
          <h2 class="cover-main-title">STUDIO SHOWCASE</h2>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span style="font-family:'Space Mono',monospace; font-size:0.75rem; color:var(--current-accent); font-weight:700;">
          ✦ OUR BUILDS // CLICK A CARD FOR SPECS
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
            <span>COLLECTIVE TELEMETRY ACTIVE</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">our combined tech stack & capabilities</span>
          <h2 class="cover-main-title">CAPABILITIES COCKPIT</h2>
        </div>
      </div>

      <div class="skills-telemetry-ribbon">
        <div class="telemetry-cell">
          <span class="telemetry-val">${MEMBERS_DATABASE.length} DEV</span>
          <span class="telemetry-lbl">COLLECTIVE CO-FOUNDERS</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">74% AVG</span>
          <span class="telemetry-lbl">CORE STACK READINESS</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">FULL-STACK</span>
          <span class="telemetry-lbl">FRONT & BACK SYNERGY</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-val">ACTIVE</span>
          <span class="telemetry-lbl">STUDIO LEVELING UP</span>
        </div>
      </div>

      <div class="skills-cockpit-layout">
        <div class="radar-telemetry-pod">
          <h3 class="radar-head-tag">6-AXIS STUDIO RADAR</h3>
          <div class="radar-canvas-housing">
            <canvas id="skills-radar-canvas" width="240" height="240"></canvas>
          </div>
          <div class="radar-diag-info" id="radar-diag-tooltip">
            ✦ HOVER RADAR NODES TO INSPECT PROFICIENCY
          </div>
          <button class="sunakku-cta-btn" onclick="triggerCrtTransition(() => openChapter('projects'))" style="width:100%;">
            VIEW OUR PROJECTS →
          </button>
        </div>

        <div class="skills-grid-wrapper" id="skills-grid-container">
          <!-- Category 1: Front-End & Web Development -->
          <div class="skill-category-card" data-domain="FRONTEND">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🌐</span>
              <div>
                <h3 class="skill-cat-title">Front-End & Web Architecture</h3>
                <p class="skill-cat-desc">Building structured semantic markup, dynamic state machines, and responsive interactive code.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">HTML5 & Semantic Structure</span>
                  <span class="skill-tier-badge">TIER III // 80%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:80%;"></div></div>
                <span class="skill-note-sub">Accessible layouts, modern form elements, and cleanly structured code without tag soup.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">JavaScript (ES6+ Core)</span>
                  <span class="skill-tier-badge">TIER III // 72%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:72%;"></div></div>
                <span class="skill-note-sub">DOM manipulation, state management, asynchronous fetch calls, and dynamic rendering.</span>
              </div>
            </div>
          </div>

          <!-- Category 2: Creative UI & Design -->
          <div class="skill-category-card" data-domain="UI">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🎨</span>
              <div>
                <h3 class="skill-cat-title">Creative UI & Visual Design</h3>
                <p class="skill-cat-desc">Designing interfaces that feel tactile, responsive, and carry a distinct retro-digital personality.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">UI / Web Experience Design</span>
                  <span class="skill-tier-badge">TIER IV // 82%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:82%;"></div></div>
                <span class="skill-note-sub">Retro-tech styling, cybernetic aesthetics, wireframing, and intuitive user experiences.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">CSS3 & Responsive Styling</span>
                  <span class="skill-tier-badge">TIER IV // 80%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:80%;"></div></div>
                <span class="skill-note-sub">Flexbox, CSS Grid, mobile media queries, smooth transitions, and custom dark/light themes.</span>
              </div>
            </div>
          </div>

          <!-- Category 3: Programming & Databases -->
          <div class="skill-category-card" data-domain="PROG">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">💾</span>
              <div>
                <h3 class="skill-cat-title">Programming & Databases</h3>
                <p class="skill-cat-desc">Coursework foundations covering object-oriented programming, data structures, and relational storage.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">Java (OOP Foundations)</span>
                  <span class="skill-tier-badge">TIER II // 62%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:62%;"></div></div>
                <span class="skill-note-sub">Classes, inheritance, control structures, and object-oriented principles.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">SQLite & Database Basics</span>
                  <span class="skill-tier-badge">TIER II // 55%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:55%;"></div></div>
                <span class="skill-note-sub">Schema architecture, primary/foreign keys, and relational CRUD queries.</span>
              </div>
            </div>
          </div>

          <!-- Category 4: Tools & Workflow -->
          <div class="skill-category-card" data-domain="TOOLS">
            <div class="skill-cat-header">
              <span class="skill-cat-icon">🛠️</span>
              <div>
                <h3 class="skill-cat-title">Tools & Collective Workflow</h3>
                <p class="skill-cat-desc">Software and collaborative toolchains our studio relies on daily.</p>
              </div>
            </div>
            <div class="skill-items-list">
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">VS Code & DevTools</span>
                  <span class="skill-tier-badge">TIER III // 78%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:78%;"></div></div>
                <span class="skill-note-sub">Workspace configurations, browser DOM inspector, live servers, and console debugging.</span>
              </div>
              <div class="skill-item-bar">
                <div class="skill-item-labels">
                  <span class="skill-name-tag">Git & GitHub Collaboration</span>
                  <span class="skill-tier-badge">TIER II // 70%</span>
                </div>
                <div class="skill-track"><div class="skill-fill" style="width:70%;"></div></div>
                <span class="skill-note-sub">Version control, branch management, pull requests, and live deployment pipelines.</span>
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
          <span class="cover-kicker">historical studio builds & prototypes</span>
          <h2 class="cover-main-title">THE STUDIO VAULT</h2>
        </div>
      </div>

      <div class="archive-vault-table" style="margin-top: 10px;">
        <div class="archive-vault-row" onclick="openRomInspector('v4.2-CODEX', 'Art of Studio Collective Cyber Codex v4.2 stable release featuring 2-member operative rosters, Sony Walkman ATRAC audio player, and responsive hardware-accelerated layouts.')">
          <span class="arc-id">SEC-01</span>
          <div class="arc-details">
            <span class="arc-title">Art of Studio Collective Codex v4.2</span>
            <span class="arc-desc">Studio production build featuring interactive member profiles and CRT transitions.</span>
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
    title: "Contact Us",
    category: "Studio Comm-Link",
    accent: "#38bdf8",
    coverImg: "assets/ABOUT ME - COVER.png",
    fallbackCover: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    render() {
      return `
      <div class="fb-discord-cover">
        <img class="fb-discord-cover-img" src="${this.coverImg}" alt="Contact Cover" onerror="this.src='${this.fallbackCover}'" />
        <div class="fb-discord-cover-scrim"></div>

        <div class="cover-top-controls">
          <div class="cover-pill-tabs">
            <button class="cover-tab-btn active">comm-link</button>
            <button class="cover-tab-btn copy-buffer-btn" onclick="copyBufferInteraction(this, 'artof.lab.studio@gmail.com')">
              <span>📋</span> <span class="btn-label">[ COPY STUDIO EMAIL ]</span>
            </button>
          </div>
          <div class="cover-tag-callout">
            <span>FREQ: 144.39 MHz ON AIR</span>
          </div>
        </div>

        <div class="cover-bottom-caption">
          <span class="cover-kicker">direct transmission & studio dispatch</span>
          <h2 class="cover-main-title">CONNECT WITH US</h2>
        </div>
      </div>

      <div class="contact-platforms-grid" style="margin-top: 10px;">
        <a href="https://facebook.com/share/1GhzeRRh3H" target="_blank" rel="noopener noreferrer" class="social-card-btn">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div class="social-info">
            <span class="social-name">Facebook</span>
            <span class="social-handle">@artofstudio</span>
          </div>
        </a>

        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-card-btn">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </div>
          <div class="social-info">
            <span class="social-name">Instagram</span>
            <span class="social-handle">@artofstudio</span>
          </div>
        </a>

        <!-- Interactive Direct Copy Card -->
        <div class="social-card-btn copy-buffer-btn" onclick="copyBufferInteraction(this, 'artof.lab.studio@gmail.com')">
          <div class="social-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <div class="social-info">
            <span class="social-name btn-label">[ COPY EMAIL ]</span>
            <span class="social-handle">artof.lab.studio@gmail.com</span>
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
          <input type="text" class="dispatch-input" id="disp-name" placeholder="Your Name or Team Call-Sign" required />
          <input type="email" class="dispatch-input" id="disp-email" placeholder="Your Frequency (Email)" required />
          <textarea class="dispatch-input dispatch-textarea" id="disp-msg" placeholder="Your project inquiry or transmission..." required></textarea>
          <button class="sunakku-cta-btn" onclick="sendDispatch()">SEND TRANSMISSION ✈</button>
        </div>

        <div class="interactive-terminal">
          <div class="terminal-history" id="terminal-history">
            <div class="terminal-line output-accent">★ ART OF STUDIO COMM TERMINAL v4.2</div>
            <div class="terminal-line">Direct studio link active. Type 'help' for command matrix.</div>
          </div>
          <div class="terminal-input-row">
            <span class="terminal-prompt">operator@studio:~$</span>
            <input type="text" class="terminal-input" id="terminal-input" placeholder="Type: help, roster, deck, play 1..." autocomplete="off" />
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
          <span class="cover-kicker">photography · collective rotation</span>
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
                <span class="analog-photo-tag">KODAK PORTRA 400 // STREETS</span>
              </div>
            </div>

            <div class="analog-photo-card" onclick="openPhotoLightbox('assets/image6.png', 'Sony DCR-VX1000 MiniDV', 'Sony DCR-VX1000 3CCD', 'MiniDV Tape (DVCAM)', 'Akihabara Station South')">
              <img class="analog-photo-img" src="assets/image6.png" alt="Sony Camcorder" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'" />
              <div class="analog-photo-meta">
                <span class="analog-photo-title">Sony DCR-VX1000 MiniDV ↗</span>
                <span class="analog-photo-tag">CENTURY MK1 FISHEYE // 3CCD</span>
              </div>
            </div>
          </div>

          <div class="sunakku-card">
            <h3 class="sunakku-heading">OUR GADGETS & GEAR</h3>
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

/* ================= 10. INDIVIDUAL MEMBER DOSSIER RENDERER ================= */
function renderMemberProfile(memberId) {
  const member = MEMBERS_DATABASE.find(m => m.id === memberId) || MEMBERS_DATABASE[0];

  return `
  <div class="roster-navigation-header">
    <button class="roster-back-btn" onclick="returnToRoster()">
      <span>←</span> <span>RETURN TO OPERATIVE ROSTER</span>
    </button>
    <span style="font-family:'Space Mono', monospace; font-size:0.68rem; color:var(--text-silver);">
      OPERATIVE DOSSIER // <strong style="color:var(--current-accent);">${member.name}</strong>
    </span>
  </div>

  <div class="profile-full-wrapper">
    <div class="fb-discord-cover">
      <img class="fb-discord-cover-img" src="${member.cover}" alt="${member.name} Cover" onerror="this.src='${member.fallbackCover}'" />
      <div class="fb-discord-cover-scrim"></div>

      <div class="cover-top-controls">
        <span class="cover-tag-callout">ART OF STUDIO ✦ OPERATIVE</span>
        <span class="cover-tag-callout">${member.location}</span>
      </div>

      <div class="cover-bottom-caption">
        <span class="cover-kicker">${member.specialty}</span>
        <h2 class="cover-main-title">${member.role}</h2>
      </div>
    </div>

    <div class="profile-bar-shelf">
      <div class="profile-avatar-container">
        <img class="profile-avatar-img" src="${member.avatar}" alt="${member.name}" onerror="this.src='${member.fallbackAvatar}'" />
        <div class="profile-online-dot" style="background:${member.statusColor}; box-shadow:0 0 12px ${member.statusColor};" title="Status: Online & Ready"></div>
      </div>

      <div class="profile-text-content">
        <div class="profile-primary-row">
          <div>
            <h1 class="profile-username">${member.name} <span class="profile-verified-star">✦</span></h1>
            <span class="profile-user-handle">${member.handle} // ${member.uid}</span>
          </div>
          <div class="profile-action-btns">
            <a href="${member.resume}" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn" style="background:var(--current-accent);">
              📄 View CV [PDF]
            </a>
            <button class="sunakku-cta-btn" onclick="copyBufferInteraction(this, '${member.email}')">✉ Say Hello</button>
            <button class="profile-sub-btn" onclick="copyBufferInteraction(this, '${member.email}')">Copy Email</button>
          </div>
        </div>

        <div class="profile-badge-rack">
          <span class="profile-role-chip">${member.level}</span>
          <span class="profile-role-chip">${member.role}</span>
          <span class="profile-role-chip">${member.specialty}</span>
          <span class="profile-status-chip">● ${member.status}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="sunakku-grid">
    <div class="sunakku-left-col">
      <div class="sunakku-card">
        <h3 class="sunakku-heading">WHO I AM</h3>
        ${member.bio.map(p => `<p class="sunakku-copy">${p}</p>`).join('')}
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:4px;">
          <a href="${member.resume}" target="_blank" rel="noopener noreferrer" class="sunakku-cta-btn">
            📄 curriculum vitae [pdf]
          </a>
          <button class="sunakku-cta-btn" style="background:transparent; border:1px solid var(--current-accent); color:var(--current-accent);" onclick="copyBufferInteraction(this, '${member.email}')">
            say hello ✉
          </button>
        </div>
      </div>

      <div class="sunakku-card">
        <h3 class="sunakku-heading">OPERATIVE VITALS</h3>
        <div class="sunakku-copy" style="font-family:'Space Mono', monospace; font-size:0.75rem; display:flex; flex-direction:column; gap:8px;">
          <div>CURRENT STATUS: <strong style="color:var(--current-accent);">${member.vitals.status}</strong></div>
          <div>EXPERIENCE: <strong>${member.vitals.experience}</strong></div>
          <div>FOCUS: <strong>${member.vitals.focus}</strong></div>
          <div>LOCATION: <strong>${member.vitals.location}</strong></div>
          <div>LEVEL: <strong>${member.vitals.level}</strong></div>
          <div>CURRENT MISSION: <strong>${member.vitals.mission}</strong></div>
        </div>
      </div>
    </div>

    <div class="sunakku-right-col">
      <div class="sunakku-card">
        <h3 class="sunakku-heading">CHRONICLE & MILESTONES</h3>
        <div style="display:flex; flex-direction:column; gap:14px; margin-top:6px;">
          ${member.milestones.map((ms, idx) => `
            <div style="border-left: 2px solid ${idx === 0 ? 'var(--current-accent)' : 'var(--glass-border)'}; padding-left: 14px;">
              <span style="font-family:'Space Mono',monospace; font-size:0.65rem; color:${idx === 0 ? 'var(--current-accent)' : 'var(--text-muted)'};">${ms.period}</span>
              <h4 style="color:#fff; font-size:0.95rem; margin:2px 0;">${ms.title}</h4>
              <p class="sunakku-copy">${ms.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sunakku-card">
        <h3 class="sunakku-heading">PERSONAL RIG</h3>
        <p class="sunakku-copy">${member.rig}</p>
      </div>
    </div>
  </div>

  <div class="member-switch-bar">
    <span style="font-family:'Space Mono', monospace; font-size:0.7rem; color:var(--text-muted);">
      SWITCH OPERATIVE DOSSIER:
    </span>
    <div class="member-switch-btns">
      ${MEMBERS_DATABASE.map(m => `
        <button class="osd-pill-btn ${m.id === member.id ? 'active' : ''}" style="${m.id === member.id ? 'border-color:var(--current-accent); color:var(--current-accent);' : ''}" onclick="viewMemberDossier('${m.id}')">
          ✦ ${m.name} [${m.role.split('/')[0].trim()}]
        </button>
      `).join('')}
      <button class="osd-pill-btn" onclick="returnToRoster()">
        ☰ ALL MEMBERS
      </button>
    </div>
  </div>
  `;
}

window.viewMemberDossier = function(memberId) {
  AudioSFX.playTapeClick();
  selectedMemberId = memberId;
  const readerContentBody = document.getElementById('reader-content-body');
  if (readerContentBody) {
    readerContentBody.innerHTML = CODEX_DATA.about.render();
    readerContentBody.scrollTop = 0;
  }
};

window.returnToRoster = function() {
  AudioSFX.playTapeClick();
  selectedMemberId = null;
  const readerContentBody = document.getElementById('reader-content-body');
  if (readerContentBody) {
    readerContentBody.innerHTML = CODEX_DATA.about.render();
    readerContentBody.scrollTop = 0;
  }
};

window.selectTrackFromConsole = function(index) {
  AudioSFX.playTapeClick();
  stopVirtualSynth();
  loadTrack(index);
  executeExplicitPlay();
};

window.openWalkmanDrawer = function() {
  if (retroPlayer) retroPlayer.classList.add('open');
  AudioSFX.playTapeClick();
};

/* ================= 11. PROJECT RENDERING & FILTERS ================= */
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

/* ================= 12. PROJECT MODAL INSPECTOR ================= */
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

window.openProjectModal = function(index) {
  const proj = PROJECTS_DATABASE[index];
  if (!proj) return;
  AudioSFX.playTapeClick();

  modalTitle.textContent = `SPECIFICATION INSPECTOR // ${proj.name.toUpperCase()}`;
  modalBody.innerHTML = `
    <div style="width:100%; height:190px; border-radius:6px; overflow:hidden; border:1px solid var(--glass-border); background:#000;">
      <img src="${proj.thumb}" alt="${proj.name}" onerror="this.src='${proj.fallback}'" style="width:100%; height:100%; object-fit:cover;" />
    </div>

    <div class="case-block-section">
      <div class="case-block-title"><span>⚙</span> PART 1 // SYSTEM SPECS & ARCHITECTURE</div>
      <div class="tech-spec-rack">
        ${proj.tech.map(t => `<span class="tech-spec-pill highlight">${t}</span>`).join('')}
      </div>
      <div class="case-metrics-grid">
        <div class="case-metric-pod">
          <span class="case-metric-val">${proj.metrics.fps}</span>
          <span class="case-metric-lbl">FRAME RATE</span>
        </div>
        <div class="case-metric-pod">
          <span class="case-metric-val">${proj.metrics.size}</span>
          <span class="case-metric-lbl">BUNDLE FOOTPRINT</span>
        </div>
        <div class="case-metric-pod">
          <span class="case-metric-val">${proj.metrics.perf}</span>
          <span class="case-metric-lbl">LATENCY BUDGET</span>
        </div>
      </div>
      <p style="font-size:0.78rem; line-height:1.5; color:var(--text-silver); margin-top:2px;">
        <strong style="color:var(--text-pure);">Architecture:</strong> ${proj.architecture}
      </p>
    </div>

    <div class="case-block-section">
      <div class="case-block-title"><span>🎯</span> PART 2 // MISSION BRIEF & OBJECTIVES</div>
      <p style="font-size:0.83rem; line-height:1.55; color:var(--text-silver); font-weight:500;">
        ${proj.missionBrief}
      </p>
      <p style="font-size:0.77rem; line-height:1.5; color:var(--text-muted);">
        <strong style="color:var(--current-accent);">Core Challenge Solved:</strong> ${proj.challenge}
      </p>
    </div>

    <div class="modal-actions-rack">
      <a href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer" class="retro-link-btn btn-demo">
        <span>↗</span> [ LIVE DEMO ]
      </a>
      <a href="${proj.repoUrl}" target="_blank" rel="noopener noreferrer" class="retro-link-btn btn-repo">
        <span>⌨</span> [ GITHUB REPO ]
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

/* ================= 13. CLOCKS & TIMERS ================= */
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

/* ================= 14. HUD CONTROLS ================= */
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
          All GIFs, photos, aesthetic edits, and visuals used across this studio portfolio are sourced from <strong>Pinterest</strong> and the web. They are used purely for student learning, collaborative UI practice, and non-commercial portfolio presentation.
        </p>
        
        <div style="background:rgba(0,0,0,0.35); border:1px solid var(--glass-border); padding:12px 16px; border-radius:6px;">
          <span style="font-family:'Space Mono',monospace; font-size:0.7rem; color:var(--current-accent); font-weight:700; display:block; margin-bottom:4px;">
            ✦ RESPECT TO ORIGINAL CREATORS
          </span>
          <p style="font-size:0.78rem; line-height:1.55; color:var(--text-silver);">
            All rights and credit belong entirely to the original artists, photographers, and creative directors.
          </p>
        </div>

        <p style="font-size:0.8rem; line-height:1.55; color:var(--text-muted);">
          If you are the owner of any artwork featured here and would like attribution or removal, please contact our studio at <span style="color:var(--current-accent);">artof.lab.studio@gmail.com</span>.
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

/* ================= 15. BUFFER MICRO-INTERACTION ================= */
window.copyBufferInteraction = function(triggerEl, text) {
  if (!triggerEl) return;
  
  navigator.clipboard.writeText(text).then(() => {
    AudioSFX.playBlip(1040, 'sine', 0.08);
    showToast(`✦ COPIED TO BUFFER: ${text}`);

    const labelSpan = triggerEl.querySelector('.btn-label') || triggerEl;
    const originalText = labelSpan.textContent;

    labelSpan.textContent = "[ COPIED TO BUFFER ✦ ]";
    triggerEl.classList.add('copied-state');

    setTimeout(() => {
      labelSpan.textContent = originalText;
      triggerEl.classList.remove('copied-state');
    }, 2000);
  }).catch(() => {
    showToast(`✦ BUFFER WRITE: ${text}`);
  });
};

function triggerCrtTransition(callback) {
  AudioSFX.playTapeClick();
  if (!crtShutter) { callback(); return; }
  crtShutter.classList.add('shutter-active');
  setTimeout(() => {
    callback();
    setTimeout(() => { crtShutter.classList.remove('shutter-active'); }, 100);
  }, 140);
}

/* ================= 16. CHAPTER NAVIGATION ================= */
function openChapter(key) {
  const data = CODEX_DATA[key];
  if (!data) return;

  activeChapter = key;
  particlesActive = false; // Conserve GPU on mobile while reading

  document.documentElement.style.setProperty('--current-accent', data.accent);
  document.title = `ART OF STUDIO ★ ${data.title}`;

  if (backdropImgTarget) {
    backdropImgTarget.style.backgroundImage = `url('${data.coverImg}'), url('${data.fallbackCover}')`;
  }

  if (readerBadge) readerBadge.textContent = data.num;
  if (readerStatusTag) readerStatusTag.textContent = `ART OF STUDIO // ${data.category.toUpperCase()}`;

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
    selectedMemberId = null; // Reset member view back to roster
    document.title = "ART OF STUDIO ★ // SYSTEM CORE v4.2";
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

/* ================= 17. MAIN MENU CARD LISTENERS ================= */
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

window.scrollProjectCarousel = function(dir) {
  const track = document.getElementById('projects-track');
  if (!track) return;
  AudioSFX.playBlip(600, 'sine', 0.03);
  const amount = dir === 'left' ? -320 : 320;
  track.scrollBy({ left: amount, behavior: 'smooth' });
};

/* ================= 18. SKILLS RADAR CHART ================= */
function initRadarChart() {
  const radarCanvas = document.getElementById('skills-radar-canvas');
  const tooltip = document.getElementById('radar-diag-tooltip');
  if (!radarCanvas) return;
  const rCtx = radarCanvas.getContext('2d');
  const size = 240;
  const center = size / 2;
  const radius = 80;

  const skills = [
    { label: "UI / Design", value: 0.82 },
    { label: "CSS3 Styling", value: 0.80 },
    { label: "HTML5 Core", value: 0.80 },
    { label: "JavaScript", value: 0.72 },
    { label: "Java (OOP)", value: 0.62 },
    { label: "SQLite / DB", value: 0.55 }
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
    if (tooltip && skills[index]) {
      tooltip.textContent = `DIAGNOSTIC: ${skills[index].label.toUpperCase()} — ${(skills[index].value * 100).toFixed(0)}% PROFICIENCY`;
    }
  };
}

/* ================= 19. DISPATCH FORM & TERMINAL ================= */
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
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      showToast(`✦ TRANSMISSION SENT! THANK YOU, ${name.value.toUpperCase()}`);
      name.value = '';
      email.value = '';
      msg.value = '';
      AudioSFX.playBlip(900, 'sine', 0.08);
    } else {
      showToast('✦ TRANSMISSION FAILED — TRY AGAIN');
      AudioSFX.playBlip(300, 'sine', 0.08);
    }
  } catch (error) {
    showToast('✦ CONNECTION ERROR — TRY AGAIN');
    AudioSFX.playBlip(300, 'sine', 0.08);
  }
};

function initTerminal() {
  const input = document.getElementById('terminal-input');
  const history = document.getElementById('terminal-history');
  if (!input || !history || input.dataset.terminalBound === "true") return;

  input.dataset.terminalBound = "true";
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const rawCmd = input.value.trim();
      const command = rawCmd.toLowerCase();
      if (!command) return;

      AudioSFX.playBlip(750, 'triangle', 0.03);
      const userLine = document.createElement('div');
      userLine.className = 'terminal-line';
      userLine.textContent = `operator@studio:~$ ${rawCmd}`;
      history.appendChild(userLine);

      const responseLine = document.createElement('div');
      responseLine.className = 'terminal-line output-accent';

      if (command === 'help') {
        responseLine.innerHTML = "STUDIO DIRECTIVES:\n • help       - Show commands\n • roster     - List active studio operatives\n • specs      - Studio tech stack & system specs\n • deck       - Portfolio deck link\n • email      - Studio relay address\n • matrix     - Toggle digital rain\n • konami     - 24K Gold overclock\n • eject      - Walkman MiniDisc tray\n • play [1-2] - Play audio track\n • pause      - Pause audio\n • clear      - Clear terminal history";
      } else if (command === 'roster' || command === 'members' || command === 'team') {
        responseLine.textContent = `STUDIO OPERATIVE ROSTER [${MEMBERS_DATABASE.length} MEMBERS]:\n${MEMBERS_DATABASE.map(m => ` • ${m.name} // ${m.role} (${m.level})`).join('\n')}`;
      } else if (command === 'specs' || command === 'neofetch') {
        responseLine.textContent = `
    ___   ___  ___  _  __ ___ 
   / _ \\ / _ \\/ _ || |/ // _/
  / // // // // __ ||   // _/  
 /____//_/|_//_/ |_||_|\\_\\___/  
 -----------------------------
 STUDIO: Art of Studio
 OPERATIVES: Drake (Front-End) & Alex (Systems)
 CORE: Cyber Codex v4.2 [Group Collective Edition]
 STACK: HTML5 / CSS3 / ES6+ / Java / SQLite / WebAudio
 STATUS: Active & leveling up`;
      } else if (command === 'deck' || command === 'resume') {
        responseLine.textContent = `[ART OF STUDIO // COLLECTIVE DECK]\n• Front-End, UI/UX & Systems Architecture\n• Download PDF CV/Deck via the top HUD bar`;
      } else if (command === 'email') {
        responseLine.textContent = "STUDIO RELAY: artof.lab.studio@gmail.com";
      } else if (command === 'matrix') {
        matrixEasterEggActive = true;
        particlesActive = true;
        responseLine.textContent = "✦ ENGAGING DIGITAL RAIN ON AMBIENT CANVAS (10s)...";
        setTimeout(() => { matrixEasterEggActive = false; }, 10000);
      } else if (command === 'konami' || command === 'hack' || command === 'secret') {
        activateGoldOverclock();
        responseLine.textContent = "★ OVERCLOCK VERIFIED: 24K GOLD THEME UNLOCKED!";
      } else if (command === 'eject') {
        if (hwEjectBtn) hwEjectBtn.click();
        responseLine.textContent = "✦ MINIDISC TRAY EJECTED";
      } else if (command.startsWith('play')) {
        const parts = command.split(' ');
        const idx = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
        if (!isNaN(idx) && idx >= 0 && idx < PLAYLIST.length) {
          loadTrack(idx);
          stopVirtualSynth();
          executeExplicitPlay();
          responseLine.textContent = `✦ ENGAGING TRACK 0${idx + 1}: ${PLAYLIST[idx].name}`;
        } else {
          responseLine.textContent = "✦ USAGE: play [1-2]";
        }
      } else if (command === 'pause') {
        audioCore.pause();
        stopVirtualSynth();
        hwPlayBtn.textContent = '▶';
        if (musicIndicator) musicIndicator.classList.remove('active');
        updateDiscState(false);
        renderSpectrumCanvas();
        responseLine.textContent = "✦ WALKMAN PLAYBACK PAUSED";
      } else if (command === 'clear') {
        history.innerHTML = "";
        input.value = "";
        return;
      } else {
        responseLine.textContent = `DIRECTIVE UNKNOWN: '${rawCmd}'. Type 'help' for command matrix.`;
      }

      history.appendChild(responseLine);
      history.scrollTop = history.scrollHeight;
      input.value = "";
    }
  });
}

/* ================= 20. SHORTCUTS & KONAMI CODE ================= */
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

/* ================= 21. MOBILE TOUCH SWIPE NAVIGATION ================= */
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const diffX = touchEndX - touchStartX;
  if (e.target.closest('.projects-horizontal-track, .contact-platforms-grid, .retro-audio-pod, .interactive-terminal')) return;

  if (readerView && readerView.classList.contains('active') && Math.abs(diffX) > 65) {
    if (diffX > 0) {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].prev));
    } else {
      triggerCrtTransition(() => openChapter(CODEX_DATA[activeChapter].next));
    }
  }
}, { passive: true });

/* ================= 22. HASH ROUTING ================= */
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  if (CODEX_DATA[hash]) openChapter(hash);
});

window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '');
  if (CODEX_DATA[hash]) openChapter(hash);
  else closeReader();
});
