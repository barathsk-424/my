// Birthday Surprise App Logic — "Love, Laughter & Forever"
(function () {
  "use strict";

  // ─── 1. Audio Engine (Procedural Synthesizer for SFX) ───
  class SoundSynth {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    playPop() {
      try {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (_) {}
    }

    playBlow() {
      try {
        this.init();
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 400;
        filter.Q.value = 1.0;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
      } catch (_) {}
    }

    playChime() {
      try {
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          const t = now + idx * 0.08;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
      } catch (_) {}
    }

    playClick() {
      try {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.02);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      } catch (_) {}
    }
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
    synth.init();
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
      }).catch(() => {});
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
      }).catch(() => {});
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
  const heartSymbols = ["❤️", "💖", "💕", "🌸", "✨", "💝"];

  function spawnFloatingHeart() {
    if (document.querySelectorAll(".floating-heart").length > 12) return;
    const el = document.createElement("div");
    el.className = "floating-heart";
    el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = (Math.random() * 1.2 + 0.8) + "rem";
    const dur = Math.random() * 5 + 8;
    el.style.animationDuration = dur + "s";
    bgHeartsContainer.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 500);
  }
  setInterval(spawnFloatingHeart, 1800);

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
      case "balloons": initBalloonsGame(); break;
      case "cake":     initCandleGame(); break;
      case "memories": initMemoriesSlideshow(); break;
      case "letter":   startTypewriterLetter(); break;
      case "finale":   initFinaleSection(); break;
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
    synth.init();
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

    const colors = ["#FFD1DC", "#FFB3C6", "#FF6F61", "#FFA07A", "#FFC6FF", "#FFADAD", "#FFD2FF", "#FFE5EC"];

    CONFIG.balloonKeywords.forEach((word, index) => {
      const balloon = document.createElement("div");
      balloon.className = "balloon";
      balloon.setAttribute("role", "button");
      balloon.setAttribute("aria-label", "Pop balloon");

      const bgColor = colors[index % colors.length];
      balloon.style.backgroundColor = bgColor;
      balloon.style.color = bgColor;

      // Spread balloons horizontally
      const leftPct = 8 + (index * (84 / totalBalloons)) + (Math.random() * 4);
      balloon.style.left = leftPct + "%";

      // Stagger entry from below
      let currentBottom = -120 - index * 90;
      balloon.style.bottom = currentBottom + "px";

      // Sway phase offset
      balloon.style.animationDelay = (Math.random() * 2) + "s";

      const speed = 0.8 + Math.random() * 0.8;

      const floatId = setInterval(() => {
        if (currentSectionId !== "balloons") { clearInterval(floatId); return; }
        currentBottom += speed;
        balloon.style.bottom = currentBottom + "px";
        if (currentBottom > window.innerHeight + 50) {
          currentBottom = -150;
        }
      }, 16);
      balloonIntervals.push(floatId);

      // String
      const string = document.createElement("div");
      string.className = "balloon-string";
      balloon.appendChild(string);

      // Pop handler
      function handlePop(e) {
        e.stopPropagation();
        e.preventDefault();
        clearInterval(floatId);
        synth.playPop();

        // Confetti at balloon position
        const rect = balloon.getBoundingClientRect();
        if (typeof confetti === "function") {
          confetti({
            particleCount: 25,
            spread: 55,
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight
            },
            colors: [bgColor, "#FFD700", "#FF6F61"]
          });
        }

        // Show keyword text
        const popText = document.createElement("div");
        popText.className = "balloon-pop-text";
        popText.textContent = word;
        popText.style.left = rect.left + "px";
        popText.style.top = rect.top + "px";
        popText.style.position = "fixed";
        document.body.appendChild(popText);
        setTimeout(() => popText.remove(), 2000);

        balloon.remove();
        balloonsPopped++;
        countEl.textContent = balloonsPopped;

        if (balloonsPopped >= totalBalloons) {
          // Clear all remaining float intervals
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

      canvas.appendChild(balloon);
    });
  }

  // ─── 7. Candle Blowing Mini-Game ───
  let candlesBlown = false;
  let candleGameReady = false;
  let micStream = null;
  let micCheckInterval = null;

  function initCandleGame() {
    if (candleGameReady) return;
    candleGameReady = true;

    const blowBtn = document.getElementById("candle-blow-btn");
    const micIndicator = document.getElementById("mic-status-indicator");

    // Fallback blow button
    blowBtn.addEventListener("click", () => extinguishCandles());

    // Try mic (only works on https or localhost, not file://)
    const isSecure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";

    if (isSecure && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        micStream = stream;
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        micIndicator.textContent = "🎤 Blow into your microphone!";

        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);

        micCheckInterval = setInterval(() => {
          if (currentSectionId !== "cake" || candlesBlown) {
            clearInterval(micCheckInterval);
            stopMicrophone();
            return;
          }
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < bufLen; i++) sum += data[i];
          if (sum / bufLen > 55) extinguishCandles();
        }, 100);
      }).catch(() => {
        micIndicator.textContent = "Tap the button to blow out the candles!";
      });
    } else {
      micIndicator.textContent = "Tap the button to blow out the candles!";
    }
  }

  function stopMicrophone() {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
  }

  function extinguishCandles() {
    if (candlesBlown) return;
    candlesBlown = true;
    synth.playBlow();
    stopMicrophone();

    const flames = document.querySelectorAll(".flame");
    flames.forEach((flame, i) => {
      setTimeout(() => flame.classList.add("blown"), i * 200);
    });

    setTimeout(() => {
      synth.playChime();
      if (typeof confetti === "function") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.55 } });
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
      confetti({ particleCount: 60, spread: 70 });
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
    let charIdx = 0;

    clearInterval(letterInterval);

    letterInterval = setInterval(() => {
      if (charIdx < letterText.length) {
        if (Math.random() > 0.5) synth.playClick();
        letterTextEl.textContent += letterText.charAt(charIdx);
        charIdx++;
        // Scroll parchment to bottom
        const paper = document.getElementById("letter-paper-box");
        paper.scrollTop = paper.scrollHeight;
      } else {
        finishLetter(letterText);
      }
    }, 45);

    // Click to skip
    function onPaperClick() {
      if (!letterComplete) {
        finishLetter(letterText);
      }
    }
    const paper = document.getElementById("letter-paper-box");
    paper.removeEventListener("click", paper._skipHandler);
    paper._skipHandler = onPaperClick;
    paper.addEventListener("click", onPaperClick);
  }

  function finishLetter(fullText) {
    if (letterComplete) return;
    clearInterval(letterInterval);
    letterComplete = true;
    letterTextEl.textContent = fullText;
    letterCursor.style.display = "none";
    letterHint.style.opacity = "0";
    heartFillContainer.style.display = "flex";
    // Scroll to bottom
    const paper = document.getElementById("letter-paper-box");
    paper.scrollTop = paper.scrollHeight;
  }

  heartFillBtn.addEventListener("click", () => {
    if (heartFillBtn.classList.contains("filled")) return;
    synth.playChime();
    heartFillBtn.classList.add("filled");
    if (typeof confetti === "function") {
      confetti({ particleCount: 70, spread: 70 });
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
    const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 0 };

    const interval = setInterval(() => {
      const left = end - Date.now();
      if (left <= 0 || currentSectionId !== "finale") {
        clearInterval(interval);
        return;
      }
      const count = Math.max(15, 40 * (left / duration));
      confetti(Object.assign({}, defaults, {
        particleCount: count,
        origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() * 0.4 }
      }));
      confetti(Object.assign({}, defaults, {
        particleCount: count,
        origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() * 0.4 }
      }));
    }, 300);
  }

  // ─── 12. Replay ───
  document.getElementById("replay-flow-btn").addEventListener("click", () => {
    synth.init();

    // Reset state flags
    balloonsPopped = 0;
    balloonsReady = false;
    candlesBlown = false;
    candleGameReady = false;
    giftOpened = false;
    memoriesReady = false;
    finaleReady = false;
    letterComplete = false;
    clearInterval(letterInterval);
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
  const konamiSeq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
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
  // Loader exit after assets settle
  setTimeout(() => {
    const loader = document.getElementById("loader-screen");
    if (!loader) return;
    loader.style.opacity = "0";
    setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1000);
    navigateTo("hero");
    typeHeroSubtitle();
  }, 2200);

})();
