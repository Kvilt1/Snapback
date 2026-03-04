import { parseMessageTime } from './utils.js';

let lightboxList = []; 
let lightboxIdx  = 0;
let lightboxVjsPlayer = null;

export function buildMediaList(convIndex, sortedConfigs) {
  const cfg = sortedConfigs[convIndex];
  if (!cfg || !cfg.messages) return [];
  
  const list = [];
  const sortedMsgs = [...cfg.messages].sort((a, b) => parseMessageTime(a.time) - parseMessageTime(b.time));
  
  for (const m of sortedMsgs) {
    if (m.media) {
      // Normalize to array
      const items = Array.isArray(m.media) ? m.media : [m.media];
      for (const item of items) {
        if (item.mediaType !== 'audio') {
          list.push(item);
        }
      }
    }
  }
  
  return list;
}

export function loadLightboxMedia(idx) {
  const counter  = document.getElementById('lightbox-counter');
  const prev     = document.getElementById('lightbox-prev');
  const next     = document.getElementById('lightbox-next');
  const lbImg    = document.getElementById('lightbox-img');
  const vidWrap  = document.getElementById('lightbox-vid-wrap');
  const item     = lightboxList[idx];

  counter.textContent = `${idx + 1} / ${lightboxList.length}`;
  prev.style.visibility = lightboxList.length > 1 ? 'visible' : 'hidden';
  next.style.visibility = lightboxList.length > 1 ? 'visible' : 'hidden';

  if (item.mediaType === 'video') {
    lbImg.style.display = 'none';
    lbImg.src = '';
    if (lightboxVjsPlayer) { lightboxVjsPlayer.dispose(); lightboxVjsPlayer = null; }
    vidWrap.innerHTML = '';
    
    const vid = document.createElement('video');
    vid.id = 'vjs-lightbox-player';
    vid.className = 'video-js vjs-lightbox vjs-default-skin';
    vidWrap.appendChild(vid);
    
    const maxW = Math.min(window.innerWidth - 180, 1000);
    const maxH = Math.floor(window.innerHeight * 0.82);
    
    // Note: relies on global videojs script loaded in HTML
    lightboxVjsPlayer = videojs('vjs-lightbox-player', {
      controls: true, autoplay: true, preload: 'auto',
      width: maxW, height: maxH,
      sources: [{ src: item.src, type: 'video/mp4' }],
    });
    
    if (item.overlay) {
      lightboxVjsPlayer.ready(() => {
        const overlayEl = document.createElement('img');
        overlayEl.src = item.overlay;
        overlayEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:10000;';
        lightboxVjsPlayer.el().appendChild(overlayEl);
        // Re-append after fullscreen toggle — VJS can reorder inner elements when entering/exiting fullscreen
        lightboxVjsPlayer.on('fullscreenchange', () => {
          lightboxVjsPlayer.el().appendChild(overlayEl);
        });
      });
    }

    lightboxVjsPlayer.one('loadedmetadata', function() {
      let vw = this.videoWidth(), vh = this.videoHeight();
      if (!vw || !vh) {
        const v = this.el().querySelector('video');
        vw = v ? v.videoWidth : 0;
        vh = v ? v.videoHeight : 0;
      }
      if (!vw || !vh) return;
      let w = maxW, h = Math.round(vh * (maxW / vw));
      if (h > maxH) { h = maxH; w = Math.round(vw * (maxH / vh)); }
      this.width(w); this.height(h);
    });
  } else {
    if (lightboxVjsPlayer) { lightboxVjsPlayer.dispose(); lightboxVjsPlayer = null; }
    vidWrap.innerHTML = '';
    lbImg.src = item.src;
    lbImg.style.display = 'block';
  }
}

export function openLightbox(list, startIdx) {
  lightboxList = list;
  lightboxIdx  = startIdx;
  loadLightboxMedia(lightboxIdx);
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
  if (lightboxVjsPlayer) { lightboxVjsPlayer.dispose(); lightboxVjsPlayer = null; }
  document.getElementById('lightbox-vid-wrap').innerHTML = '';
  const lbImg = document.getElementById('lightbox-img');
  lbImg.style.display = 'none';
  lbImg.src = '';
}

export function navigateLightbox(dir) {
  lightboxIdx = (lightboxIdx + dir + lightboxList.length) % lightboxList.length;
  loadLightboxMedia(lightboxIdx);
}