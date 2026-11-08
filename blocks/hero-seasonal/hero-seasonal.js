/**
 * Hero (seasonal): a full-bleed background photo with optional overlay text.
 * Rows: [image] then [title / subheading / CTA] — both optional, in any order.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-seasonal-media';
  const content = document.createElement('div');
  content.className = 'hero-seasonal-content';

  const picture = block.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      // the seasonal photo is the page's LCP candidate
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
      if (!img.hasAttribute('alt')) img.alt = '';
    }
    const holder = picture.parentElement;
    media.append(picture);
    // drop a paragraph left empty by moving the picture out
    if (holder && holder !== block && !holder.textContent.trim() && !holder.children.length) {
      holder.remove();
    }
  }

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    [...cell.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      content.append(node);
    });
  });

  const hasContent = !!content.textContent.trim() || !!content.querySelector('a, img, picture');
  block.replaceChildren();
  if (picture) block.append(media);
  else block.classList.add('hero-seasonal-no-image');
  if (hasContent) block.append(content);
  else block.classList.add('hero-seasonal-image-only');
}
