/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-live-info (madrid.es "Madrid al minuto" boxes).
 * The instance selector matches each li of .al-minuto ul.row; the first call
 * builds one block from all sibling items and detaches the rest.
 * Model: one row per item: [icon image (optional)] [title link + description]
 * [status (optional)]. Live status values change daily, so the status cell
 * is always left empty for the block's runtime data to fill.
 */
export default function parse(element, { document }) {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const list = element.parentElement && /^(UL|OL)$/.test(element.parentElement.tagName)
    ? element.parentElement
    : null;
  const items = list
    ? [...list.children].filter((li) => li.tagName === 'LI')
    : [element];

  const cells = [];
  items.forEach((li) => {
    const box = li.querySelector('.content-box') || li;
    const link = box.querySelector('a.title[href], a[href]');
    const img = li.querySelector('.image img, img');
    if (!link && !clean(box.textContent) && !img) return;

    let iconCell = '';
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      iconCell = image;
    }

    const body = [];
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href').trim();
      a.textContent = clean(link.textContent) || clean(link.getAttribute('title'));
      const p = document.createElement('p');
      p.append(a);
      body.push(p);
    }
    [...box.querySelectorAll('p')]
      .filter((p) => !p.contains(link) && clean(p.textContent))
      .forEach((p) => {
        const desc = document.createElement('p');
        desc.textContent = clean(p.textContent);
        body.push(desc);
      });

    // status (cell 3) intentionally empty: live values are not authored
    cells.push([iconCell, body.length ? body : '', '']);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-live-info', cells });
  items.forEach((li) => { if (li !== element) li.remove(); });
  element.replaceWith(block);
  // a block table must not stay inside a list
  if (list && list.children.length === 1 && list.firstElementChild === block) {
    list.replaceWith(block);
  }
}
