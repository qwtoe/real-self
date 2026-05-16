/**
 * Real Self - Mirror vs Reality Comparison
 * A web application that shows the difference between mirrored and real camera views.
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────
  let mediaStream = null;
  let videoElement = null;
  let animationFrameId = null;
  let currentMode = 'split'; // 'split' | 'slider'
  let sliderPosition = 0.5;
  let isDragging = false;

  // ─── DOM References ─────────────────────────────────────────────────
  const els = {
    btnStart: document.getElementById('btnStart'),
    btnSplit: document.getElementById('btnSplit'),
    btnSlider: document.getElementById('btnSlider'),
    btnSnap: document.getElementById('btnSnap'),
    splitMode: document.getElementById('splitMode'),
    sliderMode: document.getElementById('sliderMode'),
    mirrorVideo: document.getElementById('mirrorVideo'),
    realCanvas: document.getElementById('realCanvas'),
    sliderMirror: document.getElementById('sliderMirror'),
    sliderReal: document.getElementById('sliderReal'),
    sliderLine: document.getElementById('sliderLine'),
    sliderHandle: document.getElementById('sliderHandle'),
    mirrorPlaceholder: document.getElementById('mirrorPlaceholder'),
    realPlaceholder: document.getElementById('realPlaceholder'),
    snapPreview: document.getElementById('snapPreview'),
  };

  // ─── Camera ─────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      videoElement = els.mirrorVideo;
      videoElement.srcObject = mediaStream;
      videoElement.style.display = 'block';

      // Hide placeholders, show canvas
      els.mirrorPlaceholder.style.display = 'none';
      els.realPlaceholder.style.display = 'none';
      els.realCanvas.style.display = 'block';

      // Update UI
      els.btnStart.textContent = 'Camera Active';
      els.btnStart.disabled = true;
      els.btnSnap.style.display = 'inline-block';

      videoElement.onloadedmetadata = () => {
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;

        els.realCanvas.width = width;
        els.realCanvas.height = height;
        els.sliderMirror.width = width;
        els.sliderMirror.height = height;
        els.sliderReal.width = width;
        els.sliderReal.height = height;

        startRenderLoop();
      };
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Unable to access camera: ' + error.message);
    }
  }

  // ─── Rendering ──────────────────────────────────────────────────────
  function startRenderLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    renderFrame();
  }

  function renderFrame() {
    if (!videoElement || videoElement.paused || videoElement.ended) {
      animationFrameId = requestAnimationFrame(renderFrame);
      return;
    }

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    if (currentMode === 'split') {
      drawRealView(width, height);
    } else if (currentMode === 'slider') {
      drawSliderMirror(width, height);
      drawSliderReal(width, height);
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  function drawRealView(width, height) {
    const ctx = els.realCanvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
  }

  function drawSliderMirror(width, height) {
    const ctx = els.sliderMirror.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, width, height);
    ctx.restore();
  }

  function drawSliderReal(width, height) {
    const ctx = els.sliderReal.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoElement, 0, 0, width, height);
  }

  // ─── Mode Switching ─────────────────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;

    els.btnSplit.classList.toggle('active', mode === 'split');
    els.btnSlider.classList.toggle('active', mode === 'slider');
    els.splitMode.style.display = mode === 'split' ? 'flex' : 'none';
    els.sliderMode.style.display = mode === 'slider' ? 'block' : 'none';

    updateSlider();
  }

  // ─── Slider Interaction ─────────────────────────────────────────────
  function updateSlider() {
    const percentage = sliderPosition * 100;
    els.sliderMirror.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    els.sliderLine.style.left = percentage + '%';
    els.sliderHandle.style.left = percentage + '%';
  }

  function handleSliderMove(clientX) {
    const rect = els.sliderMode.getBoundingClientRect();
    const raw = (clientX - rect.left) / rect.width;
    sliderPosition = Math.max(0, Math.min(1, raw));
    updateSlider();
  }

  // ─── Snapshot ───────────────────────────────────────────────────────
  function takeSnapshot() {
    if (!videoElement) return;

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    // Mirrored snapshot
    const mirrorCanvas = document.createElement('canvas');
    mirrorCanvas.width = width;
    mirrorCanvas.height = height;
    const mCtx = mirrorCanvas.getContext('2d');
    mCtx.save();
    mCtx.translate(width, 0);
    mCtx.scale(-1, 1);
    mCtx.drawImage(videoElement, 0, 0, width, height);
    mCtx.restore();

    // Real snapshot
    const realCanvas = document.createElement('canvas');
    realCanvas.width = width;
    realCanvas.height = height;
    const rCtx = realCanvas.getContext('2d');
    rCtx.drawImage(videoElement, 0, 0, width, height);

    // Render preview
    els.snapPreview.innerHTML = '';
    els.snapPreview.classList.add('visible');

    const snapshots = [
      { canvas: mirrorCanvas, label: 'Mirrored (what you are used to)' },
      { canvas: realCanvas, label: 'Real (how others see you)' },
    ];

    snapshots.forEach(({ canvas, label }) => {
      const item = document.createElement('div');
      item.className = 'snap-item';
      item.appendChild(canvas);

      const caption = document.createElement('p');
      caption.textContent = label;
      item.appendChild(caption);

      els.snapPreview.appendChild(item);
    });
  }

  // ─── Event Listeners ────────────────────────────────────────────────
  els.btnStart.addEventListener('click', startCamera);
  els.btnSplit.addEventListener('click', () => setMode('split'));
  els.btnSlider.addEventListener('click', () => setMode('slider'));
  els.btnSnap.addEventListener('click', takeSnapshot);

  // Slider drag
  els.sliderMode.addEventListener('mousedown', () => (isDragging = true));
  els.sliderMode.addEventListener('touchstart', () => (isDragging = true), { passive: true });

  window.addEventListener('mouseup', () => (isDragging = false));
  window.addEventListener('touchend', () => (isDragging = false));

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    handleSliderMove(e.touches[0].clientX);
  }, { passive: true });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 's' || e.key === 'S') {
      if (!els.btnStart.disabled) startCamera();
    }
    if (e.key === '1') setMode('split');
    if (e.key === '2') setMode('slider');
    if ((e.key === 'p' || e.key === 'P') && videoElement) {
      takeSnapshot();
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  });
})();
