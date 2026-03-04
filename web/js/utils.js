export const MIDNIGHT_MS = 24 * 60 * 60 * 1000;

export function parseTimestamp(ts) {
  const [hms, msStr] = ts.split(".");
  const [h, m, s]    = hms.split(":").map(Number);
  return h * 3600000 + m * 60000 + s * 1000 + (parseInt(msStr) || 0);
}

export function formatDistance(ms) {
  if (ms < 60000)      return Math.ceil(ms / 1000)   + "s";
  if (ms < 3600000)    return Math.ceil(ms / 60000)   + "m";
  return                      Math.ceil(ms / 3600000) + "h";
}

export function parseMessageTime(ts) {
  const [hms, msStr] = ts.split(".");
  const parts = hms.split(":").map(Number);
  const h = parts[0] || 0, m = parts[1] || 0, s = parts[2] || 0;
  return h * 3600000 + m * 60000 + s * 1000 + (parseInt(msStr) || 0);
}

export function formatMessageTime(ts) {
  const hms = ts.split(".")[0];
  const parts = hms.split(":");
  return `${parts[0].padStart(2,'0')}:${(parts[1]||'00').padStart(2,'0')}`;
}

export function fmtAudio(secs) {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function playSVG(color) {
  return `<svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.11336 1.72986C0.618113 2.80232 0.661613 3.79278 0.665113 4.95809C0.663863 5.19893 0.662613 5.43952 0.661363 5.68751C0.659613 6.19579 0.659863 6.70382 0.662113 7.2121C0.664113 7.98758 0.657113 8.7628 0.649113 9.53852C0.648613 10.033 0.648863 10.5277 0.649613 11.0222C0.646863 11.2532 0.643863 11.484 0.641113 11.7221C0.656113 13.1071 0.811863 13.9397 1.77361 15.025C2.73661 15.6202 3.42636 15.8514 4.53036 15.629C6.03536 15.2673 7.29486 14.5044 8.61736 13.7321C9.10361 13.4536 9.58986 13.1753 10.0764 12.897C10.3141 12.7601 10.5519 12.6229 10.7969 12.4818C11.7536 11.9396 12.7241 11.4241 13.6979 10.9127C14.6554 10.3797 15.3509 9.9089 15.6866 8.84333C15.8711 7.8083 15.8826 7.34016 15.3526 6.3896C14.3359 5.12111 12.9349 4.47739 11.5236 3.69699C11.2744 3.55662 11.0251 3.41625 10.7684 3.2717C10.0584 2.87374 9.34636 2.47948 8.63186 2.08916C8.20211 1.85348 7.77411 1.61437 7.34636 1.37525C5.03736 0.132866 3.03611 -0.592617 1.11336 1.72986Z" fill="${color}"/>
</svg>`;
}

export function pauseSVG(color) {
  return `<svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3"  y="2" width="3" height="12" rx="1" fill="${color}"/>
  <rect x="10" y="2" width="3" height="12" rx="1" fill="${color}"/>
</svg>`;
}