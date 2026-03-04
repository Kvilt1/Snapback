import { MIDNIGHT_MS, parseTimestamp, formatDistance, parseMessageTime, formatMessageTime } from './utils.js';

export function buildConversationItem(cfg) {
  const { name, convoType, type, isSender, bitmoji, bgColor, timestamp } = cfg;
  const distance    = MIDNIGHT_MS - parseTimestamp(timestamp);
  const isGroup    = convoType === "group";
  const iconId     = `${type.toLowerCase()}-${isSender ? "sent" : "received"}`;
  const status     = isSender ? "Opened" : "Received";
  const timeLabel  = formatDistance(distance);
  const avatarInner = isGroup
    ? `<span>${name[0].toUpperCase()}</span>`
    : `<img src="${bitmoji}" alt="${name}'s bitmoji" class="w-full h-full object-cover">`;
  const avatarBg = isGroup ? (bgColor || "transparent") : "transparent";

  return `<div class="flex items-center px-3 py-2 cursor-pointer transition-colors border-b border-[#696969] gap-2.5 hover:bg-hover-bg"
          role="button" tabindex="0" aria-label="Open conversation with ${name}">
          <div class="flex-shrink-0 relative w-[58px] h-[58px] rounded-[29px] bg-[#282828]">
            <div class="absolute left-[2px] top-[2px] w-[54px] h-[54px] overflow-hidden rounded-[27px]">
              <div class="w-full h-full flex items-center justify-center text-xl font-semibold text-white"
                style="background-color: ${avatarBg};">${avatarInner}</div>
            </div>
          </div>
          <div class="flex-1 min-w-0 h-[54px] py-1 flex flex-col justify-start gap-1"
            style="font-family: &quot;Avenir Next&quot;;">
            <div class="flex justify-center flex-col text-white text-base font-normal">${name}</div>
            <div class="flex items-center gap-1">
              <div class="flex-1 py-px flex items-center gap-[5px]">
                <div class="relative flex-shrink-0">
                  <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
                    <use href="#${iconId}"></use>
                  </svg>
                </div>
                <div class="overflow-hidden flex justify-start items-start">
                  <div class="flex justify-center flex-col text-white text-xs font-normal">${status}</div>
                </div>
                <div class="flex justify-center flex-col text-white text-xs font-bold">·</div>
                <div class="flex justify-center flex-col text-white text-xs font-normal">${timeLabel}</div>
              </div>
            </div>
          </div>
        </div>`;
}

export function renderMedia(media, convIndex, mediaSeq, color, isMultiple = false) {
  if (media.mediaType === 'audio') {
    return `<div>
      <div data-audio-src="${media.src}" data-audio-color="${color}" data-vn-pending="1"></div>
    </div>`;
  }
  const attrs = `data-conv-index="${convIndex}" data-media-seq="${mediaSeq}"`;
  
  if (media.mediaType === 'video') {
    const id = `vjs-inline-${convIndex}-${mediaSeq}`;
    if (isMultiple) {
      return `<div class="media-trigger cursor-pointer flex-shrink-0 relative" style="height:200px;" ${attrs}>
        <video id="${id}" class="video-js vjs-snapback rounded-lg"
          preload="auto" style="height:200px; width:auto; object-fit:cover;"
          data-setup='{"controls":true,"preload":"auto"}'>
          <source src="${media.src}" type="video/mp4">
        </video>
        ${media.overlay ? `<img src="${media.overlay}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" style="z-index:10;">` : ''}
      </div>`;
    } else {
      return `<div class="py-2 media-trigger cursor-pointer" ${attrs}>
        <div class="relative" style="width:220px;height:390px;">
          <video id="${id}" class="video-js vjs-snapback rounded-lg"
            preload="auto" style="width:220px;height:390px;"
            data-setup='{"controls":true,"preload":"auto"}'>
            <source src="${media.src}" type="video/mp4">
          </video>
          ${media.overlay ? `<img src="${media.overlay}" class="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg" style="z-index:10;">` : ''}
        </div>
      </div>`;
    }
  }

  // Image handling
  if (isMultiple) {
    return `<div class="media-trigger cursor-pointer flex-shrink-0" style="height:200px;" ${attrs}>
      <img src="${media.src}" alt="Media" loading="lazy"
        class="media-item rounded-lg block" style="height:200px; width:auto; object-fit:cover;">
    </div>`;
  } else {
    return `<div class="py-2 media-trigger cursor-pointer" ${attrs}>
      <img src="${media.src}" alt="Media" loading="lazy"
        class="media-item rounded-lg block" style="max-width:240px;max-height:400px;">
    </div>`;
  }
}

