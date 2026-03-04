import { headerConfig, conversationConfig, prevDay, nextDay } from './config.js';
import { MIDNIGHT_MS, parseTimestamp } from './utils.js';
import { buildConversationItem, buildConversationView } from './ui.js';
import { initAudioPlayers } from './audio-player.js';
import { buildMediaList, openLightbox, closeLightbox, navigateLightbox } from './lightbox.js';

const vjsPlayers = {};

function captureFirstFrame(player) {
  const video = player.el().querySelector('video');
  if (!video) return;
  const draw = () => {
    if (!video.videoWidth || !video.videoHeight) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    try { player.poster(c.toDataURL('image/jpeg', 0.85)); } catch (_) {}
  };
  if (video.readyState >= 2) draw();
  else player.one('loadeddata', draw);
}

function initVideoPlayers() {
  document.querySelectorAll('video.video-js:not([data-vjs-init])').forEach(el => {
    if (!el.id) return;
    const p = videojs.getPlayer(el.id) || videojs(el.id, { controls: true, preload: 'auto' });
    if (!p) return;
    vjsPlayers[el.id] = p;
    el.setAttribute('data-vjs-init', '1');
    captureFirstFrame(p);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Setup Header
  const dateObj = new Date(headerConfig.date + "T12:00:00");
  document.getElementById("header-date").textContent = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  document.getElementById("header-conversations").textContent = `${headerConfig.conversations} conversations`;
  document.getElementById("header-messages").textContent      = `${headerConfig.messages} messages`;
  document.getElementById("header-media").textContent         = `${headerConfig.media} media`;

  // 2. Wire up day navigation
  const prevBtn = document.querySelector('[aria-label="Previous day"]');
  const nextBtn = document.querySelector('[aria-label="Next day"]');
  if (prevDay) {
    prevBtn.addEventListener('click', () => { window.location.href = prevDay; });
  } else {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '0.35';
    prevBtn.style.cursor = 'default';
  }
  if (nextDay) {
    nextBtn.addEventListener('click', () => { window.location.href = nextDay; });
  } else {
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.35';
    nextBtn.style.cursor = 'default';
  }

  const dashBtn = document.querySelector('[aria-label="Return to Dashboard"]');
  if (dashBtn) {
    dashBtn.addEventListener('click', () => { window.location.href = '../../dashboard.html'; });
  }

  // 3. Sort and Setup Conversations
  const list = document.getElementById("conversation-list");
  const sortedConfigs = [...conversationConfig].sort((a, b) =>
    (MIDNIGHT_MS - parseTimestamp(a.timestamp)) - (MIDNIGHT_MS - parseTimestamp(b.timestamp))
  );
  
  if (list) {
    list.innerHTML = sortedConfigs.map(buildConversationItem).join("\n");
  }

  // 3. Inject Conversation Views
  const rightPanel = document.getElementById("right-panel");
  sortedConfigs.forEach((cfg, i) => {
    rightPanel.insertAdjacentHTML("beforeend", buildConversationView(cfg, i));
  });

  // 4. Initialize Media
  initVideoPlayers();
  initAudioPlayers();

  // 5. Sidebar Navigation Listeners
  const noSelection  = document.getElementById("no-selection");
  const allViews     = rightPanel.querySelectorAll(".conversation-view");
  const sidebarItems = list ? list.querySelectorAll("[role='button']") : [];
  
  sidebarItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      noSelection.style.display = "none";
      allViews.forEach(v => { v.style.display = "none"; });
      const target = rightPanel.querySelector(`.conversation-view[data-index="${i}"]`);
      if (target) target.style.display = "flex";
    });
  });

  // 6. Lightbox Triggers
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.media-trigger');
    if (!trigger) return;
    Object.values(vjsPlayers).forEach(p => { try { p.pause(); } catch (_) {} });
    const convIndex = parseInt(trigger.dataset.convIndex, 10);
    const mediaSeq  = parseInt(trigger.dataset.mediaSeq, 10);
    const list = buildMediaList(convIndex, sortedConfigs);
    openLightbox(list, mediaSeq);
  });

  // 7. Lightbox UI Controls
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => navigateLightbox(1));
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
  });

  // 8. Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
    if (e.key === 'ArrowRight')  navigateLightbox(1);
  });
});