/**
 * CandleController
 * Modular, realistic 60 FPS interactive candle blowing controller.
 * Handles Web Audio API noise calibration, continuous air volume detection (RMS),
 * talking frequency filtering, 2D Canvas flame/spark/smoke physics, touch swipe fallback,
 * procedural blowing SFX, and keyboard interactions.
 */
class CandleController {
  constructor(options = {}) {
    this.container = options.container || document.querySelector('.cake-container');
    this.candleWrapper = options.candleWrapper || document.querySelector('.candle-wrapper');
    this.blowBtn = options.blowBtn || document.getElementById('candle-blow-btn');
    this.micIndicator = options.micIndicator || document.getElementById('mic-status-indicator');
    this.onExtinguish = options.onExtinguish || function () {};

    this.isBlown = false;
    this.micActive = false;
    this.micStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.animFrameId = null;

    // Detection settings & noise calibration
    this.ambientNoiseLevel = 0.015;
    this.calibrationSamples = [];
    this.isCalibrating = false;
    this.calibrationStartTime = 0;

    // Blow physical tracking
    this.blowIntensity = 0; // 0 to 1 smooth value
    this.blowHoldDuration = 0; // in milliseconds
    this.requiredHoldTime = 350; // ~0.35s — very forgiving, any normal blow is enough
    this.lastFrameTime = performance.now();

    // Canvas particle system (flames, smoke, sparks)
    this.canvas = null;
    this.ctx = null;
    this.candlesData = [];

    // Touch / Swipe tracking
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Procedural Blowing Audio Synth
    this.blowSoundGain = null;
    this.blowSoundNoise = null;
    this.isBlowingSoundPlaying = false;

    // Bindings
    this.updateLoop = this.updateLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
  }

