import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Optimizes same-origin raster images; external or SVG images keep the authored picture.
 * @param {Element} root Element to search
 * @param {string} width Target width
 */
function optimizeImages(root, width) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width }]));
  });
}

/**
 * Cards (news mosaic): image + linked title per row. The first card is featured.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-news-mosaic-card';

    const image = document.createElement('div');
    image.className = 'cards-news-mosaic-card-image';
    const body = document.createElement('div');
    body.className = 'cards-news-mosaic-card-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      const picOnly = pic && !cell.textContent.trim();
      if (picOnly && !image.children.length) image.append(pic);
      else if (pic && !image.children.length) {
        // image and text authored in the same cell
        image.append(pic);
        body.append(...cell.childNodes);
      } else body.append(...cell.childNodes);
    });

    if (image.children.length) li.append(image);
    else li.classList.add('cards-news-mosaic-card-no-image');
    if (body.textContent.trim()) {
      const link = body.querySelector('a[href]');
      if (link) link.classList.add('cards-news-mosaic-card-link');
      li.append(body);
    }
    ul.append(li);
  });

  const first = ul.firstElementChild;
  if (first) first.classList.add('cards-news-mosaic-featured');
  if (ul.children.length < 3) block.classList.add('cards-news-mosaic-short');

  optimizeImages(ul, '750');
  // the featured image can be large on desktop
  const featuredImg = first?.querySelector('img');
  if (featuredImg) featuredImg.loading = 'eager';

  block.replaceChildren(ul);
}
