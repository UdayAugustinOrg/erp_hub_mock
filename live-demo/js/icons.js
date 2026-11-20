/* ==========================================================
   icons.js: inline SVG icon set (Lucide-style strokes).
   Input : icon name (string), optional extra class
   Output: SVG markup string
   Example: icon('search')  ->  '<svg class="i">...</svg>'
   ========================================================== */

const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  id: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M14 10h5M14 14h3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17V11M13 17V7M18 17v-4"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pinned: '<path d="M12 17v5M9 10.8V4h6v6.8l3 3.2H6z"/>',
  ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 17 21 12H3l1.6 5M12 12V3M12 3l6 5H6z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.2 17 22l-5-3-5 3 1.5-8.8"/>',
  play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  tree: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
};

function icon(name, cls = '') {
  const body = ICON_PATHS[name] || ICON_PATHS.sparkle;
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

/* Deterministic avatar colour from a name (keeps the directory visually varied) */
const AVATAR_COLORS = ['#003A96', '#1C2241', '#1F8A5B', '#9E3B1B', '#6C3FB5', '#0E7C86', '#B7791F', '#26305C'];
function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function avatar(name, size = '') {
  return `<div class="avatar ${size}" style="background:${avatarColor(name)}">${initials(name)}</div>`;
}


const ICON_EXTRA = {
  arrowur: '<path d="M7 17 17 7M8 7h9v9"/>',
  sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  sort: '<path d="M3 6h10M3 12h7M3 18h4M17 4v16M14 17l3 3 3-3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18M7 6h1v4M16.7 13.9l.7.7-2.8 2.8"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  bank: '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  anchor: '<circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/>',
  dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4z"/>',
  xcircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  checkcircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4 12 14l-3-3"/>',
  loader: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.2 16.2l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.2 7.8l2.8-2.8"/>',
  scale: '<path d="M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  pie: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
};
Object.assign(ICON_PATHS, ICON_EXTRA);


/* line-md icon set (as used by the Infinity ERP sidebar and top bar), drawn in its final, static state */
const LINE_MD = {"home":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"18\" d=\"M4.5 21.5h15\"></path><path stroke-dasharray=\"16\" d=\"M4.5 21.5v-13.5M19.5 21.5v-13.5\"></path><path stroke-dasharray=\"28\" d=\"M2 10l10 -8l10 8\"></path><path stroke-dasharray=\"26\" d=\"M9.5 21.5v-9h5v9\"></path></g>","document-list":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-dasharray=\"64\" stroke-width=\"2\" d=\"M13 3l6 6v12h-14v-18h8\"></path><path stroke-dasharray=\"14\" d=\"M12.5 3v5.5h6.5\"></path><g stroke-width=\"2\"><path stroke-dasharray=\"6\" d=\"M9 13h4\"></path><path stroke-dasharray=\"8\" d=\"M9 16h6\"></path></g></g>","check-list-3":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g stroke-dasharray=\"24\"><path d=\"M11.5 5c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path><path d=\"M11.5 12c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path><path d=\"M11.5 19c0 -0.83 0.67 -1.5 1.5 -1.5h6c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5h-6c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path></g><g stroke-dasharray=\"12\" stroke-width=\"2\"><path d=\"M3 5l2 2l4 -4\"></path><path d=\"M3 12l2 2l4 -4\"></path><path d=\"M3 19l2 2l4 -4\"></path></g></g>","briefcase":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"64\" d=\"M9 7h11c0.55 0 1 0.45 1 1v11c0 0.55 -0.45 1 -1 1h-16c-0.55 0 -1 -0.45 -1 -1v-11c0 -0.55 0.45 -1 1 -1Z\"></path><path stroke-dasharray=\"16\" d=\"M9 7v-3c0 -0.55 0.45 -1 1 -1h4c0.55 0 1 0.45 1 1v3\"></path></g>","document-report":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-dasharray=\"64\" stroke-width=\"2\" d=\"M13 3l6 6v12h-14v-18h8\"></path><path stroke-dasharray=\"14\" d=\"M12.5 3v5.5h6.5\"></path><g stroke-width=\"2\"><g stroke-dasharray=\"6\"><path d=\"M9 17v-3\"></path><path d=\"M12 17v-4\"></path></g><path stroke-dasharray=\"8\" d=\"M15 17v-5\"></path></g></g>","clipboard":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke-dasharray=\"66\" stroke-width=\"2\" d=\"M12 3h7v18h-14v-18h7Z\"></path><path stroke-dasharray=\"14\" d=\"M14.5 3.5v3h-5v-3\"></path></g>","person":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"22\" d=\"M12 5c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z\"></path><path stroke-dasharray=\"38\" d=\"M12 14c4 0 7 2 7 3v2h-14v-2c0 -1 3 -3 7 -3Z\"></path></g>","cog":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"22\" d=\"M12 9c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z\"></path><path stroke-dasharray=\"44\" d=\"M12 5.5c3.59 0 6.5 2.91 6.5 6.5c0 3.59 -2.91 6.5 -6.5 6.5c-3.59 0 -6.5 -2.91 -6.5 -6.5c0 -3.59 2.91 -6.5 6.5 -6.5Z\"></path><path d=\"M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0 0 2.62 -1.08 2.63 -1.06c0 0 1.56 2.7 1.56 2.7c0.01 0.03 -2.22 1.75 -2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41\"></path><path d=\"M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c0 0 2.25 1.73 2.23 1.75c0 0 -1.56 2.7 -1.56 2.7c-0.02 0.02 -2.63 -1.05 -2.63 -1.05c-0.34 0.31 -0.73 0.59 -1.15 0.83\"></path><path d=\"M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c0 0 -0.37 2.81 -0.4 2.81c0 0 -3.12 0 -3.12 0c-0.03 -0.01 -0.41 -2.8 -0.41 -2.8c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58\"></path><path d=\"M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c0 0 -2.62 1.08 -2.63 1.06c0 0 -1.56 -2.7 -1.56 -2.7c-0.01 -0.03 2.22 -1.75 2.22 -1.75c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41\"></path><path d=\"M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0 0 -2.25 -1.73 -2.23 -1.75c0 0 1.56 -2.7 1.56 -2.7c0.02 -0.02 2.63 1.05 2.63 1.05c0.34 -0.31 0.73 -0.59 1.15 -0.83\"></path><path d=\"M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0 0 0.37 -2.81 0.4 -2.81c0 0 3.12 0 3.12 0c0.03 0.01 0.41 2.8 0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58\"></path></g>","check-all":"<defs><mask id=\"SVG9LXuEA4n\"><g fill=\"none\" stroke-dasharray=\"24\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path stroke=\"#fff\" stroke-width=\"2\" d=\"M2 13.5l4 4l10.75 -10.75\"></path><path stroke=\"#000\" stroke-width=\"6\" d=\"M7.5 13.5l4 4l10.75 -10.75\"></path></g></mask></defs><path fill=\"currentColor\" d=\"M0 0h24v24H0z\" mask=\"url(#SVG9LXuEA4n)\"/><path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"24\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7.5 13.5l4 4l10.75 -10.75\"></path>","chat-bubble":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"70\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 19.5v-15.5c0 -0.55 0.45 -1 1 -1h16c0.55 0 1 0.45 1 1v12c0 0.55 -0.45 1 -1 1h-14.5Z\"></path>","laptop":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"50\" d=\"M12 17h-7v-10h14v10Z\"></path><path stroke-dasharray=\"20\" d=\"M3 19h18\"></path></g>","grid-3":"<g fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.5 5c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM10.5 5c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM17.5 5c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path><path d=\"M3.5 12c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM10.5 12c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM17.5 12c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path><path d=\"M3.5 19c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM10.5 19c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5ZM17.5 19c0 -0.83 0.67 -1.5 1.5 -1.5c0.83 0 1.5 0.67 1.5 1.5c0 0.83 -0.67 1.5 -1.5 1.5c-0.83 0 -1.5 -0.67 -1.5 -1.5Z\"></path></g>","chevron-right":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M16 12l-7 -7M16 12l-7 7\"></path>","menu-fold-left":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"16\" d=\"M19 5h-14\"></path><path stroke-dasharray=\"12\" d=\"M19 12h-9\"></path><path stroke-dasharray=\"16\" d=\"M19 19h-14\"></path><path stroke-dasharray=\"12\" d=\"M7 9l-3 3l3 3\"></path></g>","bell":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"4\" d=\"M12 3v2\"></path><path stroke-dasharray=\"30\" d=\"M12 5c-3.31 0 -6 2.69 -6 6l0 6c-1 0 -2 1 -2 2h8M12 5c3.31 0 6 2.69 6 6l0 6c1 0 2 1 2 2h-8\"></path><path stroke-dasharray=\"10\" d=\"M10 20c0 1.1 0.9 2 2 2c1.1 0 2 -0.9 2 -2\"></path></g>","search":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"40\" d=\"M10.76 13.24c-2.34 -2.34 -2.34 -6.14 0 -8.49c2.34 -2.34 6.14 -2.34 8.49 0c2.34 2.34 2.34 6.14 0 8.49c-2.34 2.34 -6.14 2.34 -8.49 0Z\"></path><path stroke-dasharray=\"14\" d=\"M10.5 13.5l-7.5 7.5\"></path></g>","arrow-right":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"20\" d=\"M3 12h17.5\"></path><path stroke-dasharray=\"12\" d=\"M21 12l-7 7M21 12l-7 -7\"></path></g>","plus":"<g fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M5 12h14\"></path><path d=\"M12 5v14\"></path></g>","filter":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"54\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 4h14l-5 6.5v9.5l-4 -4v-5.5Z\"></path>","list":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"4\" d=\"M4 5h0.01\"></path><path stroke-dasharray=\"14\" d=\"M8 5h12\"></path><path stroke-dasharray=\"4\" d=\"M4 10h0.01\"></path><path stroke-dasharray=\"14\" d=\"M8 10h12\"></path><path stroke-dasharray=\"4\" d=\"M4 15h0.01\"></path><path stroke-dasharray=\"14\" d=\"M8 15h12\"></path><path stroke-dasharray=\"4\" d=\"M4 20h0.01\"></path><path stroke-dasharray=\"14\" d=\"M8 20h12\"></path></g>","chevron-left":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 12l7 -7M8 12l7 7\"></path>","close":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 12l7 7M12 12l-7 -7M12 12l-7 7M12 12l7 -7\"></path>","menu":"<g fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"16\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M5 5h14\"></path><path d=\"M5 12h14\"></path><path d=\"M5 19h14\"></path></g>","menu-fold-right":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"16\" d=\"M5 5h14\"></path><path stroke-dasharray=\"12\" d=\"M5 12h9\"></path><path stroke-dasharray=\"16\" d=\"M5 19h14\"></path><path stroke-dasharray=\"12\" d=\"M17 9l3 3l-3 3\"></path></g>","heart":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"30\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9\"></path>","chat":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"70\" d=\"M3 19.5v-15.5c0 -0.55 0.45 -1 1 -1h16c0.55 0 1 0.45 1 1v12c0 0.55 -0.45 1 -1 1h-14.5Z\"></path><g stroke-dasharray=\"10\"><path d=\"M8 7h8\"></path><path d=\"M8 10h8\"></path></g><path stroke-dasharray=\"6\" d=\"M8 13h4\"></path></g>","close-small":"<g fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"18\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M7 7l10 10\"></path><path d=\"M17 7l-10 10\"></path></g>","chevron-small-down":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 15l-5 -5M12 15l5 -5\"></path>","chevron-small-right":"<path fill=\"none\" stroke=\"currentColor\" stroke-dasharray=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 12l-5 -5M15 12l-5 5\"></path>","external-link":"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path stroke-dasharray=\"42\" d=\"M11 5h-6v14h14v-6\"></path><path stroke-dasharray=\"12\" d=\"M13 11l7 -7\"></path><path stroke-dasharray=\"8\" d=\"M21 3h-6M21 3v6\"></path></g>"};
function lmd(name, cls = '') {
  return `<svg class="lmd ${cls}" viewBox="0 0 24 24" aria-hidden="true">${LINE_MD[name] || LINE_MD['document-list']}</svg>`;
}

/* Toast helper: short confirmation at the bottom of the screen */
function toast(msg, ms = 3200) {
  let el = document.querySelector('.toast');
  if (el) el.remove();
  el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${icon('checkcircle')}<span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}
