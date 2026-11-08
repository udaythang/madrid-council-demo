import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// at this width the menu links sit in the header bar; below it they live in the off-canvas panel
const isDesktop = window.matchMedia('(min-width: 900px)');

// control labels used by www.madrid.es (they are not part of the nav document)
const LABELS = {
  openMenu: 'Abrir menú del portal',
  closeMenu: 'Cerrar menú del portal',
  searchPlaceholder: '¿Qué estás buscando?',
};

// hidden fields the madrid.es search engine expects with every query
const SEARCH_FIELDS = {
  vgnextoid: '7db8fc12aa936610VgnVCM1000008a4a900aRCRD',
  vgnextchannel: '7db8fc12aa936610VgnVCM1000008a4a900aRCRD',
  action: 'es.iam.portlet.buscador.SearchAction',
};

/**
 * Loads the first nav fragment that resolves, trying each path in order.
 * @param {string[]} paths candidate fragment paths
 * @returns {Promise<HTMLElement|null>} the fragment root
 */
async function loadFirstFragment(paths) {
  if (!paths.length) return null;
  const [path, ...rest] = paths;
  const fragment = await loadFragment(path);
  if (fragment && fragment.children.length) return fragment;
  return loadFirstFragment(rest);
}

/**
 * Nav lookup order: `nav` metadata, then /content/nav (local preview), then /nav (production).
 * @returns {string[]} unique candidate paths
 */
function getNavPaths() {
  const paths = [];
  const navMeta = getMetadata('nav');
  if (navMeta) {
    try {
      paths.push(new URL(navMeta, window.location).pathname.replace(/\.plain\.html$/, ''));
    } catch { /* ignore malformed metadata */ }
  }
  paths.push('/content/nav', '/nav');
  return [...new Set(paths)];
}

function isMenuOpen(nav) {
  return nav.getAttribute('aria-expanded') === 'true';
}

function isSearchOpen(nav) {
  return nav.classList.contains('nav-search-open');
}

/**
 * Opens or closes the search panel.
 * @param {Element} nav the nav element
 * @param {boolean} open whether to open it
 * @param {boolean} moveFocus whether to move focus into or out of the panel
 */
function toggleSearch(nav, open, moveFocus = true) {
  const toggle = nav.querySelector('.nav-search-toggle');
  const form = nav.querySelector('.nav-search');
  if (!toggle || !form) return;
  nav.classList.toggle('nav-search-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  form.hidden = !open;
  if (!moveFocus) return;
  if (open) form.querySelector('input[name="q"]').focus();
  else toggle.focus();
}

/**
 * Opens or closes the off-canvas menu panel (tablet and mobile only).
 * @param {Element} nav the nav element
 * @param {boolean|null} forceExpanded force a state; null toggles
 * @param {boolean} moveFocus whether to move focus into or out of the panel
 */
function toggleMenu(nav, forceExpanded = null, moveFocus = true) {
  const expand = forceExpanded !== null ? forceExpanded : !isMenuOpen(nav);
  const open = expand && !isDesktop.matches;
  const hamburger = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflowY = open ? 'hidden' : '';
  if (hamburger) {
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? LABELS.closeMenu : LABELS.openMenu);
  }
  if (!moveFocus) return;
  if (open) nav.querySelector('.nav-close')?.focus();
  else if (hamburger && !isDesktop.matches) hamburger.focus();
}

/**
 * Escape closes the search panel first, then the menu panel.
 * @param {KeyboardEvent} e keydown event
 */
function closeOnEscape(e) {
  if (e.code !== 'Escape' && e.key !== 'Escape') return;
  const nav = document.getElementById('nav');
  if (!nav) return;
  if (isSearchOpen(nav)) {
    toggleSearch(nav, false);
  } else if (isMenuOpen(nav)) {
    toggleMenu(nav, false);
  }
}

/**
 * Closes the menu panel when focus leaves the nav.
 * @param {FocusEvent} e focusout event
 */
function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (isMenuOpen(nav) && !nav.contains(e.relatedTarget)) toggleMenu(nav, false, false);
}

/**
 * Builds the GET search form from the authored "Buscar" link and turns the link into its toggle.
 * @param {HTMLAnchorElement} link the authored search link
 * @returns {HTMLFormElement} the search form
 */
