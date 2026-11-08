/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-tiles (madrid.es square image tiles).
 * Two source shapes share this model:
 *  - "A un clic":   .a-un-clic .col-md-9 > ul.row > li  (one list of 9 tiles)
 *  - agenda events: .actividades ul.row > li.info_relevant-second-row
 *                   (4 tiles split over two lists; the first list also holds
 *                   the calendar li, which is left for widget-calendar)
 * Instance selectors match each li; the first call builds one block from all
 * tiles of its group and detaches the others.
 * Model: one row per tile: [image] [linked caption].
 */
export default function parse(element, { document }) {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const isTile = (li) => li.tagName === 'LI'
    && !li.querySelector('.calendario')
    && !!(li.querySelector('img') || li.querySelector('a[href]'));

  // Group: every tile li in the same section (both shapes), else the parent list.
  const scope = element.closest('.a-un-clic, .actividades');
  let items;
  if (scope) {
    items = [...scope.querySelectorAll('ul.row > li')].filter(isTile);
  } else if (element.parentElement) {
    items = [...element.parentElement.children].filter(isTile);
  } else {
    items = [element];
  }
  if (!items.includes(element)) items.unshift(element);

  const cells = [];
  items.forEach((li) => {
    const img = li.querySelector('.info_relevant_img img, img');
    const link = li.querySelector('.info_relevant-content a[href], a[href]');
    if (!img && !link) return;

    let imageCell = '';
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      imageCell = image;
    }

    let captionCell = '';
    if (link) {
      const text = clean(link.textContent) || clean(link.getAttribute('title'));
      const a = document.createElement('a');
      a.href = link.getAttribute('href').trim();
      a.textContent = text;
      const p = document.createElement('p');
      p.append(a);
      captionCell = p;
    }

    cells.push([imageCell, captionCell]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-tiles', cells });

  // Lists that held tiles, in document order; the block goes after the last one
  // so that anything left in the first list (the agenda calendar) stays ahead of it.
  const lists = [...new Set(items.map((li) => li.parentElement).filter(Boolean))];
  const lastList = lists[lists.length - 1];

  items.forEach((li) => { if (li !== element) li.remove(); });
  element.replaceWith(block);

  // a block table must not stay inside a list: move it after the last tile list
  if (lastList && block.parentElement && /^(UL|OL)$/.test(block.parentElement.tagName)) {
    lastList.after(block);
  }
  lists.forEach((list) => {
    if (!list.querySelector('li')) list.remove();
  });
}