export function buildMessages(messages, convIndex) {
  if (!messages || messages.length === 0) {
    return '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;">No messages</div>';
  }

  messages = [...messages].sort((a, b) => parseMessageTime(a.time) - parseMessageTime(b.time));

  const YOU_COLOR = 'rgb(255, 71, 87)';
  let mediaSeq = 0;
  const GROUP_THRESHOLD_MS = 5 * 60 * 1000;
  const groups = [];
  let current  = null;

  for (const msg of messages) {
    const senderKey = msg.sender || '__you__';
    const color     = msg.sender ? msg.color : YOU_COLOR;
    const lastMsg   = current && current.msgs[current.msgs.length - 1];
    const gap       = lastMsg ? parseMessageTime(msg.time) - parseMessageTime(lastMsg.time) : Infinity;
    
    if (!current || current.senderKey !== senderKey || gap > GROUP_THRESHOLD_MS) {
      current = { senderKey, sender: msg.sender || null, color, msgs: [msg] };
      groups.push(current);
    } else {
      current.msgs.push(msg);
    }
  }

  let html = '';
  for (const group of groups) {
    const { sender, color, msgs } = group;
    const n = msgs.length;
    for (let i = 0; i < n; i++) {
      const msg     = msgs[i];
      const isFirst = i === 0;
      const isLast  = i === n - 1;
      const mt = isFirst ? 'mt-3' : 'mt-0';
      const mbExtra = isLast ? ' mb-2' : '';
      const barTop    = (n === 1 || isFirst) ? '0px'  : '-2px';
      const barBottom = (n === 1 || isLast)  ? '0px'  : '-2px';
      
      let unsavedHtml = '';
      if (msg.unsaved) {
        unsavedHtml = `<div class="inline-flex items-center gap-2 py-1 px-2.5 rounded-md border border-border text-text-tertiary text-xs italic opacity-70">Unsaved ${msg.unsaved}</div>`;
      }

      let snapOpenedHtml = '';
      if (msg.snapOpened) {
        const iconColor = msg.snapOpened === 'video' ? '#9b59b6' : '#ff4757';
        snapOpenedHtml = `<div class="inline-flex items-center gap-3 py-3 px-5 bg-bg-tertiary rounded-xl border border-border font-medium text-[15px]">
          <div class="w-6 h-6 flex items-center justify-center" style="color:${iconColor};"><div class="w-[18px] h-[18px] border-2 border-current rounded"></div></div>
          <div class="text-text-primary">Opened</div>
        </div>`;
      }

      let mediaHtml = '';
      if (msg.media) {
        // Force media into array format for easier processing
        const mediaArr = Array.isArray(msg.media) ? msg.media : [msg.media];
        const isMultiple = mediaArr.length > 1;

        if (isMultiple) {
          mediaHtml += `<div class="flex gap-2 overflow-x-auto py-2 custom-scrollbar">`;
          for (const item of mediaArr) {
            mediaHtml += renderMedia(item, convIndex, mediaSeq++, color, true);
          }
          mediaHtml += `</div>`;
        } else {
          mediaHtml += renderMedia(mediaArr[0], convIndex, mediaSeq++, color, false);
        }
      }
      
      html += `<div>
        <div class="message block ${mt} mb-0${mbExtra}">
          ${isFirst ? `<div class="font-semibold mb-0.5 mt-3" style="color:${color};font-size:13px;">${sender || 'Me'}</div>` : ''}
          <div class="relative pl-3 flex items-start gap-3 w-full" style="color:${color};">
            <div class="absolute left-0 bg-current" style="top:${barTop};bottom:${barBottom};width:2px;"></div>
            <div class="flex-1 min-w-0">
              ${msg.text ? `<div class="message-text break-words text-text-primary text-sm" style="line-height:1.4;">${msg.text}</div>` : ''}
              ${unsavedHtml}
              ${snapOpenedHtml}
              ${mediaHtml}
            </div>
            <div class="text-text-tertiary mt-0.5 whitespace-nowrap" style="font-size:11px;">${formatMessageTime(msg.time)}</div>
          </div>
        </div>
      </div>`;
    }
  }
  return html;
}

export function buildConversationView(cfg, index) {
  const msgCount = cfg.messages ? cfg.messages.length : 0;
  const bodyHtml = (cfg.messages && cfg.messages.length > 0)
    ? buildMessages(cfg.messages, index)
    : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#555;">No messages</div>';
  
  return `<div class="conversation-view flex flex-col overflow-hidden" data-index="${index}" style="display:none;flex:1;">
    <div class="px-5 py-5 bg-bg-secondary border-b border-border flex-shrink-0 z-10">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-semibold text-text-primary mb-1">${cfg.name}</h3>
          <span class="text-sm text-text-secondary">${msgCount} message${msgCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
      <div class="p-5 min-h-full">
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}