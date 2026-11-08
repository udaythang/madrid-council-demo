import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Optimizes same-origin raster images; external or SVG images keep the authored picture.
 * @param {Element} root Element to search
 */
function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }]);
    // keep the intrinsic size so the browser reserves space before the image loads
    const optimized = picture.querySelector('img');
    ['width', 'height'].forEach((attr) => {
      if (img.hasAttribute(attr)) optimized.setAttribute(attr, img.getAttribute(attr));
    });
    img.closest('picture').replaceWith(picture);
  });
}

/**
 * Cards (tiles): square image tiles with a caption box over the bottom-left.
 * One row per tile: [image] [linked caption]. Either cell may be missing.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  // list-style: none drops list semantics in Safari/VoiceOver; restore them
  ul.setAttribute('role', 'list');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-tiles-tile';

    const image = document.createElement('div');
    image.className = 'cards-tiles-tile-image';
    const caption = document.createElement('div');
    caption.className = 'cards-tiles-tile-caption';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !image.children.length) {
        image.append(pic);
        // anything left in the cell besides the picture is caption text
        if (cell.textContent.trim()) caption.append(...cell.childNodes);
      } else {
        caption.append(...cell.childNodes);
      }
    });

    if (image.children.length) li.append(image);
    else li.classList.add('cards-tiles-tile-no-image');

    if (caption.textContent.trim()) {
      const link = caption.querySelector('a[href]');
      if (link) link.classList.add('cards-tiles-tile-link');
      li.append(caption);
    }
    ul.append(li);
  });

  optimizeImages(ul);
  block.replaceChildren(ul);
}
