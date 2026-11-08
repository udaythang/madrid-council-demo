/* eslint-disable */
/* global WebImporter */

// Import script for the "homepage" template.
// Source: https://www.madrid.es/portal/site/munimadrid -> /index

import heroSeasonalParser from './parsers/hero-seasonal.js';
import cardsTopicsParser from './parsers/cards-topics.js';
import columnsMostViewedParser from './parsers/columns-most-viewed.js';
import cardsNewsMosaicParser from './parsers/cards-news-mosaic.js';
import cardsTilesParser from './parsers/cards-tiles.js';
import widgetCalendarParser from './parsers/widget-calendar.js';
import cardsFeaturesParser from './parsers/cards-features.js';
import cardsLiveInfoParser from './parsers/cards-live-info.js';
import tabsProfilesParser from './parsers/tabs-profiles.js';

import madridCleanupTransformer from './transformers/madrid-cleanup.js';
import madridSectionsTransformer from './transformers/madrid-sections.js';

const PAGE_TEMPLATE = {
  "name": "homepage",
  "urls": [
    "https://www.madrid.es/portal/site/munimadrid"
  ],
  "representativeUrl": "https://www.madrid.es/portal/site/munimadrid",
  "description": "Madrid City Council homepage, imported as /index",
  "urlPattern": "/portal/site/*",
  "blocks": [
    {
      "name": "hero-seasonal",
      "instances": [
        "header.header--main .section-cont img#section-image",
        "img#section-image"
      ]
    },
    {
      "name": "cards-topics",
      "instances": [
        "header.header--main ul#carouselHomeCorregido > li",
        "ul#carouselHomeCorregido > li"
      ]
    },
    {
      "name": "columns-most-viewed",
      "instances": [
        "#wrapper > div.bg-fluid1.fluid1--main.navigation-bar--desktop .most-watched",
        ".navigation-bar--desktop .most-watched"
      ]
    },
    {
      "name": "cards-news-mosaic",
      "instances": [
        ".actualidad div.row > ul > li"
      ]
    },
    {
      "name": "cards-tiles",
      "instances": [
        ".a-un-clic .col-md-9 > ul.row > li",
        ".actividades ul.row > li.info_relevant-second-row"
      ]
    },
    {
      "name": "widget-calendar",
      "instances": [
        ".actividades .calendario"
      ]
    },
    {
      "name": "cards-features",
      "instances": [
        ".tu-formas-parte ul.carouselFormasParteReajustado > li"
      ]
    },
    {
      "name": "cards-live-info",
      "instances": [
        ".al-minuto ul.row > li"
      ]
    },
    {
      "name": "tabs-profiles",
      "instances": [
        ".te_interesa_content .tabspanel"
      ]
    }
  ],
  "sections": [
    {
      "id": "s1",
      "name": "Seasonal hero and topic tiles",
      "selector": [
        "header.header--main .section-cont",
        "header.header--main .contenedorContenedorCarouselCorregido"
      ],
      "style": null,
      "blocks": [
        "hero-seasonal",
        "cards-topics"
      ],
      "defaultContent": []
    },
    {
      "id": "s2",
      "name": "Lo más visto",
      "selector": [
        "#wrapper > div.bg-fluid1.fluid1--main.navigation-bar--desktop",
        ".navigation-bar--desktop"
      ],
      "style": "light-grey",
      "blocks": [
        "columns-most-viewed"
      ],
      "defaultContent": []
    },
    {
      "id": "s3",
      "name": "Es noticia",
      "selector": [
        "#wrapper > div.content > div.bg-fluid1",
        "div.bg-fluid1:has(.actualidad)"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-news-mosaic"
      ],
      "defaultContent": [
        ".actualidad h2.title4Inicio",
        ".actualidad .info_relevant_img_ext a",
        ".actualidad > .container > ul.list-inline"
      ]
    },
    {
      "id": "s4",
      "name": "A un clic",
      "selector": [
        "div.bg-fluid0:has(.a-un-clic)",
        "#wrapper > div.content > div.bg-fluid0:nth-of-type(2)"
      ],
      "style": "split",
      "blocks": [
        "cards-tiles"
      ],
      "defaultContent": [
        ".a-un-clic h2.title4",
        ".a-un-clic .featured_clic"
      ]
    },
    {
      "id": "s5",
      "name": "Y también en tu ciudad (agenda)",
      "selector": [
        "div.bg-fluid0:has(.actividades)",
        "#wrapper > div.content > div.bg-fluid0:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "widget-calendar",
        "cards-tiles"
      ],
      "defaultContent": [
        ".actividades h3.actividades__title",
        ".actividades ul.list-inline"
      ]
    },
    {
      "id": "s6",
      "name": "Descubre el Madrid que te gusta",
      "selector": [
        "div.Panel:has(.tu-formas-parte)",
        ".tu-formas-parte"
      ],
      "style": "light-grey, centered",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": [
        ".tu-formas-parte h2.title5"
      ]
    },
    {
      "id": "s7",
      "name": "Madrid al minuto",
      "selector": [
        "div.Panel:has(.al-minuto)",
        ".al-minuto"
      ],
      "style": null,
      "blocks": [
        "cards-live-info"
      ],
      "defaultContent": [
        ".al-minuto h2.title4",
        ".al-minuto p.date"
      ]
    },
    {
      "id": "s8",
      "name": "Lo que te interesa",
      "selector": [
        "div.Panel:has(.te_interesa_content)",
        ".te_interesa_content"
      ],
      "style": "light-grey",
      "blocks": [
        "tabs-profiles"
      ],
      "defaultContent": [
        ".te_interesa_content > .container h2.title4"
      ]
    }
  ]
};

// Source paths that map to a fixed document path.
const PATH_MAP = {
  '/portal/site/munimadrid': '/index',
};

const parsers = {
  'hero-seasonal': heroSeasonalParser,
  'cards-topics': cardsTopicsParser,
  'columns-most-viewed': columnsMostViewedParser,
  'cards-news-mosaic': cardsNewsMosaicParser,
  'cards-tiles': cardsTilesParser,
  'widget-calendar': widgetCalendarParser,
  'cards-features': cardsFeaturesParser,
  'cards-live-info': cardsLiveInfoParser,
  'tabs-profiles': tabsProfilesParser,
};

const transformers = [
  madridCleanupTransformer,
  madridSectionsTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); } catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); } catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    // transformBackgroundImages is skipped: the only CSS background on this
    // template is the decorative agenda skyline (bg_actualidad.png).
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const mapped = PATH_MAP[rawPath] || (rawPath === '' ? '/index' : rawPath);
    const path = WebImporter.FileUtils.sanitizePath(mapped);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: [...new Set(pageBlocks.map((b) => b.name))] },
    }];
  },
};
