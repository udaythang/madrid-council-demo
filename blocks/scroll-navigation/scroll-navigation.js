/**
 * Scroll navigation: the two round "up" / "down" buttons fixed in the bottom-right
 * corner of www.madrid.es. Up scrolls to the top of the page, down to the very bottom.
 *
 * Needs no authored content (an authored block is simply emptied); it is also added to
 * every page automatically by buildAutoBlocks in scripts/scripts.js.
 * @param {Element} block The block element
 */

const LABELS = {
  group: 'Desplazamiento de la página',
  up: 'Ir arriba',
  down: 'Ir abajo',
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// white chevron, as in the source's arrow_up-gris.png / arrow_down-gris.png
const CHEVRON = {
  up: 'M19 38 32 25l13 13',
  down: 'M19 26 32 39l13-13',
};

function buildButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-navigation-button scroll-navigation-${direction}`;
  button.setAttribute('aria-label', LABELS[direction]);
  button.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="${CHEVRON[direction]}"/></svg>`;
  button.addEventListener('click', () => {
    const top = direction === 'up' ? 0 : document.documentElement.scrollHeight;
    window.scrollTo({ top, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
  return button;
}

/**
 * Near the end of the page the footer scrolls under the buttons. Where a footer link or
 * button would end up beneath them (tablet: the social icons), lift the buttons just
 * above it; otherwise they stay put, clear of the chat bubble.
 * @param {Element} block The block element
 */
function keepFooterLinksClear(block) {
  const footer = document.querySelector('body > footer');
  if (!footer) return;
  const GAP = 8;
  let ticking = false;
  const update = () => {
    ticking = false;
    block.style.removeProperty('--scroll-navigation-lift');
    const group = block.getBoundingClientRect();
    if (footer.getBoundingClientRect().top >= group.bottom) return;
    const covered = [...footer.querySelectorAll('a, button')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.left < group.right && r.right > group.left
        && r.top < group.bottom && r.bottom > group.top);
    if (!covered.length) return;
    const lift = group.bottom - (Math.min(...covered.map((r) => r.top)) - GAP);
    block.style.setProperty('--scroll-navigation-lift', `${Math.ceil(lift)}px`);
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(footer);
  schedule();
}

export default function decorate(block) {
  block.setAttribute('role', 'group');
  block.setAttribute('aria-label', LABELS.group);
  block.replaceChildren(buildButton('up'), buildButton('down'));
  keepFooterLinksClear(block);
}
