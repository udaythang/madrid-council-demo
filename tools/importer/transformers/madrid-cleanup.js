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

// pages whose source mounts the Línea Madrid chat (#root / .chat-widget-launcher)
const pagesWithChat = new WeakSet();

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    removeCookieUi(element);

    // the chat app itself is removed below; remember it so an online-chat block replaces it
    if (element.querySelector('#root[data-lm-chat-mounted], .chat-widget-launcher')) {
      pagesWithChat.add(element.ownerDocument);
    }

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

    // The agenda title starts its own section: h2, not the source's h3
    element.querySelectorAll('.actividades h3.actividades__title').forEach((h3) => {
      const h2 = element.ownerDocument.createElement('h2');
      h2.className = h3.className;
      h2.append(...h3.childNodes);
      h3.replaceWith(h2);
    });

    // Placeholder alt texts ("Imagen banner", "Destacada") say nothing about the image:
    // use a known description, else empty alt when the link already has text
    const ALT_OVERRIDES = {
      'BannerAdaptaTuRuta.jpg': 'Mientras Madrid se transforma, adapta tu ruta. Sigamos mejorando Madrid entre todos',
    };
    element.querySelectorAll('img[alt]').forEach((img) => {
      if (!/^(imagen( banner)?|destacada|foto|image)$/i.test(img.getAttribute('alt').trim())) return;
      const file = decodeURIComponent((img.getAttribute('src') || '').split('/').pop().split('?')[0]);
      const known = Object.entries(ALT_OVERRIDES).find(([name]) => file.endsWith(name));
      if (known) {
        img.setAttribute('alt', known[1]);
        return;
      }
      const card = img.closest('li, a');
      if (card && card.textContent.trim()) img.setAttribute('alt', ''); // decorative next to its title
    });

    // A link that wraps an image plus a heading (the A UN CLIC laptop + "GESTIONES Y
    // TRÁMITES") is split into two links on import, leaving the image link unnamed:
    // give an alt-less image the heading's text (or the link title)
    element.querySelectorAll('a img').forEach((img) => {
      if ((img.getAttribute('alt') || '').trim()) return;
      const link = img.closest('a');
      const heading = link.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading && link.textContent.trim()) return; // text link: the image is decorative
      const text = (heading && heading.textContent.trim()) || (link.getAttribute('title') || '').trim();
      if (!text) return;
      const name = text.toLocaleLowerCase('es');
      img.setAttribute('alt', name.charAt(0).toLocaleUpperCase('es') + name.slice(1));
    });
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

    // Línea Madrid chat: its own last section with an online-chat block. The real chat only
    // runs on www.madrid.es (its gateway accepts that origin only), so the link opens madrid.es.
    if (pagesWithChat.has(element.ownerDocument)) {
      const doc = element.ownerDocument;
      const p = doc.createElement('p');
      const a = doc.createElement('a');
      a.href = 'https://www.madrid.es/portal/site/munimadrid';
      a.textContent = 'Abrir el chat de Línea Madrid en madrid.es';
      p.append(a);
      const block = WebImporter.Blocks.createBlock(doc, { name: 'online-chat', cells: [[p]] });
      element.append(doc.createElement('hr'), block);
    }
  }
}
