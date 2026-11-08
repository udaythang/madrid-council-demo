/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-topics (madrid.es homepage topic tiles).
 * Source instance selector matches each li of ul#carouselHomeCorregido; the
 * first call builds one block from all sibling tiles and detaches the rest.
 * Model: one row per tile, one cell: ":<li class token>:" icon + link.
 */
export default function parse(element, { document }) {
  const list = element.closest('ul') || element.parentElement;
  const items = list
    ? [...list.children].filter((li) => li.tagName === 'LI')
    : [element];

  const cells = [];
  items.forEach((li) => {
    const link = li.querySelector('a[href]');
    const iconName = [...li.classList].find((c) => c !== 'item' && /^[a-z0-9-]+$/i.test(c));
    if (!link && !li.textContent.trim()) return;

    const content = [];
    if (iconName) content.push(document.createTextNode(`:${iconName.toLowerCase()}: `));
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href').trim();
      a.textContent = link.textContent.replace(/\s+/g, ' ').trim();
      content.push(a);
    } else {
      content.push(document.createTextNode(li.textContent.replace(/\s+/g, ' ').trim()));
    }
    cells.push([content]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-topics', cells });
  items.forEach((li) => { if (li !== element) li.remove(); });
  element.replaceWith(block);
  // hoist the block out of the now-empty list
  if (list && list.children.length === 1 && list.firstElementChild === block) {
    list.replaceWith(block);
  }
}
