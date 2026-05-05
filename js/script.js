const c3dTrack = $('#c3dTrack');
const c3dDots  = $('#c3dDots');
const c3dPrev  = $('#c3dPrev');
const c3dNext  = $('#c3dNext');
const c3dCount = $('#c3dCounter');

if (c3dTrack) {
  const configuredImages = (c3dTrack.dataset.images || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let c3dImages = configuredImages.length ? configuredImages : [
    'img/carrusel/1.jpeg',
    'img/carrusel/2.jpeg',
    'img/carrusel/3.jpeg',
    'img/carrusel/4.jpeg',
    'img/carrusel/5.png',
    'img/carrusel/6.png'
  ];
  let c3dCurrent = 0;
  let c3dTimer   = null;
  let c3dInitialized = false;
  const C3D_INTERVAL = isMobile() ? 6000 : 5000;
  const SWIPE_THRESHOLD = isTouch ? 30 : 50;
  const c3dSection = document.getElementById('carrusel3d');

  const buildC3D = () => {
    if (!c3dImages.length) return;

    const firstImage = new Image();
    firstImage.decoding = 'async';
    firstImage.src = c3dImages[0];

    c3dImages.forEach((url, i) => {
      const slide = document.createElement('div');
      slide.className = 'c3d__slide c3d__slide--hidden';
      slide.dataset.index = i;

      const img = document.createElement('img');
      if (i === 0) {
        img.src = url;
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'high');
      } else {
        img.dataset.src = url;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'low');
      }
      img.alt = `Evento Tarin ${i + 1}`;
      img.draggable = false;
      slide.appendChild(img);

      slide.addEventListener('click', () => {
        if (parseInt(slide.dataset.index) !== c3dCurrent) {
          goToC3D(parseInt(slide.dataset.index));
        }
      });

      c3dTrack.appendChild(slide);
    });

    c3dCurrent = c3dImages.length > 2 ? 1 : 0;

    if (c3dDots) {
      c3dImages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'c3d__dot';
        dot.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
        dot.addEventListener('click', () => goToC3D(i));
        c3dDots.appendChild(dot);
      });
    }

    updateC3D();
    startC3DAutoplay();
  };

  const updateC3D = () => {
    const slides = c3dTrack.querySelectorAll('.c3d__slide');
    const dots   = c3dDots ? c3dDots.querySelectorAll('.c3d__dot') : [];
    const total  = slides.length;

    slides.forEach((slide, i) => {
      slide.className = 'c3d__slide';

      const raw  = ((i - c3dCurrent) % total + total) % total;
      const diff = raw > total / 2 ? raw - total : raw;

      if (diff === 0)       slide.classList.add('c3d__slide--active');
      else if (diff === 1)  slide.classList.add('c3d__slide--next');
      else if (diff === -1) slide.classList.add('c3d__slide--prev');
      else if (diff === 2)  slide.classList.add('c3d__slide--far-next');
      else if (diff === -2) slide.classList.add('c3d__slide--far-prev');
      else                  slide.classList.add('c3d__slide--hidden');

      if (Math.abs(diff) <= 1) {
        const img = slide.querySelector('img');
        if (img && img.dataset.src && !img.src) {
          img.src = img.dataset.src;
          img.decoding = 'async';
          delete img.dataset.src;
        }
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('c3d__dot--active', i === c3dCurrent);
    });

    if (c3dCount) {
      c3dCount.innerHTML = `<span>${c3dCurrent + 1}</span> / ${total}`;
    }
  };

  const goToC3D = idx => {
    if (!c3dImages.length) return;
    c3dCurrent = ((idx % c3dImages.length) + c3dImages.length) % c3dImages.length;
    updateC3D();
    resetC3DAutoplay();
  };

  const c3dGoPrev = () => goToC3D(c3dCurrent - 1);
  const c3dGoNext = () => goToC3D(c3dCurrent + 1);

  const startC3DAutoplay = () => {
    if (c3dTimer || c3dImages.length < 2) return;
    c3dTimer = setInterval(c3dGoNext, C3D_INTERVAL);
  };
  const stopC3DAutoplay  = () => {
    if (!c3dTimer) return;
    clearInterval(c3dTimer);
    c3dTimer = null;
  };
  const resetC3DAutoplay = () => { stopC3DAutoplay(); startC3DAutoplay(); };

  if (c3dPrev) c3dPrev.addEventListener('click', c3dGoPrev);
  if (c3dNext) c3dNext.addEventListener('click', c3dGoNext);

  const c3dKeyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.addEventListener('keydown', c3dKeyHandler);
      } else {
        document.removeEventListener('keydown', c3dKeyHandler);
      }
    });
  }, { threshold: 0.3 });

  const c3dKeyHandler = e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); c3dGoPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); c3dGoNext(); }
  };

  if (c3dSection) c3dKeyObs.observe(c3dSection);

  const c3dEl = $('.c3d');
  if (c3dEl) {
    c3dEl.addEventListener('mouseenter', stopC3DAutoplay);
    c3dEl.addEventListener('mouseleave', startC3DAutoplay);
  }

  let dragX0 = 0, dragging = false;

  c3dTrack.addEventListener('pointerdown', e => {
    dragX0 = e.clientX;
    dragging = true;
    c3dTrack.setPointerCapture(e.pointerId);
    c3dTrack.style.cursor = 'grabbing';
  });

  c3dTrack.addEventListener('pointermove', e => {
    if (dragging) e.preventDefault();
  });

  c3dTrack.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    c3dTrack.style.cursor = '';
    const diff = e.clientX - dragX0;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      diff > 0 ? c3dGoPrev() : c3dGoNext();
    }
  });

  c3dTrack.addEventListener('pointercancel', () => {
    dragging = false;
    c3dTrack.style.cursor = '';
  });

  c3dTrack.addEventListener('touchmove', e => {
    if (dragging) e.preventDefault();
  }, { passive: false });

  const initC3D = () => {
    if (c3dInitialized) return;
    c3dInitialized = true;
    buildC3D();
  };

  if (c3dSection && 'IntersectionObserver' in window) {
    const c3dLoadObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initC3D();
          c3dLoadObs.disconnect();
        }
      });
    }, { rootMargin: '350px 0px', threshold: 0.01 });

    c3dLoadObs.observe(c3dSection);
  } else {
    initC3D();
  }
}