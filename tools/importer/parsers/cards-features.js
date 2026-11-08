/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-features (madrid.es "Descubre el Madrid que te gusta").
 * The instance selector matches each li of ul.carouselFormasParteReajustado;
 * the first call builds one block from all sibling items and detaches the rest.
 * Model: one row per item, one cell: ":<icon>:" token (from the
 * formasParte-ico-<icon> class), the h3 and the paragraph with its links.
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
    const content = [];

    const heading = li.querySelector('h1, h2, h3, h4, .formasParte-title');
    const headingText = clean(heading ? heading.textContent : '');

    // Icon token from the formasParte-ico-<name> class. The importer strips the
    // empty icon <p> (&nbsp; only) before parsers run, so fall back to the heading.
    const iconEl = li.querySelector('[class*="formasParte-ico-"]');
    let iconName = iconEl
      ? ([...iconEl.classList].find((c) => c.startsWith('formasParte-ico-')) || '')
        .replace('formasParte-ico-', '')
        .toLowerCase()
      : '';
    if (!iconName && headingText) {
      const slug = headingText.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const known = {
        'tu-contenido': 'tu-contenido',
        'tus-tramites': 'tramites',
        tramites: 'tramites',
        comparte: 'comparte',
        opina: 'opina',
      };
      iconName = known[slug] || slug;
    }
    if (iconName) {
      const p = document.createElement('p');
      p.textContent = `:${iconName}:`;
      content.push(p);
    }

    if (headingText) {
      const h3 = document.createElement('h3');
      h3.textContent = headingText;
      content.push(h3);
    }

    [...li.querySelectorAll('p')]
      .filter((p) => p !== iconEl && clean(p.textContent))
      .forEach((p) => {
        const copy = p.cloneNode(true);
        copy.removeAttribute('class');
        copy.querySelectorAll('a[href]').forEach((a) => {
          a.setAttribute('href', a.getAttribute('href').trim());
          a.textContent = clean(a.textContent);
        });
        content.push(copy);
      });

    if (!content.length) return;
    cells.push([content]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-features', cells });
  items.forEach((li) => { if (li !== element) li.remove(); });
  element.replaceWith(block);
  // a block table must not stay inside a list
  if (list && list.children.length === 1 && list.firstElementChild === block) {
    list.replaceWith(block);
  }
}
