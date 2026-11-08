/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for www.madrid.es.
 *
 * Driven by payload.template.sections (page-templates.json).
 * beforeTransform: walks sections in reverse and inserts an <hr> before every
 *   non-first section (while parser targets still exist). Styled sections get
 *   a temporary data-excat-section-id marker on their <hr>; a styled first
 *   section gets a temporary marked <hr> that is removed later.
 * afterTransform: walks sections in reverse and adds a Section Metadata block
 *   (style) after the surviving section element, or right after its marker
 *   <hr> when a parser replaced the element. Markers are then cleaned up.
 */
const MARKER = 'data-excat-section-id';

// Fallbacks for s1, whose source selectors are scoped to the header that the
// cleanup transformer unwraps in afterTransform.
const FALLBACKS = {
  s1: ['.section-cont', '.contenedorContenedorCarouselCorregido'],
};

function findSectionElement(root, section) {
  const selectors = []
    .concat(section.selector || [])
    .concat(FALLBACKS[section.id] || []);
  for (const sel of selectors) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // unsupported selector (e.g. :has) - try the next one
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || sections.length < 2) return;
  const doc = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      const isFirst = i === 0;
      if (isFirst && !section.style) continue;
      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      if (isFirst) hr.setAttribute('data-excat-first', 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      if (section.style) {
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        const el = findSectionElement(element, section);
        if (el && el.parentNode) {
          el.after(meta);
        } else if (marker && marker.parentNode) {
          marker.after(meta);
        }
      }
      if (marker) {
        if (marker.getAttribute('data-excat-first') === 'true') {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER);
        }
      }
    }
    element.querySelectorAll('hr[data-excat-first]').forEach((hr) => hr.remove());
  }
}
