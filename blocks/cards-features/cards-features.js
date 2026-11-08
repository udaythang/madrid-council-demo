/**
 * Cards (features): centered items with an icon badge, a heading and text.
 * One row per item, one cell: :icon: token, heading, paragraph(s). Extra cells are merged.
 * The icon token arrives as text (":tramites:"), as span.icon (Document Authoring)
 * or as span.icon > img (after decorateIcons). All forms become an AytMadIcons glyph.
 * When the items overflow (mobile) the list becomes a swipe carousel with dot pagination.
 * @param {Element} block The block element
 */

// source glyphs (AytMadIcons) keyed by icon token
const GLYPHS = {
  'tu-contenido': 'U',
  tramites: 'R',
  comparte: 'Q',
  opina: 'T',
};

const TOKEN = /^\s*:([a-z0-9-]+):\s*$/i;

/**
 * Finds the icon token in an item body and removes it from the content.
 * @param {Element} body item body
 * @returns {{ name: string|null, picture: Element|null }}
 */
function extractIcon(body) {
  // span.icon (with or without the decorateIcons img inside)
  const span = body.querySelector('span.icon');
  if (span) {
    const name = [...span.classList].find((c) => c.startsWith('icon-'))?.slice(5) || null;
    const holder = span.parentElement;
    span.remove();
    if (holder && holder !== body && !holder.textContent.trim() && !holder.querySelector('img, picture')) {
      holder.remove();
    }
    return { name, picture: null };
  }

  // bare icon img (/icons/name.svg) without the span
  const iconImg = body.querySelector('img[src*="/icons/"]');
  if (iconImg) {
    const name = iconImg.getAttribute('src').split('/').pop().replace(/\.svg.*$/, '');
    const holder = iconImg.closest('p') || iconImg;
    if (holder === iconImg || !holder.textContent.trim()) holder.remove();
    else iconImg.remove();
    return { name, picture: null };
  }

  // plain text token: a paragraph that only holds ":name:"
  const tokenP = [...body.querySelectorAll(':scope > p')].find((p) => TOKEN.test(p.textContent) && !p.querySelector('a, img'));
  if (tokenP) {
    const [, name] = tokenP.textContent.match(TOKEN);
    tokenP.remove();
    return { name: name.toLowerCase(), picture: null };
  }

  // fallback: an authored picture becomes the badge content
  const picture = body.querySelector('picture');
  if (picture) {
    const holder = picture.parentElement;
    picture.remove();
    if (holder && holder !== body && !holder.textContent.trim() && !holder.children.length) {
      holder.remove();
    }
    return { name: null, picture };
  }
  return { name: null, picture: null };
}

/**
 * Adds dot pagination when the list scrolls horizontally.
 * @param {Element} block block element
 * @param {Element} ul item list
 */
function setupCarousel(block, ul) {
  const nav = document.createElement('div');
  nav.className = 'cards-features-dots';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Paginación');
  nav.hidden = true;
  block.append(nav);

  const pageCount = () => Math.max(1, Math.ceil((ul.scrollWidth - 1) / ul.clientWidth));

  const updateActive = () => {
    const pages = nav.children.length;
    if (!pages) return;
    const max = ul.scrollWidth - ul.clientWidth;
    const idx = max > 0 ? Math.round((ul.scrollLeft / max) * (pages - 1)) : 0;
    [...nav.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
      dot.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
  };

  const build = () => {
    const overflowing = ul.scrollWidth > ul.clientWidth + 1;
    const pages = overflowing ? pageCount() : 0;
    block.classList.toggle('is-carousel', overflowing);
    nav.hidden = !overflowing;
    if (nav.children.length !== pages) {
      nav.replaceChildren(...Array.from({ length: pages }, (_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'cards-features-dot';
        dot.dataset.page = i;
        dot.setAttribute('aria-label', `Ver la diapositiva ${i + 1}`);
        return dot;
      }));
    }
    updateActive();
  };

  nav.addEventListener('click', (e) => {
    const dot = e.target.closest('.cards-features-dot');
    if (!dot) return;
    const pages = nav.children.length;
    const max = ul.scrollWidth - ul.clientWidth;
    const target = pages > 1 ? (max * Number(dot.dataset.page)) / (pages - 1) : 0;
    ul.scrollTo({ left: target, behavior: 'smooth' });
  });

  let ticking = false;
  ul.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateActive();
    });
  }, { passive: true });

  new ResizeObserver(build).observe(ul);
  build();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('span.icon, picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-features-item';

    const body = document.createElement('div');
    body.className = 'cards-features-item-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));

    const { name, picture } = extractIcon(body);
    if (name || picture) {
      const badge = document.createElement('p');
      badge.className = 'cards-features-item-icon';
      badge.setAttribute('aria-hidden', 'true');
      if (name) {
        li.dataset.icon = name;
        badge.classList.add(`cards-features-icon-${name}`);
        if (GLYPHS[name]) {
          const glyph = document.createElement('span');
          glyph.className = 'cards-features-glyph';
          glyph.textContent = GLYPHS[name];
          badge.append(glyph);
        }
      } else {
        badge.append(picture);
      }
      li.append(badge);
    }

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
  setupCarousel(block, ul);
}
