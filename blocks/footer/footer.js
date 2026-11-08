import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/** social networks with a source icon in ./icons/, keyed by name */
const SOCIAL_NETWORKS = {
  youtube: ['youtube.com', 'youtu.be'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com'],
  x: ['x.com', 'twitter.com'],
};

/**
 * Loads the footer fragment, independent of the footer metadata.
 * Uses the `footer` metadata when present, otherwise /footer (production / DA).
 * Only the local `aem up` preview tries /content/footer first, so production logs no 404.
 * @returns {Promise<HTMLElement|null>} the fragment root
 */
async function loadFooterFragment() {
  const footerMeta = getMetadata('footer');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  let paths = ['/footer'];
  if (footerMeta) paths = [new URL(footerMeta, window.location).pathname];
  else if (isLocal) paths = ['/content/footer', '/footer'];
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    // sequential on purpose: only fall back when the previous path is missing
    // eslint-disable-next-line no-await-in-loop
    const fragment = await loadFragment(path);
    if (fragment && fragment.childElementCount) return fragment;
  }
  return null;
}

/**
 * Returns the social network key for a link, from its href or its text.
 * @param {HTMLAnchorElement} a the link
 * @returns {string|null} network key
 */
function getNetwork(a) {
  let host = '';
  try {
    host = new URL(a.href).hostname.replace(/^www\./, '');
  } catch { /* relative or invalid href */ }
  const text = a.textContent.trim().toLowerCase();
  const match = Object.entries(SOCIAL_NETWORKS).find(([name, domains]) => text === name
    || domains.some((d) => host === d || host.endsWith(`.${d}`)));
  return match ? match[0] : null;
}

/**
 * Turns a social link into an icon link, keeping its text accessible.
 * @param {HTMLAnchorElement} a the link
 * @param {string} network network key
 */
function decorateSocialLink(a, network) {
  a.classList.add('footer-social-link', `footer-social-${network}`);
  const label = document.createElement('span');
  label.className = 'footer-visually-hidden';
  label.append(...a.childNodes);
  a.append(label);
  // the authored title announces "Enlace externo en nueva ventana"
  if (/nueva ventana/i.test(a.title)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await loadFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  // fragment metadata must not render
  fragment.querySelectorAll('.metadata').forEach((meta) => {
    (meta.closest('.metadata-wrapper') || meta).remove();
  });

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  // logo: first image, with its link if any
  const logoImg = fragment.querySelector('picture, img');
  if (logoImg) {
    const logo = document.createElement('div');
    logo.className = 'footer-logo';
    const logoLink = logoImg.closest('a');
    const logoEl = logoLink || logoImg;
    const logoParent = logoEl.parentElement;
    logo.append(logoEl);
    if (logoParent && logoParent.tagName === 'P' && !logoParent.textContent.trim()
      && !logoParent.children.length) logoParent.remove();
    inner.append(logo);
  }

  // lists: social when most links are known networks, legal otherwise
  fragment.querySelectorAll('ul').forEach((ul) => {
    if (ul.parentElement.closest('ul')) return;
    const links = [...ul.querySelectorAll('a')];
    const networks = links.map(getNetwork);
    const isSocial = links.length && networks.filter(Boolean).length > links.length / 2;
    const wrapper = document.createElement('div');
    if (isSocial) {
      wrapper.className = 'footer-social';
      ul.className = 'footer-social-list';
      links.forEach((a, i) => { if (networks[i]) decorateSocialLink(a, networks[i]); });
    } else {
      wrapper.className = 'footer-legal';
      ul.className = 'footer-legal-list';
    }
    wrapper.append(ul);
    inner.append(wrapper);
  });

  // keep any other authored content instead of dropping it
  const rest = [...fragment.querySelectorAll('.default-content-wrapper > *, .section > :not(.default-content-wrapper)')]
    .filter((el) => el.textContent.trim() || el.querySelector('img, picture'));
  if (rest.length) {
    const extra = document.createElement('div');
    extra.className = 'footer-extra';
    extra.append(...rest);
    inner.append(extra);
  }

  block.append(inner);
}
