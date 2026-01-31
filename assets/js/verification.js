(function() {
  const STORAGE_KEY = 'foxfarm_verified';
  const REDIRECT_URL = 'index.html';

  const thumb = document.getElementById('slider-thumb');
  const track = thumb.closest('.slider-track');
  const label = document.getElementById('slider-label');

  let isDragging = false;
  let startX = 0;
  let startLeft = 0;

  const trackWidth = track.offsetWidth;
  const thumbWidth = thumb.offsetWidth;
  const maxLeft = trackWidth - thumbWidth - 8;

  function setThumbPosition(left) {
    const clamped = Math.max(4, Math.min(left, maxLeft));
    thumb.style.left = clamped + 'px';
    return clamped >= maxLeft - 5;
  }

  function onSuccess() {
    track.classList.add('verified');
    thumb.classList.add('success');
    thumb.querySelector('.slider-arrow').textContent = '✓';
    label.textContent = 'Accès autorisé !';

    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setTimeout(function() {
      const returnUrl = new URLSearchParams(window.location.search).get('return') || REDIRECT_URL;
      window.location.href = returnUrl;
    }, 600);
  }

  function handleMove(clientX) {
    if (!isDragging) return;
    const delta = clientX - startX;
    const newLeft = startLeft + delta;
    if (setThumbPosition(newLeft)) {
      thumb.style.cursor = 'default';
      isDragging = false;
      onSuccess();
    }
  }

  thumb.addEventListener('mousedown', function(e) {
    if (track.classList.contains('verified')) return;
    isDragging = true;
    startX = e.clientX;
    startLeft = parseInt(thumb.style.left || '4', 10);
    track.classList.add('dragging');
  });

  document.addEventListener('mousemove', function(e) {
    handleMove(e.clientX);
  });

  document.addEventListener('mouseup', function() {
    if (isDragging && !track.classList.contains('verified')) {
      isDragging = false;
      track.classList.remove('dragging');
      thumb.style.left = '4px';
    }
  });

  document.addEventListener('mouseleave', function() {
    if (isDragging && !track.classList.contains('verified')) {
      isDragging = false;
      track.classList.remove('dragging');
      thumb.style.left = '4px';
    }
  });

  thumb.addEventListener('touchstart', function(e) {
    if (track.classList.contains('verified')) return;
    e.preventDefault();
    isDragging = true;
    startX = e.touches[0].clientX;
    startLeft = parseInt(thumb.style.left || '4', 10);
    track.classList.add('dragging');
  }, { passive: false });

  document.addEventListener('touchmove', function(e) {
    if (e.touches.length) handleMove(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchend', function() {
    if (isDragging && !track.classList.contains('verified')) {
      isDragging = false;
      track.classList.remove('dragging');
      thumb.style.left = '4px';
    }
  });

  document.addEventListener('touchcancel', function() {
    if (isDragging && !track.classList.contains('verified')) {
      isDragging = false;
      track.classList.remove('dragging');
      thumb.style.left = '4px';
    }
  });
})();
