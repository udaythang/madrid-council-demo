/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-news-mosaic (madrid.es "Es noticia" news items).
 * The instance selector matches each li of the news list; the first call
 * builds one block from all sibling items and detaches the rest.
 * Model: one row per item: [image] [linked title]. First row = featured card.
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
    const img = li.querySelector('.info_relevant_img img, img');
    const link = li.querySelector('.info_relevant-content a[href], p a[href], a[href]');
    if (!img && !link) return;

    let imageCell = '';
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      imageCell = image;
    }

    let textCell = '';
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href').trim();
      a.textContent = clean(link.textContent) || clean(link.getAttribute('title'));
      const p = document.createElement('p');
      p.append(a);
      textCell = p;
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news-mosaic', cells });
  items.forEach((li) => { if (li !== element) li.remove(); });
  element.replaceWith(block);
  // a block table must not stay inside a list
  if (list && list.children.length === 1 && list.firstElementChild === block) {
    list.replaceWith(block);
  }
}
