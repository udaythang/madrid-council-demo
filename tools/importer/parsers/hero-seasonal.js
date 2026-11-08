/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-seasonal (madrid.es homepage seasonal background photo).
 * Source: header.header--main .section-cont img#section-image
 * Model: row 1 = background image; row 2 (optional) = overlay text (none on source).
 */
export default function parse(element, { document }) {
  const img = element.matches('img')
    ? element
    : element.querySelector('img#section-image, img.section-image, img');

  const cells = [];
  if (img && img.getAttribute('src')) {
    const image = document.createElement('img');
    image.src = img.getAttribute('src');
    image.alt = img.getAttribute('alt') || '';
    cells.push([image]);
  }

  // Optional overlay text (title / subheading / CTA) if a container is passed in.
  if (!element.matches('img')) {
    const text = [...element.querySelectorAll('h1, h2, h3, p')]
      .filter((el) => el.textContent.trim() && !el.parentElement.closest('h1, h2, h3, p'));
    if (text.length) cells.push([text]);
  }

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-seasonal', cells });
  element.replaceWith(block);
}
