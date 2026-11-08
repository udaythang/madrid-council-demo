/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-profiles (madrid.es "Lo que te interesa" tabs).
 * Source: .te_interesa_content .tabspanel
 * Model: one row per tab: [tab label] [panel content].
 *  - "Para ti": each profile image followed by its link (in a paragraph)
 *  - "En tu distrito": a ul of the district links
 */
export default function parse(element, { document }) {
  const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

  const makeLink = (link, text) => {
    const a = document.createElement('a');
    a.href = link.getAttribute('href').trim();
    a.textContent = text || clean(link.textContent) || clean(link.getAttribute('title'));
    return a;
  };

  // Tab buttons: anchors pointing at in-page panels (#tab-...)
  const tabLinks = [...element.querySelectorAll('ul.nav-tabs a[href^="#"]')]
    .filter((a) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return false;
      const pane = element.querySelector(`[id="${id}"]`);
      // skip nested in-panel toggles (e.g. "Ver listado de distritos")
      return pane && !a.closest('.tab-pane');
    });

  let tabs = tabLinks.map((a) => ({
    label: clean(a.textContent),
    pane: element.querySelector(`[id="${a.getAttribute('href').slice(1)}"]`),
  }));

  // Fallback: top-level panes with their hidden headings as labels
  if (!tabs.length) {
    tabs = [...element.querySelectorAll('.tab-pane')]
      .filter((pane) => !pane.parentElement.closest('.tab-pane'))
      .map((pane, i) => {
        const h = pane.querySelector('h2, h3');
        return { label: clean(h ? h.textContent : '') || `Tab ${i + 1}`, pane };
      });
  }

  const cells = [];
  tabs.forEach(({ label, pane }) => {
    if (!pane) return;
    const content = [];
    const images = [...pane.querySelectorAll('img')].filter((img) => img.getAttribute('src'));

    if (images.length) {
      // profile items: image followed by its link
      const units = [...pane.querySelectorAll('li')].filter((li) => li.querySelector('img'));
      const groups = units.length ? units : images.map((img) => img.parentElement);
      groups.forEach((unit) => {
        const img = unit.querySelector('img') || (unit.tagName === 'IMG' ? unit : null);
        if (img && img.getAttribute('src')) {
          const image = document.createElement('img');
          image.src = img.getAttribute('src');
          image.alt = img.getAttribute('alt') || '';
          content.push(image);
        }
        const link = unit.querySelector('a[href]');
        if (link) {
          const p = document.createElement('p');
          p.append(makeLink(link));
          content.push(p);
        }
      });
    } else {
      // link list: the largest list of real links (not tab toggles)
      const lists = [...pane.querySelectorAll('ul, ol')]
        .filter((ul) => !ul.classList.contains('nav-tabs'))
        .map((ul) => ({
          ul,
          links: [...ul.querySelectorAll(':scope > li > a[href]')]
            .filter((a) => !a.getAttribute('href').startsWith('#')),
        }))
        .filter((l) => l.links.length)
        .sort((x, y) => y.links.length - x.links.length);
      if (lists.length) {
        const ul = document.createElement('ul');
        lists[0].links.forEach((link) => {
          const li = document.createElement('li');
          li.append(makeLink(link));
          ul.append(li);
        });
        content.push(ul);
      } else {
        // anything else: keep visible paragraphs / links
        [...pane.querySelectorAll('p, a[href]')]
          .filter((el) => clean(el.textContent) && !el.closest('.accesibility_hide'))
          .forEach((el) => {
            const p = document.createElement('p');
            if (el.tagName === 'A') p.append(makeLink(el));
            else p.textContent = clean(el.textContent);
            content.push(p);
          });
      }
    }

    if (!label && !content.length) return;
    cells.push([label, content.length ? content : '']);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-profiles', cells });
  element.replaceWith(block);
}
