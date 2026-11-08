/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for www.madrid.es (munimadrid homepage).
 *
 * beforeTransform:
 *  - removes non-authorable chrome (cookie modal, pace loader, chat widget,
 *    private-area bar, skip/scroll anchors, tracking link/meta, scripts).
 *  - strips header.header--main down to the authorable s1 content
 *    (.section-cont hero image + .contenedorContenedorCarouselCorregido topic
 *    tiles). The <header> element is kept so the parser/section selectors
 *    (header.header--main ...) still match; the global nav, search, logo,
 *    mobile "Lo más visto" duplicate and collapsed topic-list duplicate are
 *    removed.
 * afterTransform:
 *  - unwraps the remaining header so its content lands in main content ahead
 *    of the "Lo más visto" bar, then removes header/footer leftovers and
 *    tracking attributes. HTML comments are left untouched.
 */
// Cookie consent UI: the banner and the "Configuración de cookies" panel are
// injected with varying ids (iam-cookie-control-*), so match them generically.
function removeCookieUi(element) {
  element.querySelectorAll('[id*="cookie" i], [class*="cookie" i]').forEach((el) => {
    if (el !== element && el.isConnected) el.remove();
  });
}

// Root-relative links (/portales/...) would resolve against the EDS host;
// point them back at www.madrid.es so they keep their original destination.
function absolutizeLinks(element, payload) {
  const base = (payload && payload.params && payload.params.originalURL) || 'https://www.madrid.es/';
  element.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href').trim();
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return;
    try {
      a.setAttribute('href', new URL(href, base).href);
    } catch (e) {
      // leave unparseable hrefs as authored
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    removeCookieUi(element);

    // Overlays, widgets, loaders
    WebImporter.DOMUtils.remove(element, [
      '#iam-cookie-control-modal-backdrop',
      '#iam-cookie-control-modal',
      '.pace',
      '#root',
      '.chat-widget-launcher',
      '#menuAreaPrivada',
      'a#top',
      'a#bottom',
      'a#nav_up',
      'a#nav_down',
      'a#content',
      'a#anchorToContent',
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
      'meta',
    ]);

    // Header: keep only the authorable s1 content
    const header = element.querySelector('header.header--main');
    if (header) {
      const keep = [
        header.querySelector('.section-cont'),
        header.querySelector('.contenedorContenedorCarouselCorregido'),
      ].filter(Boolean);
      // Collapsed duplicate topic list + JS pagination/toggle controls
      keep.forEach((k) => {
        WebImporter.DOMUtils.remove(k, [
          '#listadoHome',
          '.paginacionListadoHome',
          '.btnWrapper',
        ]);
      });
      // Reattach kept nodes directly under header, drop everything else
      keep.forEach((k) => header.append(k));
      [...header.children].forEach((child) => {
        if (!keep.includes(child)) child.remove();
      });
    }

    // Decorative skyline drawing behind the agenda
    WebImporter.DOMUtils.remove(element, ['.actividades > img']);
  }

  if (hookName === 'afterTransform') {
    // Move remaining header content into main flow (before "Lo más visto")
    element.querySelectorAll('header.header--main').forEach((header) => {
      while (header.firstChild) header.parentNode.insertBefore(header.firstChild, header);
      header.remove();
    });

    // Remaining chrome: footer, other headers/nav, mobile duplicates
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      'footer.footer',
      'nav',
      '.navigation-bar-toggle',
      '#searcher-form',
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
    ]);
    removeCookieUi(element);
    absolutizeLinks(element, payload);

    // Tracking / runtime attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (
          attr.name.startsWith('data-rsevent')
          || attr.name.startsWith('data-gtm')
          || attr.name === 'onclick'
          || attr.name === 'onload'
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
}