function buildSearch(link) {
  const label = link.textContent.trim();
  const url = new URL(link.href, window.location);

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.id = 'nav-search';
  form.method = 'get';
  form.action = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  form.setAttribute('role', 'search');
  form.hidden = true;

  Object.entries(SEARCH_FIELDS).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  });

  const field = document.createElement('input');
  field.type = 'text';
  field.name = 'q';
  field.id = 'nav-search-q';
  field.className = 'nav-search-input';
  field.placeholder = LABELS.searchPlaceholder;
  field.setAttribute('aria-label', LABELS.searchPlaceholder);
  field.autocomplete = 'off';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', label);
  const submitText = document.createElement('span');
  submitText.className = 'nav-visually-hidden';
  submitText.textContent = label;
  submit.append(submitText);

  form.append(field, submit);

  // the authored link stays in the DOM (text and href intact) and acts as the toggle
  link.classList.add('nav-search-toggle');
  link.setAttribute('role', 'button');
  link.setAttribute('aria-controls', form.id);
  link.setAttribute('aria-expanded', 'false');
  // the glyph is CSS generated content; keep it out of the accessible name
  link.setAttribute('aria-label', label);
  const linkText = document.createElement('span');
  linkText.className = 'nav-visually-hidden';
  linkText.append(...link.childNodes);
  link.append(linkText);

  return form;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadFirstFragment(getNavPaths());

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  if (fragment) while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // the nav document's page metadata (robots) is not header content
  nav.querySelectorAll('.metadata').forEach((meta) => {
    (meta.closest('.metadata-wrapper') || meta).remove();
  });

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand: plain logo link, never a button
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.querySelectorAll('.button').forEach((btn) => { btn.className = ''; });
    navBrand.querySelectorAll('.button-wrapper, .button-container').forEach((p) => { p.className = ''; });
    const logoLink = navBrand.querySelector('a[href]');
    const logo = navBrand.querySelector('img');
    if (logo) {
      logo.loading = 'eager';
      if (logoLink) logoLink.classList.add('nav-logo');
    }
  }

  // sections: off-canvas panel below 900px, inline bar above
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.id = 'nav-sections';
    navSections.tabIndex = -1;
    const panelHeader = document.createElement('div');
    panelHeader.className = 'nav-sections-header';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nav-close';
    close.setAttribute('aria-label', LABELS.closeMenu);
    close.addEventListener('click', () => toggleMenu(nav, false));
    panelHeader.append(close);
    navSections.prepend(panelHeader);
  }

  // tools: the "Buscar" link becomes the search toggle plus a GET form
  const navTools = nav.querySelector('.nav-tools');
  const searchLink = navTools?.querySelector('a[href]');
  if (searchLink) {
    const form = buildSearch(searchLink);
    nav.append(form);
    searchLink.addEventListener('click', (e) => {
      // modified clicks still open the search page ("open in new tab")
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      if (isMenuOpen(nav)) toggleMenu(nav, false, false);
      toggleSearch(nav, !isSearchOpen(nav));
    });
    searchLink.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        searchLink.click();
      }
    });
  }

  // hamburger for tablet and mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav-sections');
  hamburgerButton.setAttribute('aria-expanded', 'false');
  hamburgerButton.setAttribute('aria-label', LABELS.openMenu);
  hamburgerButton.addEventListener('click', () => {
    if (isSearchOpen(nav)) toggleSearch(nav, false, false);
    toggleMenu(nav);
  });
  hamburger.append(hamburgerButton);
  nav.prepend(hamburger);

  // a click on the backdrop (the nav itself, outside the panel) closes the menu
  nav.addEventListener('click', (e) => {
    if (e.target === nav && isMenuOpen(nav)) toggleMenu(nav, false);
  });

  toggleMenu(nav, false, false);
  window.addEventListener('keydown', closeOnEscape);
  nav.addEventListener('focusout', closeOnFocusLost);
  // never leave the panel or the scroll lock behind when crossing the breakpoint
  isDesktop.addEventListener('change', () => toggleMenu(nav, false, false));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  // transparent over the seasonal photo when it opens the page; solid everywhere else
  const hero = document.querySelector('main > .section:first-child .hero-seasonal');
  navWrapper.classList.add(hero ? 'nav-over-hero' : 'nav-solid');
  navWrapper.append(nav);
  block.append(navWrapper);
}
