// Birthday Surprise App Logic — "Love, Laughter & Forever"
(function () {
  "use strict";

  // ─── 0. Gift Box Intro Screen ───────────────────────────────
  (function initGiftIntro() {
    const introScreen = document.getElementById("gift-intro-screen");
    const loaderScreen = document.getElementById("loader-screen");

    // Only show once per browser session
    if (sessionStorage.getItem("giftIntroPlayed") === "1") {
      introScreen.classList.add("hidden");
      return; // boot the rest of the app normally
    }

    // Hide loader until intro is done
    if (loaderScreen) loaderScreen.style.display = "none";

    // ── Spawn floating sparkles ──
    const sparkleLayer = document.getElementById("gift-sparkles-layer");
    const sparkleCount = 22;
    for (let i = 0; i < sparkleCount; i++) {
      const s = document.createElement("div");
      s.className = "gib-sparkle";
      const size = 30 + Math.random() * 60;
      s.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${Math.random() * 100}%`,
        `top:${Math.random() * 100}%`,
        `--dur:${2 + Math.random() * 3}s`,
        `--delay:${Math.random() * 2}s`,
      ].join(";");
      sparkleLayer.appendChild(s);
    }

    // ── Burst particles (hearts + confetti) ──
    function spawnParticles() {
      const container = document.getElementById("gib-particles");
      const hearts = ["💜", "💖", "✨", "💎", "🌸", "⭐", "💫"];
      const confettiColors = ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF", "#5B21B6", "#C084FC", "#D1B8F7"];

      // 20 heart emojis
      for (let i = 0; i < 20; i++) {
        const p = document.createElement("span");
        p.className = "gib-particle";
        p.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const dist = 90 + Math.random() * 140;
        p.style.cssText = [
          `--tx:${Math.cos(angle) * dist}px`,
          `--ty:${Math.sin(angle) * dist}px`,
          `--rot:${Math.random() * 360}deg`,
          `--dur:${1.1 + Math.random() * 0.5}s`,
          `--delay:${0.3 + Math.random() * 0.3}s`,
        ].join(";");
        container.appendChild(p);
      }
      // 30 confetti dots
      for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "gib-confetti-dot";
        p.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const dist = 100 + Math.random() * 160;
        p.style.cssText += [
          `--tx:${Math.cos(angle) * dist}px`,
          `--ty:${Math.sin(angle) * dist}px`,
          `--rot:${Math.random() * 540}deg`,
          `--dur:${1.2 + Math.random() * 0.6}s`,
          `--delay:${0.25 + Math.random() * 0.4}s`,
        ].join(";");
        container.appendChild(p);
      }
    }

    // ── canvas-confetti burst (loaded async, fired if available) ──
    function fireConfettiBurst() {
      if (typeof confetti !== "function") return;
      const origin = { x: 0.5, y: 0.5 };
      confetti({ particleCount: 80, spread: 110, startVelocity: 35, origin, colors: ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF", "#fff"] });
      setTimeout(() => confetti({ particleCount: 40, spread: 60, startVelocity: 20, origin, colors: ["#5B21B6", "#C084FC", "#D1B8F7", "#C8A84B"] }), 200);
    }

    // ── One-shot click/tap handler ──
    let triggered = false;
    const giftBox = document.getElementById("gift-intro-box");

    function openGift(e) {
      if (triggered) return;
      triggered = true;
      e.stopPropagation();

      // 1. Mark as triggered (stops hover float, starts open CSS)
      giftBox.classList.add("triggered");

      // 2. Spawn DOM particles (fast CSS burst)
      spawnParticles();

      // 3. canvas-confetti burst slightly later
      setTimeout(fireConfettiBurst, 350);

      // 4. Fade out intro after animations settle → show loader/main
      setTimeout(() => {
        introScreen.classList.add("exit");

        setTimeout(() => {
          introScreen.classList.add("hidden");
          sessionStorage.setItem("giftIntroPlayed", "1");

          // Restore and kick off normal app boot
          if (loaderScreen) {
            loaderScreen.style.display = "";
            loaderScreen.style.opacity = "1";
          }
          startAppBoot();
        }, 900); // matches the CSS exit transition duration
      }, 1800);
    }

    giftBox.addEventListener("click", openGift);
    giftBox.addEventListener("touchstart", openGift, { passive: false });
    giftBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openGift(e);
    });
  })();

  // Flag so the BOOT block at the bottom knows whether to auto-start
  // (intro already shown / skipped via session storage → boot immediately)
  const _introAlreadyDone = sessionStorage.getItem("giftIntroPlayed") === "1";

  // startAppBoot is called either by the intro completion OR directly below
  function startAppBoot() {
    setTimeout(() => {
      const loader = document.getElementById("loader-screen");
      if (!loader) return;
      loader.style.opacity = "0";
      setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1000);
      navigateTo("hero");
      typeHeroSubtitle();
    }, 2200);
  }

  // ─── 1. Audio Engine (Procedural Synthesizer for SFX) ───
  // All synth methods are intentionally silent — only background music plays.
  class SoundSynth {
    constructor() { this.ctx = null; }
    init() { }
    playPop() { }
    playBlow() { }
    playChime() { }
    playClick() { }
  }

  const synth = new SoundSynth();

  // ─── 2. Background Music Controller ───
  let isPlayingMusic = false;
  let musicStarted = false; // tracks whether play has been attempted after a gesture
  const musicToggle = document.getElementById("global-music-btn");

  // Pre-create the Audio object immediately so the browser can start buffering
  const bgMusic = CONFIG.musicUrl ? new Audio(CONFIG.musicUrl) : null;
  if (bgMusic) {
    bgMusic.loop = true;
    bgMusic.volume = CONFIG.musicVolume || 0.3;
    bgMusic.preload = "auto";
  }

  function playMusic() {
    if (!bgMusic) return;
    bgMusic.play().then(() => {
      isPlayingMusic = true;
      musicStarted = true;
      musicToggle.classList.add("playing");
      musicToggle.classList.remove("muted");
      removeAutoplayFallback(); // clean up listeners once playing
    }).catch(() => {
      // Autoplay blocked — registerAutoplayFallback will retry on next gesture
      registerAutoplayFallback();
    });
  }

  function toggleMusic() {
    if (!bgMusic) return;
    if (isPlayingMusic) {
      bgMusic.pause();
      isPlayingMusic = false;
      musicToggle.classList.remove("playing");
      musicToggle.classList.add("muted");
    } else {
      bgMusic.play().then(() => {
        isPlayingMusic = true;
        musicToggle.classList.add("playing");
        musicToggle.classList.remove("muted");
      }).catch(() => { });
    }
  }

  // ── Autoplay fallback: retry on the very next user interaction ──
  function onFirstInteraction() {
    if (!musicStarted && bgMusic && !isPlayingMusic) {
      bgMusic.play().then(() => {
        isPlayingMusic = true;
        musicStarted = true;
        musicToggle.classList.add("playing");
        musicToggle.classList.remove("muted");
        removeAutoplayFallback();
      }).catch(() => { });
    } else {
      removeAutoplayFallback();
    }
  }

  function registerAutoplayFallback() {
    ["click", "touchstart", "keydown"].forEach(evt =>
      document.addEventListener(evt, onFirstInteraction, { once: true, capture: true })
    );
  }

  function removeAutoplayFallback() {
    ["click", "touchstart", "keydown"].forEach(evt =>
      document.removeEventListener(evt, onFirstInteraction, { capture: true })
    );
  }

  // Register the fallback immediately — covers cases where autoplay is
  // blocked before the user reaches the "Are You Ready?" button
  registerAutoplayFallback();

  musicToggle.addEventListener("click", toggleMusic);

  // ─── 3. Floating Hearts Background ───
  const bgHeartsContainer = document.getElementById("bg-hearts-container");
  // Violet hearts appear 3× more than other symbols for a subtle romantic density
  const heartSymbols = [
    "💜", "💜", "💜",   // deep violet — most frequent
    "🪻", "🪻",        // light violet blossom
    "💟", "💟",        // violet heart decoration
    "💖", "💕", "💝",   // accent pinks — occasional warmth
    "✨", "⭐", "💫",   // sparkle / star
    "🌸"              // soft floral
  ];

  function spawnFloatingHeart() {
    if (document.querySelectorAll(".floating-heart").length > 26) return;
    const el = document.createElement("div");
    el.className = "floating-heart";
    const symbol = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    el.textContent = symbol;
    el.style.left = Math.random() * 100 + "vw";
    // Hearts render slightly smaller for subtlety; stars/sparkles keep the full range
    const isHeart = ["💜", "🪻", "💟", "💖", "💕", "💝", "🌸"].includes(symbol);
    el.style.fontSize = isHeart
      ? (Math.random() * 0.7 + 0.65) + "rem"   // 0.65–1.35 rem — small & elegant
      : (Math.random() * 0.9 + 0.85) + "rem";   // 0.85–1.75 rem — sparkles slightly larger
    const dur = Math.random() * 3 + 6;
    el.style.animationDuration = dur + "s";
    bgHeartsContainer.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 500);
  }
  setInterval(spawnFloatingHeart, 900);

  // ─── 4. Section / State Machine ───
  const SECTIONS = ["hero", "balloons", "cake", "gift", "memories", "letter", "finale"];
  let currentSectionId = "hero";
  let currentSectionIdx = 0;

  function navigateTo(sectionId) {
    if (!SECTIONS.includes(sectionId)) return;
    currentSectionId = sectionId;
    currentSectionIdx = SECTIONS.indexOf(sectionId);

    SECTIONS.forEach(id => {
      const el = document.getElementById(id + "-section");
      if (!el) return;
      if (id === sectionId) {
        el.classList.remove("leaving");
        el.classList.add("active");
      } else if (el.classList.contains("active")) {
        el.classList.remove("active");
        el.classList.add("leaving");
        setTimeout(() => el.classList.remove("leaving"), 1200);
      } else {
        el.classList.remove("active", "leaving");
      }
    });

    // Section-specific initialisations
    switch (sectionId) {
      case "balloons":
        // Defer balloon init by two rAF ticks so the browser can:
        //   1. Complete the section's entry transition first paint (rAF 1)
        //   2. Commit compositor layers before reading offsetWidth (rAF 2)
        // Without this, offsetWidth read + 8 will-change DOM insertions happen
        // mid-transition, causing a compositor budget spike = first-frame stutter.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { initBalloonsGame(); });
        });
        break;
      case "cake": initCandleGame(); break;
      case "memories": initMemoriesSlideshow(); break;
      case "letter": startTypewriterLetter(); break;
      case "finale": initFinaleSection(); break;
    }
  }

  // ─── 5. Hero Section ───
  const heroReadyBtn = document.getElementById("hero-ready-btn");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroText = "To the one who makes life beautiful...";
  let heroTyperTimeout = null;

  function typeHeroSubtitle() {
    heroSubtitle.textContent = "";
    let idx = 0;
    function next() {
      if (idx < heroText.length) {
        heroSubtitle.textContent += heroText.charAt(idx);
        idx++;
        heroTyperTimeout = setTimeout(next, 70);
      }
    }
    heroTyperTimeout = setTimeout(next, 800);
  }

  heroReadyBtn.addEventListener("click", () => {
    playMusic();
    navigateTo("balloons");
  });

  // ─── 6. Balloons Mini-Game ───
  let balloonsPopped = 0;
  let totalBalloons = 0;
  let balloonsReady = false;
  let balloonIntervals = [];

  function initBalloonsGame() {
    if (balloonsReady) return;
    balloonsReady = true;
    balloonIntervals = [];
    balloonsPopped = 0;

    const canvas = document.getElementById("balloon-canvas");
    canvas.innerHTML = "";
    totalBalloons = CONFIG.balloonKeywords.length;
    const countEl = document.getElementById("balloons-popped-count");
    document.getElementById("total-balloons-count").textContent = totalBalloons;
    countEl.textContent = "0";

    const colors = ["#C9B0F5", "#A67FE8", "#7C3AED", "#9B6AF0", "#D1B8F7", "#B89AEC", "#E4D4FF", "#8B5CF6"];

    // ── Layout constants ──────────────────────────────────────────────────
    // Canvas fills the section viewport via position:absolute inset:0.
    const canvasW = canvas.offsetWidth || window.innerWidth;
    const canvasH = canvas.offsetHeight || window.innerHeight;
    const isMobile = canvasW < 600;

    // Match exactly what CSS clamp() produces for the balloon dimensions.
    const bW = Math.round(Math.min(Math.max(isMobile ? 40 : 44,
      canvasW * (isMobile ? 0.09 : 0.10)),
      isMobile ? 56 : 80));
    const bH = Math.round(Math.min(Math.max(isMobile ? 48 : 52,
      canvasW * (isMobile ? 0.11 : 0.12)),
      isMobile ? 68 : 96));

    // 8 balloons in 2 rows of 4.
    // Row 0 = even indices (0,2,4,6), Row 1 = odd indices (1,3,5,7).
    const COLS = 4;
    const ROWS = 2;

    // Horizontal: pad each side by exactly one balloon-width so no balloon
    // can ever touch the screen edge.  Then divide the remaining usable
    // width into (COLS-1) equal gaps.
    const hPad = bW;                              // one balloon-width of padding
    const usableW = canvasW - 2 * hPad - bW;        // space between first and last left-edge
    const colGap = COLS > 1 ? usableW / (COLS - 1) : 0;

    // Reserve the top 70px on mobile to clear the music-toggle button.
    const topClear = isMobile ? 70 : 30;
    // Vertical gap between the two rows — generous enough to look like a
    // proper zig-zag but still well above the info card at the bottom.
    const rowGap = isMobile ? Math.round(canvasH * 0.14)
      : Math.round(canvasH * 0.12);

    // Row 0 top-edge, Row 1 top-edge (pixels from canvas top).
    const rowTop = [topClear, topClear + rowGap];
    // ─────────────────────────────────────────────────────────────────────

    CONFIG.balloonKeywords.forEach((word, index) => {
      const balloon = document.createElement("div");
      balloon.className = "balloon";
      balloon.setAttribute("role", "button");
      balloon.setAttribute("aria-label", "Pop balloon");

      const bgColor = colors[index % colors.length];
      balloon.style.backgroundColor = bgColor;
      balloon.style.color = bgColor;

      // Which column and row this balloon occupies in the 4×2 grid.
      // Ordered in a zigzag sequence: Top-Left, Bottom-Left, Top-2nd, Bottom-2nd
      const col = Math.floor(index / 2);
      const row = index % 2;

      // ── Pixel-precise positioning ─────────────────────────────────────
      // left = left edge of the balloon in pixels (never negative, never
      // exceeds canvasW - bW, so the right edge never leaves the canvas).
      const leftPx = hPad + col * colGap;
      const topPx = rowTop[row] || rowTop[ROWS - 1];

      balloon.style.left = leftPx + "px";
      balloon.style.top = topPx + "px";
      // ─────────────────────────────────────────────────────────────────

      // Stutter fix: set animationDelay BEFORE appending to the DOM.
      // If the delay is set after insertion, the browser renders one
      // zero-delay frame first (showing the balloon at its un-animated
      // position) which appears as a one-frame stutter/jump.
      // Setting it before insertion means the first painted frame already
      // respects the delay — the animation starts clean.
      balloon.style.animationDelay = -(col * 0.28 + row * 0.14) + "s";

      // String
      const string = document.createElement("div");
      string.className = "balloon-string";
      balloon.appendChild(string);

      // Pop handler
      function handlePop(e) {
        e.stopPropagation();
        e.preventDefault();

        balloon.classList.add("popping");
        synth.playPop();

        const rect = balloon.getBoundingClientRect();
        if (typeof confetti === "function") {
          confetti({
            particleCount: 25,
            spread: 55,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight
            },
            colors: [bgColor, "#C8A84B", "#7C3AED"]
          });
        }

        // Pop text — appended to document.body with position:fixed so it
        // is completely outside the .story-section stacking context.
        // The section has overflow-x:hidden which implicitly clips overflow-y
        // in some browsers, and its own transform creates a containing block
        // that traps absolutely-positioned descendants. Using fixed + body
        // bypasses both constraints entirely.
        const popText = document.createElement("div");
        popText.className = "balloon-pop-text";
        popText.textContent = word;

        // Viewport-centre of the balloon. Clamped so the pill label
        // (≤220px wide, centred via translateX(-50%)) never overflows
        // either side of the screen regardless of which balloon was popped.
        const vCentreX = rect.left + rect.width / 2;
        const vCentreY = rect.top + rect.height / 2;
        const halfPill = Math.min(110, window.innerWidth * 0.40);
        const safeX = Math.min(
          Math.max(vCentreX, halfPill + 8),
          window.innerWidth - halfPill - 8
        );

        popText.style.position = "fixed";
        popText.style.left = safeX + "px";
        popText.style.top = vCentreY + "px";
        popText.style.zIndex = "9999";   // above every stacking context
        document.body.appendChild(popText);
        setTimeout(() => popText.remove(), 2000);

        balloon.remove();
        balloonsPopped++;
        countEl.textContent = balloonsPopped;

        if (balloonsPopped >= totalBalloons) {
          balloonIntervals.forEach(id => clearInterval(id));
          setTimeout(() => {
            if (typeof confetti === "function") {
              confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
            }
            navigateTo("cake");
          }, 1200);
        }
      }

      balloon.addEventListener("click", handlePop);
      balloon.addEventListener("touchstart", handlePop, { passive: false });

      // Append AFTER all styles are set so the first painted frame is correct.
      canvas.appendChild(balloon);
    });
  }

  // ─── 7. Candle Blowing Mini-Game ───
  let candlesBlown = false;
  let candleGameReady = false;
  let micStream = null;
  let micCheckInterval = null;
  let micAudioCtx = null;

  function initCandleGame() {
    if (candleGameReady) return;
    candleGameReady = true;

    const blowBtn = document.getElementById("candle-blow-btn");
    const micIndicator = document.getElementById("mic-status-indicator");

    // Allow mic on HTTPS, localhost, 127.0.0.1, and file:// (local dev)
    const isSecure = location.protocol === "https:"
      || location.protocol === "file:"
      || location.hostname === "localhost"
      || location.hostname === "127.0.0.1";

    // Track whether mic is currently active (not just attempted)
    let micActive = false;
    // Track consecutive frames above threshold for sustained-blow detection
    let blowFrames = 0;
    const BLOW_FRAMES_NEEDED = 3;   // ~300ms sustained blow at 100ms intervals
    const BLOW_RMS_THRESHOLD = 0.03; // RMS amplitude threshold (0–1 range)

    // ── Start mic — can be retried if previous attempt failed ──
    function tryStartMic() {
      if (micActive || candlesBlown) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        micIndicator.textContent = "Tap the button to blow out the candles!";
        return;
      }

      micIndicator.textContent = "Requesting microphone…";

      navigator.mediaDevices.getUserMedia({
        audio: {
          // Disable all processing for raw amplitude detection
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      }).then(stream => {
        micStream = stream;
        micActive = true;

        // Create AudioContext after user gesture — guaranteed resumed on mobile
        micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const startListening = () => {
          const source = micAudioCtx.createMediaStreamSource(stream);
          const analyser = micAudioCtx.createAnalyser();
          analyser.fftSize = 2048;       // larger FFT → smoother time-domain data
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);
          micIndicator.textContent = "🎤 Blow into your microphone!";
          micIndicator.classList.add("mic-listening");

          const bufLen = analyser.fftSize;
          const timeDomainData = new Float32Array(bufLen);

          blowFrames = 0;

          micCheckInterval = setInterval(() => {
            if (currentSectionId !== "cake" || candlesBlown) {
              clearInterval(micCheckInterval);
              stopMicrophone();
              return;
            }

            // Use time-domain waveform data for RMS amplitude detection.
            analyser.getFloatTimeDomainData(timeDomainData);

            // Calculate RMS (root mean square) amplitude
            let sumSquares = 0;
            for (let i = 0; i < bufLen; i++) {
              sumSquares += timeDomainData[i] * timeDomainData[i];
            }
            const rms = Math.sqrt(sumSquares / bufLen);
            console.log("RMS:", rms);
            if (rms > BLOW_RMS_THRESHOLD) {
              blowFrames++;
              // Visual feedback: show blow intensity
              micIndicator.textContent = "🌬️ Keep blowing…!";
              if (blowFrames >= BLOW_FRAMES_NEEDED) {
                extinguishCandles();
              }
            } else {
              blowFrames = Math.max(0, blowFrames - 1); // gradual decay
              if (!candlesBlown) {
                micIndicator.textContent = "🎤 Blow into your microphone!";
              }
            }
          }, 100);
        };

        if (micAudioCtx.state === "suspended") {
          micAudioCtx.resume().then(startListening).catch(startListening);
        } else {
          startListening();
        }
      }).catch(err => {
        micActive = false; // allow retry on next tap
        console.warn("Mic access denied or failed:", err);
        micIndicator.textContent = "Tap the button to blow out the candles!";
      });
    }

    // ── Blow button — works on both click (desktop) and touchend (mobile) ──
    let manualFallbackReady = false;

    function onBlowBtn(e) {
      e.preventDefault(); // prevent ghost click on mobile

      if (!micActive && !manualFallbackReady) {
        // First tap: Wake the mic
        tryStartMic();
        // Change button to be a manual fallback
        manualFallbackReady = true;
        blowBtn.textContent = "Tap to Manually Extinguish 💨";
      } else {
        // Second tap or mic failed: Manual fallback
        extinguishCandles();
      }
    }

    blowBtn.addEventListener("click", onBlowBtn);
    blowBtn.addEventListener("touchend", onBlowBtn, { passive: false });

    // On desktop, try starting the mic immediately (no gesture restriction)
    if (isSecure && !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      tryStartMic();
      manualFallbackReady = true;
      blowBtn.textContent = "Tap to Manually Extinguish 💨";
    } else {
      // Mobile: hint user to tap button or blow
      micIndicator.textContent = "Tap the button to enable microphone 🎤";
      blowBtn.textContent = "Enable Microphone 🎤";
    }
  }

function stopMicrophone() {
  if (micCheckInterval) {
    clearInterval(micCheckInterval);
    micCheckInterval = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (micAudioCtx && micAudioCtx.state !== "closed") {
    micAudioCtx.close().catch(() => { });
    micAudioCtx = null;
  }
}

function extinguishCandles() {
  if (candlesBlown) return;
  candlesBlown = true;
  synth.playBlow();
  stopMicrophone();

  // Update mic indicator to reflect success
  const micInd = document.getElementById("mic-status-indicator");
  if (micInd) {
    micInd.classList.remove("mic-listening");
    micInd.textContent = "✨ Candles extinguished!";
  }

  const flames = document.querySelectorAll(".flame");
  flames.forEach((flame, i) => {
    setTimeout(() => flame.classList.add("blown"), i * 200);
  });

  setTimeout(() => {
    synth.playChime();
    if (typeof confetti === "function") {
      confetti({
        particleCount: 100, spread: 70, origin: { y: 0.55 },
        colors: ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF"]
      });
    }
    const msg = document.getElementById("cake-message");
    msg.textContent = "Make a wish! 🌟";
    msg.style.color = "var(--color-accent-gold)";
    msg.style.fontSize = "1.4rem";

    setTimeout(() => navigateTo("gift"), 2800);
  }, flames.length * 200 + 400);
}

// ─── 8. Gift Box Mini-Game ───
let giftOpened = false;
const giftBox = document.getElementById("clickable-gift-box");

giftBox.addEventListener("click", () => {
  if (giftOpened) return;
  giftOpened = true;
  synth.playChime();
  giftBox.classList.add("opened");

  if (typeof confetti === "function") {
    confetti({
      particleCount: 60, spread: 70,
      colors: ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF"]
    });
  }

  document.getElementById("gift-instruction").textContent = "Look inside! ✨";

  setTimeout(() => {
    const card = document.querySelector("#gift-section .premium-card");
    // Only add button if it doesn't already exist
    if (!card.querySelector(".btn-next-gift")) {
      const btn = document.createElement("button");
      btn.className = "btn-primary btn-next-gift";
      btn.textContent = "See Our Memories 📸";
      btn.style.marginTop = "20px";
      btn.style.animation = "pulseBeat 1.8s infinite alternate";
      btn.addEventListener("click", () => navigateTo("memories"));
      card.appendChild(btn);
    }
  }, 1000);
});

// ─── 9. Memories Photo Slideshow ───
let currentSlide = 0;
let slideshowTimer = null;
let memoriesReady = false;
const slidesWrapper = document.getElementById("slides-wrapper");
const heartDotsBox = document.getElementById("heart-dots-container");

function initMemoriesSlideshow() {
  if (memoriesReady) return;
  memoriesReady = true;

  slidesWrapper.innerHTML = "";
  heartDotsBox.innerHTML = "";
  currentSlide = 0;

  CONFIG.memories.forEach((item, idx) => {
    const slide = document.createElement("div");
    slide.className = "slide" + (idx === 0 ? " active" : "");

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = "Memory " + (idx + 1);
    img.className = "slide-img";
    img.addEventListener("click", () => openLightbox(item.url, item.caption));

    const cap = document.createElement("div");
    cap.className = "slide-caption-bar";
    cap.textContent = item.caption;

    slide.appendChild(img);
    slide.appendChild(cap);
    slidesWrapper.appendChild(slide);

    const dot = document.createElement("span");
    dot.className = "heart-dot" + (idx === 0 ? " active" : "");
    dot.textContent = "♥";
    dot.addEventListener("click", () => { synth.playClick(); goToSlide(idx); });
    heartDotsBox.appendChild(dot);
  });

  // Navigation arrows
  document.getElementById("prev-slide-btn").onclick = () => { synth.playClick(); goToSlide(currentSlide - 1); };
  document.getElementById("next-slide-btn").onclick = () => { synth.playClick(); goToSlide(currentSlide + 1); };

  // Swipe gesture
  let touchX = 0;
  slidesWrapper.addEventListener("touchstart", e => { touchX = e.changedTouches[0].screenX; }, { passive: true });
  slidesWrapper.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchX;
    if (dx < -40) goToSlide(currentSlide + 1);
    else if (dx > 40) goToSlide(currentSlide - 1);
  });

  startSlideshowAuto();
}

function startSlideshowAuto() {
  clearInterval(slideshowTimer);
  slideshowTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

function goToSlide(idx) {
  const slides = slidesWrapper.querySelectorAll(".slide");
  const dots = heartDotsBox.querySelectorAll(".heart-dot");
  if (!slides.length) return;
  slides[currentSlide].classList.remove("active");
  dots[currentSlide].classList.remove("active");
  currentSlide = ((idx % slides.length) + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
  startSlideshowAuto();
}

// Lightbox
const lightbox = document.getElementById("gallery-lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCap = document.getElementById("lightbox-caption");

function openLightbox(url, caption) {
  synth.playClick();
  lightboxImg.src = url;
  lightboxCap.textContent = caption;
  lightbox.classList.add("active");
}

document.getElementById("lightbox-close-btn").addEventListener("click", () => lightbox.classList.remove("active"));
lightbox.addEventListener("click", e => {
  if (e.target === lightbox) lightbox.classList.remove("active");
});

// Next button
document.getElementById("memories-next-btn").addEventListener("click", () => {
  clearInterval(slideshowTimer);
  navigateTo("letter");
});

// ─── 10. Typewriter Love Letter ───
const letterTextEl = document.getElementById("letter-typing-text");
const letterCursor = document.getElementById("letter-cursor-blink");
const letterHint = document.getElementById("letter-reveal-hint");
const heartFillContainer = document.getElementById("heart-fill-container");
const heartFillBtn = document.getElementById("heart-fill-btn");
let letterInterval = null;
let letterComplete = false;

function startTypewriterLetter() {
  const letterText = CONFIG.letterText;
  letterTextEl.textContent = "";
  letterCursor.style.display = "inline-block";
  letterHint.style.opacity = "1";
  heartFillContainer.style.display = "none";
  heartFillBtn.classList.remove("filled");
  letterComplete = false;

  clearInterval(letterInterval);
  letterInterval = null;   // we use rAF now, keep var for compat with reset

  const paper = document.getElementById("letter-paper-box");
  const CHAR_RATE = 45;   // ms per character — same visible speed as before
  let charIdx = 0;
  let lastTime = null;
  let rafId = null;
  let scrollTimer = null;
  let userScrolled = false; // true once user manually scrolls — stops auto-scroll

  // Stop hijacking scroll as soon as the user touches or wheels the paper
  function onUserScroll() { userScrolled = true; }
  paper.addEventListener("scroll", onUserScroll, { passive: true });
  paper.addEventListener("touchstart", onUserScroll, { passive: true });
  paper.addEventListener("wheel", onUserScroll, { passive: true });

  // Debounced auto-scroll — only runs while the user hasn't touched the paper.
  // Schedules one scrollTop write per 150ms max so it never competes with
  // the browser's own scroll handling.
  function scheduleScroll() {
    if (userScrolled || scrollTimer) return;
    scrollTimer = setTimeout(() => {
      if (!userScrolled) paper.scrollTop = paper.scrollHeight;
      scrollTimer = null;
    }, 150);
  }

  function tick(timestamp) {
    if (letterComplete) return;

    if (lastTime === null) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    // How many characters should have been typed by now
    const target = Math.min(
      Math.floor(elapsed / CHAR_RATE),
      letterText.length
    );

    if (target > charIdx) {
      // Append all pending characters in one DOM write
      letterTextEl.textContent = letterText.slice(0, target);
      charIdx = target;
      scheduleScroll();
    }

    if (charIdx >= letterText.length) {
      finishLetter(letterText);
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  // Store rafId on the interval slot so the reset path can cancel it
  rafId = requestAnimationFrame(tick);
  letterInterval = { _rafId: rafId, _scrollTimer: scrollTimer };
  letterInterval._cancel = () => {
    cancelAnimationFrame(rafId);
    clearTimeout(scrollTimer);
    paper.removeEventListener("scroll", onUserScroll);
    paper.removeEventListener("touchstart", onUserScroll);
    paper.removeEventListener("wheel", onUserScroll);
  };

  // Click-only skip (never fires during a scroll gesture on mobile)
  function onPaperSkip() {
    if (!letterComplete) finishLetter(letterText);
  }
  paper.removeEventListener("click", paper._skipHandler);
  paper.removeEventListener("touchstart", paper._skipTouchHandler);
  paper._skipHandler = onPaperSkip;
  paper._skipTouchHandler = null;   // cleared — touchstart no longer used for skip
  paper.addEventListener("click", onPaperSkip);
}

function finishLetter(fullText) {
  if (letterComplete) return;

  // Cancel rAF loop
  if (letterInterval && letterInterval._cancel) {
    letterInterval._cancel();
  } else {
    clearInterval(letterInterval);
  }

  letterComplete = true;
  letterTextEl.textContent = fullText;
  letterCursor.style.display = "none";
  letterHint.style.opacity = "0";
  heartFillContainer.style.display = "flex";

  // Single scroll-to-bottom, no forced-layout loop
  const paper = document.getElementById("letter-paper-box");
  requestAnimationFrame(() => { paper.scrollTop = paper.scrollHeight; });
}

heartFillBtn.addEventListener("click", () => {
  if (heartFillBtn.classList.contains("filled")) return;
  synth.playChime();
  heartFillBtn.classList.add("filled");
  if (typeof confetti === "function") {
    confetti({
      particleCount: 70, spread: 70,
      colors: ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF", "#C084FC"]
    });
  }
  setTimeout(() => navigateTo("finale"), 1600);
});

// ─── 11. Grand Finale ───
let finaleReady = false;

function initFinaleSection() {
  if (finaleReady) return;
  finaleReady = true;

  const video = document.getElementById("finale-video");
  const title = document.getElementById("finale-title-text");
  title.textContent = "Love You Endlessly, " + CONFIG.recipientName + "! 💖";

  if (CONFIG.videoUrl) {
    video.src = CONFIG.videoUrl;
  } else {
    document.getElementById("finale-video-box").style.display = "none";
  }

  launchFireworks();

  // Add multilingual "I love you" floating text
  triggerEmojiShower("💖");
}

function launchFireworks() {
  if (typeof confetti !== "function") return;
  const duration = 8000;
  const end = Date.now() + duration;
  const defaults = {
    startVelocity: 25, spread: 360, ticks: 50, zIndex: 0,
    colors: ["#7C3AED", "#A67FE8", "#C9B0F5", "#C8A84B", "#E4D4FF", "#5B21B6", "#C084FC"]
  };
  const interval = setInterval(() => {
    const left = end - Date.now();
    if (left <= 0 || currentSectionId !== "finale") { clearInterval(interval); return; }
    const count = Math.max(15, 40 * (left / duration));
    confetti(Object.assign({}, defaults, { particleCount: count, origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() * 0.4 } }));
    confetti(Object.assign({}, defaults, { particleCount: count, origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() * 0.4 } }));
  }, 300);
}

// ─── 12. Replay ───
document.getElementById("replay-flow-btn").addEventListener("click", () => {
  // Reset state flags
  balloonsPopped = 0;
  balloonsReady = false;
  candlesBlown = false;
  candleGameReady = false;
  giftOpened = false;
  memoriesReady = false;
  finaleReady = false;
  letterComplete = false;
  if (letterInterval && letterInterval._cancel) letterInterval._cancel();
  else clearInterval(letterInterval);
  clearInterval(slideshowTimer);
  balloonIntervals.forEach(id => clearInterval(id));
  balloonIntervals = [];

  // Reset DOM
  document.getElementById("balloon-canvas").innerHTML = "";
  document.querySelectorAll(".flame").forEach(f => f.classList.remove("blown"));
  const cakeMsg = document.getElementById("cake-message");
  cakeMsg.textContent = "Blow the candles to make a wish!";
  cakeMsg.style.color = "";
  cakeMsg.style.fontSize = "";

  const gw = document.getElementById("clickable-gift-box");
  gw.classList.remove("opened");
  const nBtn = document.querySelector(".btn-next-gift");
  if (nBtn) nBtn.remove();
  document.getElementById("gift-instruction").textContent = "Tap the gift box to open";

  slidesWrapper.innerHTML = "";
  heartDotsBox.innerHTML = "";

  heartFillBtn.classList.remove("filled");
  heartFillContainer.style.display = "none";
  letterCursor.style.display = "inline-block";

  // Restart hero subtitle
  clearTimeout(heroTyperTimeout);
  typeHeroSubtitle();

  navigateTo("hero");
});

// ─── 13. Easter Eggs ───
// A. Triple-click hero title
const heroTitle = document.getElementById("hero-title-click");
let tripleCount = 0;
let tripleTimer = null;
heroTitle.addEventListener("click", () => {
  tripleCount++;
  clearTimeout(tripleTimer);
  tripleTimer = setTimeout(() => { tripleCount = 0; }, 1200);
  if (tripleCount >= 3) {
    tripleCount = 0;
    triggerEmojiShower("💖");
    setTimeout(() => alert(CONFIG.hiddenMessage), 300);
  }
});

// B. Long-press hero image
const heroImg = document.getElementById("hero-image-wrapper-click");
let longPressTimer = null;
function startLongPress() {
  longPressTimer = setTimeout(() => {
    triggerEmojiShower("🥰");
    alert(CONFIG.hiddenMessage);
  }, 1500);
}
function cancelLongPress() { clearTimeout(longPressTimer); }
heroImg.addEventListener("mousedown", startLongPress);
heroImg.addEventListener("mouseup", cancelLongPress);
heroImg.addEventListener("mouseleave", cancelLongPress);
heroImg.addEventListener("touchstart", startLongPress, { passive: true });
heroImg.addEventListener("touchend", cancelLongPress);
heroImg.addEventListener("touchcancel", cancelLongPress);

// C. Konami Code
const konamiSeq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIdx = 0;
window.addEventListener("keydown", e => {
  if (e.key === konamiSeq[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === konamiSeq.length) {
      konamiIdx = 0;
      triggerEmojiShower("🥰");
      alert(CONFIG.konamiCodeResponse);
    }
  } else {
    konamiIdx = 0;
  }
});

// Emoji rain shower helper
const rainContainer = document.getElementById("emoji-rain-shower");
function triggerEmojiShower(emoji) {
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "falling-emoji";
      el.textContent = emoji;
      el.style.left = Math.random() * 100 + "vw";
      el.style.animationDuration = (Math.random() * 2 + 2) + "s";
      rainContainer.appendChild(el);
      setTimeout(() => el.remove(), 4500);
    }, i * 55);
  }
}

// ─── BOOT ───
// If intro was already played (session storage), boot immediately.
// Otherwise, startAppBoot() will be called by the intro completion callback.
if (_introAlreadyDone) {
  startAppBoot();
}

}) ();
