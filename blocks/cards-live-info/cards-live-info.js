import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Turns text into a stable key, e.g. "Calidad del aire" -> "calidad-del-aire".
 * @param {string} text Source text
 * @returns {string}
 */
function toKey(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Cards (live info): an optional icon, a title link and a short description,
 * plus a status slot that live data (weather, air quality, traffic) can fill.
 * One row per card: [icon image (optional)] [title link + description] [status (optional)].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-live-info-card';

    const icon = document.createElement('div');
    icon.className = 'cards-live-info-card-icon';
    const body = document.createElement('div');
    body.className = 'cards-live-info-card-body';
    const status = document.createElement('div');
    status.className = 'cards-live-info-card-status';
    status.setAttribute('aria-live', 'polite');

    let bodyDone = false;
    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      const text = cell.textContent.trim();
      if (pic && !text && !icon.children.length) {
        icon.append(pic);
      } else if (!bodyDone) {
        if (text || cell.children.length) {
          body.append(...cell.childNodes);
          bodyDone = true;
        }
      } else {
        // any cell after the body is an authored status value
        status.append(...cell.childNodes);
      }
    });

    const link = body.querySelector('a[href]');
    if (link) link.classList.add('cards-live-info-card-title');
    const key = toKey((link || body).textContent.trim().split('\n')[0] || '');
    if (key) li.dataset.key = key;

    if (icon.children.length) li.append(icon);
    else li.classList.add('cards-live-info-card-no-icon');
    li.append(body, status);
    if (!status.textContent.trim()) status.hidden = true;
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '96' }]));
  });

  block.replaceChildren(ul);

  // date line above the block ("Domingo 8 de Noviembre"): the source shows the
  // day and month part muted, so wrap it in a span (text is left unchanged)
  const section = block.closest('.section');
  section?.querySelectorAll('.default-content-wrapper > p').forEach((p) => {
    if (p.children.length) return;
    const match = p.textContent.trim().match(/^(\S+)\s+(\d{1,2}\s+de\s+\S+)$/i);
    if (!match) return;
    const [, day, date] = match;
    const muted = document.createElement('span');
    muted.className = 'cards-live-info-date-muted';
    muted.textContent = date;
    p.replaceChildren(`${day} `, muted);
  });
}
