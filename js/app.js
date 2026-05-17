/**
 * Real Self - Mirror vs Reality Comparison
 * A web application that shows the difference between mirrored and real camera views.
 */

(function () {
  'use strict';

  // ─── Internationalization ───────────────────────────────────────────
  const i18n = {
    en: {
      appTitle: 'Real Self',
      appSubtitle: 'Compare your mirrored reflection with how the world actually sees you.',
      btnStart: 'Start Camera',
      btnSplit: 'Side by Side',
      btnSlider: 'Slider',
      btnSnap: 'Take Snapshot',
      labelMirror: 'Mirrored',
      labelReal: 'Reality',
      labelMirrorShort: 'Mirrored',
      labelRealShort: 'Reality',
      placeholderInactive: 'Camera inactive',
      footerMirror: 'Horizontally flipped (default selfie view)',
      footerReal: 'Unflipped (how others see you)',
      appFooter: 'All processing happens locally in your browser. No images are uploaded.',
      snapMirror: 'Mirrored (what you are used to)',
      snapReal: 'Real (how others see you)',
      cameraActive: 'Camera Active',
      btnStarting: 'Starting...',
      cameraError: 'Unable to access camera',
      btnRetry: 'Try Again',
      btnDownload: 'Download',
      alertCameraError: 'Unable to access camera: ',
      hintShortcuts: 'Shortcuts',
      hintStart: 'Start',
      hintSplit: 'Split',
      hintSlider: 'Slider',
      hintSnap: 'Snap',
    },
    zh: {
      appTitle: '真实自我',
      appSubtitle: '对比你习惯的镜像，和别人眼中真实的你。',
      btnStart: '开启摄像头',
      btnSplit: '并排对比',
      btnSlider: '滑动对比',
      btnSnap: '截图对比',
      labelMirror: '镜像',
      labelReal: '真实',
      labelMirrorShort: '镜像',
      labelRealShort: '真实',
      placeholderInactive: '摄像头未开启',
      footerMirror: '水平翻转（自拍默认效果）',
      footerReal: '未翻转（别人眼中的你）',
      appFooter: '所有处理均在浏览器本地完成，不会上传任何图像。',
      snapMirror: '镜像（你习惯看到的自己）',
      snapReal: '真实（别人眼中的你）',
      cameraActive: '摄像头已开启',
      btnStarting: '正在开启...',
      cameraError: '无法访问摄像头',
      btnRetry: '重试',
      btnDownload: '下载',
      alertCameraError: '无法访问摄像头：',
      hintShortcuts: '快捷键',
      hintStart: '开启',
      hintSplit: '并排',
      hintSlider: '滑动',
      hintSnap: '截图',
    },
  };

  let currentLang = localStorage.getItem('realself-lang') || 'en';

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('realself-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      }
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update dynamic elements if camera is already active
    if (els.btnStart.disabled) {
      els.btnStart.textContent = i18n[lang].cameraActive;
    }
  }

  // ─── State ──────────────────────────────────────────────────────────
  let mediaStream = null;
  let videoElement = null;     // visible video for split-mode display
  let hiddenVideo = null;      // off-screen video for canvas drawing
  let animationFrameId = null;
  let currentMode = 'split'; // 'split' | 'slider'
  let sliderPosition = 0.5;
  let isDragging = false;
  let isDraggingHandleVertical = false;
  let handleVerticalPosition = 0.5;

  // ─── DOM References ─────────────────────────────────────────────────
  const els = {
    btnStart: document.getElementById('btnStart'),
    btnSplit: document.getElementById('btnSplit'),
    btnSlider: document.getElementById('btnSlider'),
    btnSnap: document.getElementById('btnSnap'),
    btnRetry: document.getElementById('btnRetry'),
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
    mirrorError: document.getElementById('mirrorError'),
    realError: document.getElementById('realError'),
    snapPreview: document.getElementById('snapPreview'),
  };

  // ─── Camera ─────────────────────────────────────────────────────────
  function showCameraError(message) {
    els.mirrorPlaceholder.style.display = 'none';
    els.realPlaceholder.style.display = 'none';
    els.mirrorError.style.display = 'flex';
    els.realError.style.display = 'flex';
    els.btnStart.textContent = i18n[currentLang].btnStart;
    els.btnStart.disabled = false;
  }

  function clearCameraError() {
    els.mirrorError.style.display = 'none';
    els.realError.style.display = 'none';
  }

  async function startCamera() {
    clearCameraError();
    els.btnStart.textContent = i18n[currentLang].btnStarting;
    els.btnStart.disabled = true;

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

      // Create an off-screen video that remains "rendered" for canvas drawImage
      hiddenVideo = document.createElement('video');
      hiddenVideo.srcObject = mediaStream;
      hiddenVideo.autoplay = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.muted = true;
      hiddenVideo.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;left:-9999px;';
      document.body.appendChild(hiddenVideo);
      hiddenVideo.play().catch(() => {});

      // Hide placeholders, show canvas
      els.mirrorPlaceholder.style.display = 'none';
      els.realPlaceholder.style.display = 'none';
      els.realCanvas.style.display = 'block';

      // Update UI
      els.btnStart.textContent = i18n[currentLang].cameraActive;
      els.btnStart.disabled = true;
      els.btnSnap.style.display = 'inline-block';

      hiddenVideo.onloadedmetadata = () => {
        const width = hiddenVideo.videoWidth;
        const height = hiddenVideo.videoHeight;

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
      showCameraError(error.message);
    }
  }

  // ─── Rendering ──────────────────────────────────────────────────────
  function startRenderLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    renderFrame();
  }

  function renderFrame() {
    if (!hiddenVideo || hiddenVideo.paused || hiddenVideo.ended || hiddenVideo.readyState < 2) {
      animationFrameId = requestAnimationFrame(renderFrame);
      return;
    }

    const width = hiddenVideo.videoWidth;
    const height = hiddenVideo.videoHeight;

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
    ctx.drawImage(hiddenVideo, 0, 0, width, height);
  }

  function drawSliderMirror(width, height) {
    const ctx = els.sliderMirror.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(hiddenVideo, 0, 0, width, height);
    ctx.restore();
  }

  function drawSliderReal(width, height) {
    const ctx = els.sliderReal.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(hiddenVideo, 0, 0, width, height);
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
    // Mirror canvas shows left portion (flipped)
    els.sliderMirror.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    // Real canvas shows right portion (unflipped) — this is the key fix
    els.sliderReal.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    els.sliderLine.style.left = percentage + '%';
    els.sliderHandle.style.left = percentage + '%';
    els.sliderHandle.style.top = (handleVerticalPosition * 100) + '%';
  }

  function handleSliderMove(clientX) {
    const rect = els.sliderMode.getBoundingClientRect();
    const raw = (clientX - rect.left) / rect.width;
    sliderPosition = Math.max(0, Math.min(1, raw));
    updateSlider();
  }

  function handleHandleVerticalMove(clientY) {
    const rect = els.sliderMode.getBoundingClientRect();
    const raw = (clientY - rect.top) / rect.height;
    handleVerticalPosition = Math.max(0, Math.min(1, raw));
    updateSlider();
  }

  // ─── Snapshot ───────────────────────────────────────────────────────
  function takeSnapshot() {
    if (!hiddenVideo) return;

    const width = hiddenVideo.videoWidth;
    const height = hiddenVideo.videoHeight;

    // Mirrored snapshot
    const mirrorCanvas = document.createElement('canvas');
    mirrorCanvas.width = width;
    mirrorCanvas.height = height;
    const mCtx = mirrorCanvas.getContext('2d');
    mCtx.save();
    mCtx.translate(width, 0);
    mCtx.scale(-1, 1);
    mCtx.drawImage(hiddenVideo, 0, 0, width, height);
    mCtx.restore();

    // Real snapshot
    const realCanvas = document.createElement('canvas');
    realCanvas.width = width;
    realCanvas.height = height;
    const rCtx = realCanvas.getContext('2d');
    rCtx.drawImage(hiddenVideo, 0, 0, width, height);

    // Render preview
    els.snapPreview.innerHTML = '';
    els.snapPreview.classList.add('visible');

    const snapshots = [
      { canvas: mirrorCanvas, label: i18n[currentLang].snapMirror },
      { canvas: realCanvas, label: i18n[currentLang].snapReal },
    ];

    snapshots.forEach(({ canvas, label }) => {
      const item = document.createElement('div');
      item.className = 'snap-item';
      item.appendChild(canvas);

      const caption = document.createElement('p');
      caption.textContent = label;
      item.appendChild(caption);

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn btn-download';
      downloadBtn.textContent = i18n[currentLang].btnDownload;
      downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        const safeLabel = label.replace(/\s+/g, '-').replace(/[()]/g, '');
        link.download = `realself-${safeLabel}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
      item.appendChild(downloadBtn);

      els.snapPreview.appendChild(item);
    });
  }

  // ─── Event Listeners ────────────────────────────────────────────────
  els.btnStart.addEventListener('click', startCamera);
  els.btnSplit.addEventListener('click', () => setMode('split'));
  els.btnSlider.addEventListener('click', () => setMode('slider'));
  els.btnSnap.addEventListener('click', takeSnapshot);
  els.btnRetry.addEventListener('click', startCamera);

  // Language switch
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Slider drag
  els.sliderMode.addEventListener('mousedown', () => (isDragging = true));
  els.sliderMode.addEventListener('touchstart', () => (isDragging = true), { passive: true });

  // Handle vertical drag
  els.sliderHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isDraggingHandleVertical = true;
  });
  els.sliderHandle.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    isDraggingHandleVertical = true;
  }, { passive: true });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    isDraggingHandleVertical = false;
  });
  window.addEventListener('touchend', () => {
    isDragging = false;
    isDraggingHandleVertical = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingHandleVertical) {
      handleHandleVerticalMove(e.clientY);
      return;
    }
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingHandleVertical) {
      handleHandleVerticalMove(e.touches[0].clientY);
      return;
    }
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
    if ((e.key === 'p' || e.key === 'P') && hiddenVideo) {
      takeSnapshot();
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (hiddenVideo) {
      hiddenVideo.pause();
      hiddenVideo.remove();
    }
  });

  // Initialize language on load
  setLanguage(currentLang);

  // Auto-start camera on page load
  // Note: Browsers may block getUserMedia without user interaction,
  // so this is a best-effort; the Start Camera button remains as fallback.
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    startCamera().catch(() => {
      // Silently fail; user can click Start Camera manually
    });
  }
})();
