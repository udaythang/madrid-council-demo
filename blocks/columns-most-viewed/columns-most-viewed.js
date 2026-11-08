/**
 * Columns (most viewed): a label beside a single-line rail of links.
 * One row, two cells: [label] [list of links]. If only one cell is authored and it
 * holds links, it is treated as the list.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const listCell = cells.find((c) => c.querySelector('a[href]'));
  const labelCell = cells.find((c) => c !== listCell && c.textContent.trim());

  const label = document.createElement('div');
  label.className = 'columns-most-viewed-label';
  if (labelCell) label.append(...labelCell.childNodes);

  const rail = document.createElement('nav');
  rail.className = 'columns-most-viewed-links';
  const labelText = label.textContent.trim();
  if (labelText) rail.setAttribute('aria-label', labelText);

  const ul = document.createElement('ul');
  const links = listCell ? [...listCell.querySelectorAll('a[href]')] : [];
  links.forEach((a) => {
    const li = document.createElement('li');
    // full titles can be long; keep them in a tooltip when the rail truncates
    const text = a.textContent.trim();
    if (text && !a.title) a.title = text;
    li.append(a);
    ul.append(li);
  });
  rail.append(ul);

  block.replaceChildren();
  if (labelText || label.children.length) block.append(label);
  if (links.length) block.append(rail);
}
