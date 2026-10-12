/* Shared virtual-desktop helpers for the Supabase-backed KiKi tempacc. */
(() => {
  const $ = selector => document.querySelector(selector);
  const desktopItems = $('#desktopItems');
  const windowsLayer = $('#windows');
  const toast = $('#toast');
  let zIndex = 300;
  let windowOffset = 0;

  window.toastMsg = function toastMsg(message) {
    if (!toast) return;
    toast.textContent = String(message ?? '');
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };
  window.beep = function beep(frequency = 720) {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.02;
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.06);
      oscillator.stop(context.currentTime + 0.06);
      oscillator.onended = () => context.close();
    } catch {}
  };

  window.icon = function icon(name, type, x, y, onOpen) {
    const button = document.createElement('button');
    button.className = 'desktop-icon';
    button.type = 'button';
    button.style.left = `${x}px`; button.style.top = `${y}px`;
    button.dataset.name = name;
    const art = document.createElement('span');
    art.className = `icon-art ${type === 'folder' ? 'folder-art' : 'file-art'} ${type === 'link' ? 'link-art' : ''}`;
    const label = document.createElement('span'); label.className = 'icon-label'; label.textContent = name;
    button.append(art, label);
    button.addEventListener('click', event => {
      event.stopPropagation();
      document.querySelectorAll('.desktop-icon.selected').forEach(node => node.classList.remove('selected'));
      button.classList.add('selected');
    });
    button.addEventListener('dblclick', event => { event.stopPropagation(); window.beep(); onOpen?.(); });
    button.addEventListener('keydown', event => { if (event.key === 'Enter') onOpen?.(); });
    return button;
  };

  window.win = function win(title, body, wide = false) {
    const section = document.createElement('section');
    section.className = 'window tempacc-window';
    section.style.zIndex = String(++zIndex);
    if (wide) section.style.width = 'min(780px, calc(100vw - 28px))';
    const bar = document.createElement('div'); bar.className = 'window-bar';
    const controls = document.createElement('div'); controls.className = 'window-controls';
    const close = document.createElement('button'); close.className = 'window-control'; close.type = 'button';
    close.title = 'Close'; close.setAttribute('aria-label', 'Close window');
    close.addEventListener('click', () => { section.classList.add('closing'); setTimeout(() => section.remove(), 190); });
    controls.append(close);
    const heading = document.createElement('div'); heading.className = 'window-title'; heading.textContent = title;
    bar.append(controls, heading);
    const windowBody = document.createElement('div'); windowBody.className = 'window-body'; windowBody.append(body);
    section.append(bar, windowBody); windowsLayer?.append(section);
    const width = Math.min(wide ? 780 : 620, window.innerWidth - 28);
    section.style.left = `${Math.max(8, (window.innerWidth - width) / 2 + windowOffset)}px`;
    section.style.top = `${Math.max(45, (window.innerHeight - 480) / 2 + windowOffset * 0.3)}px`;
    windowOffset = (windowOffset + 24) % 96;
    section.addEventListener('pointerdown', () => { section.style.zIndex = String(++zIndex); });
    drag(section, bar);
    return section;
  };

  function drag(section, bar) {
    let pointer = null;
    bar.addEventListener('pointerdown', event => {
      if (event.target.closest('.window-control') || section.classList.contains('is-fullscreen')) return;
      pointer = { x: event.clientX, y: event.clientY, left: section.offsetLeft, top: section.offsetTop };
      try { bar.setPointerCapture(event.pointerId); } catch {}
    });
    bar.addEventListener('pointermove', event => {
      if (!pointer) return;
      section.style.left = `${Math.max(0, Math.min(window.innerWidth - section.offsetWidth, pointer.left + event.clientX - pointer.x))}px`;
      section.style.top = `${Math.max(30, Math.min(window.innerHeight - 90, pointer.top + event.clientY - pointer.y))}px`;
    });
    const stop = () => { pointer = null; };
    bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop);
  }

  const clock = $('#clock');
  function updateClock() { if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  updateClock(); setInterval(updateClock, 1000);

  const music = $('#backgroundMusic');
  const soundMenu = $('#soundMenu');
  $('#soundMenuButton')?.addEventListener('click', event => { event.stopPropagation(); soundMenu?.classList.toggle('open'); });
  $('#soundOn')?.addEventListener('click', async () => { try { await music?.play(); window.toastMsg('Background sound enabled'); } catch { window.toastMsg('Click Enable again to allow sound.'); } soundMenu?.classList.remove('open'); });
  $('#soundOff')?.addEventListener('click', () => { music?.pause(); window.toastMsg('Background sound disabled'); soundMenu?.classList.remove('open'); });
  document.addEventListener('click', event => { if (!event.target.closest('.menu-dropdown-wrap')) soundMenu?.classList.remove('open'); });
  $('#brandButton')?.addEventListener('click', () => window.toastMsg('SEIUN SECRET · KiKi tempacc'));
  document.querySelectorAll('.dock-item').forEach(item => item.addEventListener('click', () => {
    const url = item.dataset.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }));
  document.querySelectorAll('.menu-item[data-menu]').forEach(item => {
    if (item.dataset.menu !== 'Help') item.addEventListener('click', () => window.toastMsg(`${item.dataset.menu} menu`));
  });
  if (desktopItems) desktopItems.replaceChildren();
})();
