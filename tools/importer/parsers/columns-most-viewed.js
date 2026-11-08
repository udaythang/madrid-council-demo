/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-most-viewed (madrid.es "Lo más visto" strip).
 * Source: .navigation-bar--desktop .most-watched
 * Model: 1 row, 2 cells: [label] [ul of links]. The visible link text is
 * truncated with "...", so the full title attribute is used as link text.
 */
export default function parse(element, { document }) {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const labelEl = element.querySelector('.mw-title, .col-sm-3');
  const label = clean(labelEl ? labelEl.textContent : '') || 'Lo más visto';

  const ul = document.createElement('ul');
  const links = [...element.querySelectorAll('ul.mw-content a[href], a.mw-item[href]')]
    .filter((a, i, all) => all.indexOf(a) === i);
  links.forEach((link) => {
    const visible = clean(link.textContent);
    const title = clean(link.getAttribute('title'));
    // prefer the full title, unless it is missing or the visible text is already complete
    const text = title && (!visible || /(\.\.\.|…)$/.test(visible) || title.length >= visible.length)
      ? title
      : visible;
    if (!text) return;
    const a = document.createElement('a');
    a.href = link.getAttribute('href').trim();
    a.textContent = text;
    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  });

  const cells = [[label, ul.children.length ? ul : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-most-viewed', cells });
  element.replaceWith(block);
}
