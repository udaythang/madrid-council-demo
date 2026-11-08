import { readBlockConfig, toCamelCase, toClassName } from '../../scripts/aem.js';

/**
 * Applies section metadata to the enclosing section, then removes itself.
 * `style` values become section classes; other keys become data attributes.
 * @param {Element} block The section-metadata block element
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    const meta = readBlockConfig(block);
    Object.keys(meta).forEach((key) => {
      if (key === 'style') {
        String(meta.style)
          .split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean)
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toCamelCase(key)] = meta[key];
      }
    });
    section.classList.remove('section-metadata-container');
  }
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('section-metadata-wrapper')) wrapper.remove();
  else block.remove();
}
