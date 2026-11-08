let instance = 0;

/**
 * Groups loose panel content into a list of profile items: each item starts at an
 * element holding a picture and collects the elements that follow it.
 * @param {Element} panel Tab panel
 */
function buildProfileItems(panel) {
  const existing = [...panel.querySelectorAll('ul')].find((ul) => ul.querySelector('picture'));
  if (existing) {
    existing.classList.add('tabs-profiles-items');
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'tabs-profiles-items';
  const hasPic = (el) => el.tagName === 'PICTURE' || !!el.querySelector('picture');
  const first = [...panel.children].find(hasPic);
  if (!first) return;
  panel.insertBefore(ul, first);
  let current = null;
  let el = ul.nextElementSibling;
  while (el) {
    const next = el.nextElementSibling;
    if (hasPic(el)) {
      current = document.createElement('li');
      ul.append(current);
    }
    current.append(el);
    el = next;
  }
}

/**
 * Adds dot pagination to the profile row when it scrolls horizontally (mobile carousel).
 * One page per group of fully visible items, as on the source.
 * @param {Element} panel Tab panel
 * @param {Element} list Profile item list
 */
function setupCarousel(panel, list) {
  const nav = document.createElement('div');
  nav.className = 'tabs-profiles-dots';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Paginación');
  nav.hidden = true;
  panel.append(nav);

  const items = () => [...list.children];

  // scroll offsets of each page start, clamped to the scrollable range
  const pageOffsets = () => {
    const all = items();
    if (!all.length || !list.clientWidth) return [];
    const max = list.scrollWidth - list.clientWidth;
    if (max <= 1) return [];
    if (!all[0].offsetWidth) return [];
    const perPage = Math.max(1, Math.floor((list.clientWidth + 1) / all[0].offsetWidth));
    const offsets = [];
    for (let i = 0; i < all.length; i += perPage) {
      offsets.push(Math.min(max, all[i].offsetLeft - all[0].offsetLeft));
    }
    return offsets;
  };

  const updateActive = () => {
    const offsets = pageOffsets();
    if (!offsets.length) return;
    let idx = 0;
    offsets.forEach((o, i) => {
      if (Math.abs(o - list.scrollLeft) < Math.abs(offsets[idx] - list.scrollLeft)) idx = i;
    });
    [...nav.children].forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
      dot.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
  };

  const build = () => {
    const pages = pageOffsets().length;
    nav.hidden = pages < 2;
    panel.classList.toggle('is-carousel', pages > 1);
    if (nav.children.length !== pages) {
      nav.replaceChildren(...Array.from({ length: pages }, (_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'tabs-profiles-dot';
        dot.dataset.page = i;
        dot.setAttribute('aria-label', `Ver la diapositiva ${i + 1}`);
        return dot;
      }));
    }
    updateActive();
  };

  nav.addEventListener('click', (e) => {
    const dot = e.target.closest('.tabs-profiles-dot');
    if (!dot) return;
    const target = pageOffsets()[Number(dot.dataset.page)];
    if (target !== undefined) list.scrollTo({ left: target, behavior: 'smooth' });
  });

  let ticking = false;
  list.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateActive();
    });
  }, { passive: true });

  new ResizeObserver(build).observe(list);
  build();
}

/**
 * Tabs (profiles): each row is [tab label] [tab content].
 * Panels with images become a profile-photo row; panels with a list become a link grid.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  instance += 1;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-profiles-list';
  tablist.setAttribute('role', 'tablist');
  const panels = document.createElement('div');
  panels.className = 'tabs-profiles-panels';

  const tabs = [];
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (!cells.length || (!row.textContent.trim() && !row.querySelector('picture'))) return;
    // one cell only: use it as content with a generated label
    const labelCell = cells.length > 1 ? cells[0] : null;
    const contentCells = cells.length > 1 ? cells.slice(1) : cells;
    const labelText = labelCell?.textContent.trim() || `Tab ${i + 1}`;
    const id = `tabs-profiles-${instance}-${i}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-profiles-tab';
    button.id = `${id}-tab`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `${id}-panel`);
    button.textContent = labelText;

    const panel = document.createElement('div');
    panel.className = 'tabs-profiles-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    contentCells.forEach((cell) => panel.append(...cell.childNodes));

    if (panel.querySelector('picture')) {
      panel.classList.add('tabs-profiles-panel-profiles');
      buildProfileItems(panel);
    } else if (panel.querySelector('ul, ol')) {
      panel.classList.add('tabs-profiles-panel-links');
    }

    tablist.append(button);
    panels.append(panel);
    tabs.push({ button, panel });
  });

  const select = (index, focus = false) => {
    tabs.forEach(({ button, panel }, i) => {
      const active = i === index;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
    });
    if (focus) tabs[index].button.focus();
  };

  tabs.forEach(({ button }, i) => {
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(next, true);
      }
    });
  });

  block.replaceChildren(tablist, panels);
  panels.querySelectorAll('.tabs-profiles-panel-profiles').forEach((panel) => {
    const list = panel.querySelector('.tabs-profiles-items');
    if (list) setupCarousel(panel, list);
  });
  if (tabs.length) select(0);
  if (tabs.length < 2) block.classList.add('tabs-profiles-single');
}