  init() {
    if (!this.container) return;

    // Setup Canvas Overlay for High Performance Flame, Smoke & Sparks
    this.setupCanvas();
    this.setupCandlesData();
    this.setupControls();
    this.setupSwipeAndKeyboard();

    // Check device / permission status
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isSecure = location.protocol === 'https:' || location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    if (isMobile) {
      if (this.micIndicator) this.micIndicator.textContent = "Tap 'Blow Candle 💨' to start microphone";
      if (this.blowBtn) this.blowBtn.textContent = "Blow Candle 💨";
    } else if (isSecure) {
      this.startMicrophone();
    } else {
      this.showSwipeFallback("Microphone unavailable (requires HTTPS or local)");
    }

    // Start 60 FPS Canvas rendering & detection loop
    this.lastFrameTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.updateLoop);
  }

  setupCanvas() {
    let oldCanvas = this.container.querySelector('.candle-canvas');
    if (oldCanvas) oldCanvas.remove();

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'candle-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '20';

    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.setupCandlesData();
  }

  setupCandlesData() {
    const candleElems = this.container.querySelectorAll('.candle');
    const containerRect = this.container.getBoundingClientRect();

    // Hide default DOM flames as Canvas handles high performance flames
    const domFlames = this.container.querySelectorAll('.flame');
    domFlames.forEach(f => f.style.display = 'none');

    this.candlesData = Array.from(candleElems).map((el) => {
      const rect = el.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) - containerRect.left;
      const y = rect.top - containerRect.top;

      return {
        x: x,
        y: y,
        wickHeight: 7,
        flameSize: 1.0, // 1.0 down to 0
        extinguished: false,
        wickRedness: 0, // 1 = glowing red, 0 = black
        flickerOffset: Math.random() * 100,
        bendAngle: 0, // current angle in radians
        targetBendAngle: 0,
        smokeParticles: [],
        sparks: []
      };
    });
  }

  setupControls() {
    if (this.blowBtn) {
      this.blowBtn.onclick = (e) => {
        e.preventDefault();
        if (this.isBlown) return;
        if (!this.micActive) {
          this.startMicrophone();
        } else {
          // Fallback manual click trigger if mic is already active
          this.extinguish();
        }
      };
    }
  }

  setupSwipeAndKeyboard() {
    document.addEventListener('keydown', this.handleKeyDown);

    if (this.container) {
      this.container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      this.container.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    }
  }

  handleKeyDown(e) {
    // Extinguish on Space bar press if candle section is active & candle not blown
    if (e.code === 'Space' && !this.isBlown && this.container.offsetParent !== null) {
      e.preventDefault();
      this.extinguish();
    }
  }

  handleTouchStart(e) {
    if (this.isBlown || !e.touches[0]) return;
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  handleTouchMove(e) {
    if (this.isBlown || !e.touches[0]) return;
    const deltaX = e.touches[0].clientX - this.touchStartX;
    const deltaY = e.touches[0].clientY - this.touchStartY;

    // Detect upward or horizontal fast swipe over candle area
    if (Math.abs(deltaX) > 40 || deltaY < -40) {
      // Simulate blow effect via swipe
      this.blowIntensity = Math.min(1.0, this.blowIntensity + 0.35);
      this.blowHoldDuration += 250;
      if (this.blowHoldDuration >= this.requiredHoldTime) {
        this.extinguish();
      }
    }
  }

  startMicrophone() {
    if (this.micActive || this.isBlown) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showSwipeFallback("Microphone API not supported on this browser.");
      return;
    }

    if (this.micIndicator) this.micIndicator.textContent = "Requesting microphone permission…";

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        this.micStream = stream;
        this.micActive = true;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioCtx.createMediaStreamSource(stream);

        // High-pass filter to eliminate low frequency hums & vocal fundamentals
        // 150 Hz keeps blow energy (peaks ~200-500 Hz) while filtering mains hum
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 150;

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.4;

        source.connect(filter);
        filter.connect(this.analyser);

        // Start Ambient Noise Auto-Calibration for 1 second
        this.isCalibrating = true;
        this.calibrationSamples = [];
        this.calibrationStartTime = performance.now();

        if (this.micIndicator) {
          this.micIndicator.textContent = "🎙️ Calibrating ambient noise…";
          this.micIndicator.classList.add("mic-listening");
        }

        if (this.blowBtn) {
          this.blowBtn.textContent = "Blow into Mic 💨";
        }
      })
      .catch((err) => {
        console.warn("Microphone permission denied or error:", err);
        this.showSwipeFallback("Mic denied. Swipe candle or press Space bar to blow!");
      });
  }

  showSwipeFallback(message) {
    if (this.micIndicator) {
      this.micIndicator.textContent = message || "Swipe left/up over the candle to blow it out! 💨";
      this.micIndicator.classList.remove("mic-listening");
    }
    if (this.blowBtn) {
      this.blowBtn.textContent = "Swipe / Tap to Blow 💨";
    }
  }

  stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.micActive = false;
  }

  processAudio(now, delta) {
    if (!this.micActive || !this.analyser || this.isBlown) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);

    // RMS Volume calculation
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);

    // 1-second auto-calibration
    if (this.isCalibrating) {
      this.calibrationSamples.push(rms);
      if (now - this.calibrationStartTime >= 1000) {
        this.isCalibrating = false;
        const avgNoise = this.calibrationSamples.reduce((a, b) => a + b, 0) / (this.calibrationSamples.length || 1);
        this.ambientNoiseLevel = Math.max(0.003, avgNoise * 1.1);
        console.log('[Candle] Calibration done. Ambient:', this.ambientNoiseLevel.toFixed(4));
        if (this.micIndicator) {
          this.micIndicator.textContent = "🎤 Listening! Blow into microphone…";
        }
      }
      return;
    }

    // Dynamic threshold above ambient noise — kept low so real blows always pass
    const blowThreshold = this.ambientNoiseLevel + 0.006;

    if (rms > blowThreshold) {
      // Calculate target blow intensity scaled 0..1
      const rawIntensity = Math.min(1.0, (rms - blowThreshold) / 0.03);
      this.blowIntensity += (rawIntensity - this.blowIntensity) * 0.25;
      this.blowHoldDuration += delta;

      if (this.micIndicator) {
        const pct = Math.min(100, Math.round((this.blowHoldDuration / this.requiredHoldTime) * 100));
        this.micIndicator.textContent = `🌬️ Blowing... Keep going! (${pct}%)`;
      }

      this.playBlowSound(this.blowIntensity);

      if (this.blowHoldDuration >= this.requiredHoldTime) {
        console.log('[Candle] Hold time reached — calling extinguish()');
        this.extinguish();
      }
    } else {
      // Almost no decay — once you start blowing, progress is kept
      this.blowIntensity += (0 - this.blowIntensity) * 0.05;
      this.blowHoldDuration = Math.max(0, this.blowHoldDuration - delta * 0.08);

      this.stopBlowSound();

      if (this.micIndicator && !this.isBlown) {
        this.micIndicator.textContent = "🎤 Blow into your microphone…";
      }
    }
  }

  // Realistic Web Audio synthesized blow out sound effect
  playBlowSound(intensity) {
    if (this.isBlowingSoundPlaying || !this.audioCtx) return;
    try {
      this.isBlowingSoundPlaying = true;
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }

      this.blowSoundNoise = this.audioCtx.createBufferSource();
      this.blowSoundNoise.buffer = noiseBuffer;
      this.blowSoundNoise.loop = true;

      const lowpass = this.audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 600 + intensity * 800; // Wind blowing resonant pitch

      this.blowSoundGain = this.audioCtx.createGain();
      this.blowSoundGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      this.blowSoundGain.gain.linearRampToValueAtTime(0.15 * intensity, this.audioCtx.currentTime + 0.1);

      this.blowSoundNoise.connect(lowpass);
      lowpass.connect(this.blowSoundGain);
      this.blowSoundGain.connect(this.audioCtx.destination);
      this.blowSoundNoise.start();
    } catch (e) {}
  }

  stopBlowSound() {
    if (!this.isBlowingSoundPlaying) return;
    this.isBlowingSoundPlaying = false;
    if (this.blowSoundGain && this.audioCtx) {
      try {
        this.blowSoundGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        setTimeout(() => {
          if (this.blowSoundNoise) {
            this.blowSoundNoise.stop();
            this.blowSoundNoise.disconnect();
          }
        }, 120);
      } catch (e) {}
    }
  }

  playExtinguishSound() {
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = actx.sampleRate * 0.8;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (actx.sampleRate * 0.15));
      }

      const noise = actx.createBufferSource();
      noise.buffer = buffer;

      const filter = actx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 3.0;

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.3, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.7);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);
      noise.start();

      setTimeout(() => actx.close(), 1000);
    } catch (e) {}
  }

  extinguish() {
    if (this.isBlown) return;
    this.isBlown = true;
    console.log('[Candle] extinguish() called');
    this.stopBlowSound();
    this.stopMicrophone();

    if (this.micIndicator) {
      this.micIndicator.textContent = "✨ Wish Granted! Candle Extinguished!";
      this.micIndicator.classList.remove("mic-listening");
    }

    this.playExtinguishSound();

    // Trigger flame blow out & wick glow + smoke burst
    this.candlesData.forEach(c => {
      c.extinguished = true;
      c.wickRedness = 1.0; // bright red glow

      // Spawn initial dense smoke cloud (lasts ~2 seconds)
      for (let i = 0; i < 24; i++) {
        c.smokeParticles.push({
          x: c.x + (Math.random() - 0.5) * 6,
          y: c.y - c.wickHeight,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -1.2 - Math.random() * 1.5,
          radius: 3 + Math.random() * 4,
          opacity: 0.7 + Math.random() * 0.3,
          growth: 0.12 + Math.random() * 0.08,
          life: 0,
          maxLife: 90 + Math.random() * 40 // ~2 sec at 60 FPS
        });
      }
    });
    console.log('[Candle] Flame removed, smoke started');

    // Soft celebration confetti call
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#7C3AED', '#A67FE8', '#C9B0F5', '#C8A84B', '#E4D4FF', '#FFFFFF']
      });
    }

    // Trigger parent callback immediately
    console.log('[Candle] onExtinguish callback fired');
    this.onExtinguish();
  }

  updateLoop(timestamp) {
    const delta = Math.min(50, timestamp - this.lastFrameTime);
    this.lastFrameTime = timestamp;

    this.processAudio(timestamp, delta);
    this.renderCanvas(timestamp, delta);

    this.animFrameId = requestAnimationFrame(this.updateLoop);
  }

  renderCanvas(timestamp, delta) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const time = timestamp * 0.003;

    this.candlesData.forEach(c => {
      // 1. Draw Candle Wick
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(c.x, c.y);
      this.ctx.lineTo(c.x, c.y - c.wickHeight);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#222';
      this.ctx.stroke();

      // Wick ember glow decay when extinguished
      if (c.wickRedness > 0) {
        c.wickRedness = Math.max(0, c.wickRedness - delta * 0.0006); // decays over ~1.6s
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y - c.wickHeight, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, ${Math.round(40 * c.wickRedness)}, 0, ${c.wickRedness})`;
        this.ctx.fill();
      }
      this.ctx.restore();

      // 2. Render Flame if active
      if (!c.extinguished) {
        // Shrink flame smoothly while blowing
        if (this.blowIntensity > 0) {
          c.flameSize = Math.max(0.2, c.flameSize - delta * 0.001 * (1 + this.blowIntensity));
          c.targetBendAngle = (Math.sin(time * 5 + c.flickerOffset) * 0.4 + 0.6) * (Math.random() > 0.5 ? 1 : -1) * this.blowIntensity;
        } else {
          c.flameSize = Math.min(1.0, c.flameSize + delta * 0.002);
          c.targetBendAngle = Math.sin(time * 2 + c.flickerOffset) * 0.08;
        }

        c.bendAngle += (c.targetBendAngle - c.bendAngle) * 0.2;

        const flameWidth = 12 * c.flameSize;
        const flameHeight = (22 + Math.sin(time * 8 + c.flickerOffset) * 2) * c.flameSize;
        const flameBaseX = c.x;
        const flameBaseY = c.y - c.wickHeight;
        const tipX = flameBaseX + Math.sin(c.bendAngle) * flameHeight * 1.2;
        const tipY = flameBaseY - Math.cos(c.bendAngle) * flameHeight;

        // Ambient Flame Glow
        const glowRadius = 25 * c.flameSize;
        const glowGrad = this.ctx.createRadialGradient(flameBaseX, flameBaseY - 10, 2, flameBaseX, flameBaseY - 10, glowRadius);
        glowGrad.addColorStop(0, 'rgba(255, 200, 80, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(255, 120, 30, 0.18)');
        glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(flameBaseX, flameBaseY - 10, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Realistic Flame Body Outer Gradient
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(flameBaseX - flameWidth / 2, flameBaseY);
        this.ctx.quadraticCurveTo(flameBaseX - flameWidth, flameBaseY - flameHeight * 0.5, tipX, tipY);
        this.ctx.quadraticCurveTo(flameBaseX + flameWidth, flameBaseY - flameHeight * 0.5, flameBaseX + flameWidth / 2, flameBaseY);
        this.ctx.closePath();

        const flameGrad = this.ctx.createLinearGradient(flameBaseX, flameBaseY, tipX, tipY);
        flameGrad.addColorStop(0, '#FFF59D'); // Bright yellow core bottom
        flameGrad.addColorStop(0.3, '#FFB74D'); // Warm amber
        flameGrad.addColorStop(0.7, '#FF5722'); // Rich orange-red
        flameGrad.addColorStop(1, 'rgba(230, 74, 25, 0.2)');

        this.ctx.fillStyle = flameGrad;
        this.ctx.shadowColor = '#FF9800';
        this.ctx.shadowBlur = 12 * c.flameSize;
        this.ctx.fill();
        this.ctx.restore();

        // Inner Blue Base Core
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(flameBaseX, flameBaseY, flameWidth * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(66, 165, 245, 0.6)';
        this.ctx.fill();
        this.ctx.restore();

        // Floating Sparks
        if (Math.random() < 0.3) {
          c.sparks.push({
            x: flameBaseX + (Math.random() - 0.5) * flameWidth,
            y: flameBaseY - Math.random() * flameHeight,
            vx: (Math.random() - 0.5) * 0.8 + Math.sin(c.bendAngle) * 0.5,
            vy: -0.6 - Math.random() * 0.8,
            life: 0,
            maxLife: 20 + Math.random() * 15
          });
        }
      }

      // 3. Render Sparks
      for (let i = c.sparks.length - 1; i >= 0; i--) {
        const s = c.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const alpha = 1 - (s.life / s.maxLife);
        this.ctx.fillStyle = `rgba(255, 220, 130, ${alpha})`;
        this.ctx.fillRect(s.x, s.y, 1.5, 1.5);
        if (s.life >= s.maxLife) c.sparks.splice(i, 1);
      }

      // 4. Render Smoke Particles
      for (let i = c.smokeParticles.length - 1; i >= 0; i--) {
        const p = c.smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.life++;
        const lifeRatio = p.life / p.maxLife;
        const currentOpacity = p.opacity * Math.sin((1 - lifeRatio) * Math.PI);

        this.ctx.save();
        const smokeGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        smokeGrad.addColorStop(0, `rgba(210, 205, 225, ${currentOpacity * 0.6})`);
        smokeGrad.addColorStop(0.6, `rgba(160, 150, 185, ${currentOpacity * 0.3})`);
        smokeGrad.addColorStop(1, 'rgba(120, 110, 140, 0)');

        this.ctx.fillStyle = smokeGrad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        if (p.life >= p.maxLife) {
          c.smokeParticles.splice(i, 1);
        }
      }
    });
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.stopBlowSound();
    this.stopMicrophone();
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.canvas) this.canvas.remove();
  }
}

window.CandleController = CandleController;
