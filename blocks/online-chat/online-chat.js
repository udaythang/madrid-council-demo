/**
 * Online chat (Línea Madrid): the floating "LINEA MADRID / CHAT ONLINE / ASISTENTE VIRTUAL"
 * speech bubble from www.madrid.es, fixed in the lower-right corner of the viewport.
 *
 * Authored content: one cell with a link to where the chat runs, and optionally the
 * bubble image (otherwise the block's own copy of Madrid's graphic is used).
 * The link text becomes extra screen-reader context ("abre ... en una pestaña nueva").
 * Without a link the bubble is informational only (no click target).
 *
 * The close button dismisses the banner for the rest of the browser session.
 * @param {Element} block The block element
 */

const LABELS = {
  close: 'Cerrar el aviso del chat de Línea Madrid',
  alt: 'Línea Madrid. Chat online. Asistente virtual',
  newTab: '(se abre en una pestaña nueva)',
};
const DISMISSED_KEY = 'online-chat-dismissed';

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false; // storage blocked: show the banner
  }
}

function rememberDismissed() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, '1');
  } catch { /* storage blocked: dismissed for this page view only */ }
}

function buildBubble(block) {
  const authored = block.querySelector('picture, img');
  if (authored) {
    const img = authored.tagName === 'IMG' ? authored : authored.querySelector('img');
    if (img && !img.alt) img.alt = LABELS.alt;
    return authored.tagName === 'IMG' ? img : authored;
  }
  const img = document.createElement('img');
  img.src = `${window.hlx?.codeBasePath || ''}/blocks/online-chat/images/linea-madrid-chat.webp`;
  img.alt = LABELS.alt;
  img.width = 360;
  img.height = 360;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

function buildCloseButton(block) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'online-chat-close';
  button.setAttribute('aria-label', LABELS.close);
  // the source's orange (#CC3300) cross
  button.innerHTML = '<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path d="M443.6 387.1 312.4 255.4l131.5-130c5.4-5.4 5.4-14.2 0-19.6l-37.4-37.6a13.8 13.8 0 0 0-19.6 0L256 197.8 124.9 68.3a13.8 13.8 0 0 0-19.6 0L68 105.9c-5.4 5.4-5.4 14.2 0 19.6l131.5 130L68.4 387.1a13.8 13.8 0 0 0 0 19.6l37.4 37.6a13.8 13.8 0 0 0 19.6 0L256 313.1l130.7 131.1a13.8 13.8 0 0 0 19.6 0l37.4-37.6a13.8 13.8 0 0 0 0-19.5z"/></svg>';
  button.addEventListener('click', () => {
    rememberDismissed();
    block.hidden = true;
    // keep keyboard users on the page instead of losing focus to <body>
    const main = document.querySelector('main');
    if (main) main.focus({ preventScroll: true });
  });
  return button;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const bubble = buildBubble(block);
  const linkText = link ? link.textContent.trim() : '';

  let target = bubble;
  if (link) {
    const a = document.createElement('a');
    a.className = 'online-chat-link';
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(bubble);
    // accessible name = the bubble's visible words (alt) + where the link goes
    const note = document.createElement('span');
    note.className = 'online-chat-note';
    note.textContent = [linkText, LABELS.newTab].filter(Boolean).join(' ');
    a.append(note);
    target = a;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'online-chat-bubble';
  wrapper.append(target, buildCloseButton(block));
  block.replaceChildren(wrapper);
  block.setAttribute('role', 'complementary');
  block.setAttribute('aria-label', 'Chat de Línea Madrid');

  if (isDismissed()) block.hidden = true;
}
