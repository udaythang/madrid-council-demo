const TOKEN = /:([a-z0-9-]+):/i;

/**
 * Finds the tile's icon name and strips its authored marker from the row.
 * Handles `<span class="icon icon-name">` (Document Authoring; decorateIcons may have
 * added an <img> pointing at a missing /icons/name.svg) and a plain `:name:` text token.
 * @param {Element} row the block row
 * @returns {string|null} the icon name
 */
function extractIcon(row) {
  const span = row.querySelector('span.icon');
  if (span) {
    const name = [...span.classList].find((c) => c.startsWith('icon-'))?.slice(5) || null;
    span.remove();
    return name;
  }

  let name = null;
  const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !name) {
    const match = !node.parentElement.closest('a') && node.textContent.match(TOKEN);
    if (match) {
      [, name] = match;
      node.textContent = node.textContent.replace(match[0], '');
    }
    node = walker.nextNode();
  }
  return name ? name.toLowerCase() : null;
}

/**
 * Cards (topics): icon-font tiles with a single link label.
 * One row per tile, one cell: an :icon: token and a link. Extra cells are merged.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const iconName = extractIcon(row);
    const link = row.querySelector('a[href]');
    if (!iconName && !link && !row.textContent.trim()) return; // empty row

    const li = document.createElement('li');
    li.className = 'cards-topics-item';
    if (iconName) li.dataset.icon = iconName;

    // the glyph comes from the Madrid icon font (see cards-topics.css)
    const icon = document.createElement('span');
    icon.className = 'cards-topics-icon';
    icon.setAttribute('aria-hidden', 'true');

    if (link) {
      link.classList.add('cards-topics-link');
      const label = document.createElement('span');
      label.className = 'cards-topics-label';
      label.append(...link.childNodes);
      label.textContent = label.textContent.trim();
      link.replaceChildren(icon, label);
      li.append(link);
    } else {
      // no link authored: keep whatever is there
      const body = document.createElement('div');
      body.className = 'cards-topics-label';
      [...row.children].forEach((cell) => body.append(...cell.childNodes));
      li.append(icon, body);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
