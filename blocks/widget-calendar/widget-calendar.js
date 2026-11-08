/**
 * Widget (calendar): a "today" panel beside a month date picker.
 *
 * Authored content: one cell with a link such as
 * `/widgets/activities-calendar.html?agenda=/agenda&dateparam=fecha`.
 * Query params become data attributes on the block (as in the project `widget` block):
 * - `agenda`: URL a picked date navigates to (optional; without it, only an event fires)
 * - `dateparam`: query param name for the picked date (default `fecha`, ISO yyyy-mm-dd)
 * - `lang`: locale for day and month names (default: document language, then `es`)
 * Every pick also dispatches a `widget-calendar:select` event with `detail.date`.
 * @param {Element} block The block element
 */

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function capitalize(text) {
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text;
}

function readConfig(block) {
  const source = block.querySelector('a[href]');
  if (source) {
    try {
      const url = new URL(source.href, window.location.href);
      block.dataset.source = url.href;
      url.searchParams.forEach((value, key) => { block.dataset[key] = value; });
    } catch {
      // malformed link: fall back to defaults
    }
  }
  const lang = block.dataset.lang || document.documentElement.lang || 'es';
  let locale = 'es';
  try {
    [locale] = Intl.getCanonicalLocales(lang);
  } catch {
    // unsupported locale tag: keep the default
  }
  return {
    locale,
    agenda: block.dataset.agenda || '',
    dateParam: block.dataset.dateparam || 'fecha',
  };
}

function buildToday(today, locale) {
  const panel = document.createElement('div');
  panel.className = 'widget-calendar-today';
  const weekday = document.createElement('span');
  weekday.className = 'widget-calendar-today-weekday';
  weekday.textContent = capitalize(today.toLocaleDateString(locale, { weekday: 'long' }));
  const day = document.createElement('span');
  day.className = 'widget-calendar-today-day';
  day.textContent = String(today.getDate());
  const month = document.createElement('span');
  month.className = 'widget-calendar-today-month';
  month.textContent = today.toLocaleDateString(locale, { month: 'long' });
  panel.append(weekday, day, month);
  return panel;
}

export default function decorate(block) {
  const config = readConfig(block);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);

  const picker = document.createElement('div');
  picker.className = 'widget-calendar-month';

  const header = document.createElement('div');
  header.className = 'widget-calendar-month-header';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'widget-calendar-nav widget-calendar-prev';
  prev.textContent = '‹';
  const title = document.createElement('span');
  title.className = 'widget-calendar-month-title';
  title.setAttribute('aria-live', 'polite');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'widget-calendar-nav widget-calendar-next';
  next.textContent = '›';
  header.append(prev, title, next);

  const grid = document.createElement('table');
  grid.className = 'widget-calendar-grid';
  grid.setAttribute('role', 'grid');
  picker.append(header, grid);

  const select = (date) => {
    const iso = isoDate(date);
    block.dispatchEvent(new CustomEvent('widget-calendar:select', { bubbles: true, detail: { date: iso } }));
    if (config.agenda) {
      const target = new URL(config.agenda, window.location.href);
      target.searchParams.set(config.dateParam, iso);
      window.location.href = target.href;
    }
  };

  const render = () => {
    const monthLabel = view.toLocaleDateString(config.locale, { month: 'short' }).replace('.', '');
    title.textContent = `${monthLabel.toLocaleUpperCase()} ${view.getFullYear()}`;
    const prevMonth = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    const nextMonth = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    prev.setAttribute('aria-label', prevMonth.toLocaleDateString(config.locale, { month: 'long', year: 'numeric' }));
    next.setAttribute('aria-label', nextMonth.toLocaleDateString(config.locale, { month: 'long', year: 'numeric' }));

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    // weeks start on Monday; 2024-01-01 was a Monday
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(2024, 0, 1 + i);
      const th = document.createElement('th');
      th.scope = 'col';
      th.abbr = d.toLocaleDateString(config.locale, { weekday: 'long' });
      th.textContent = d.toLocaleDateString(config.locale, { weekday: 'narrow' }).toLocaleUpperCase();
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    const offset = (view.getDay() + 6) % 7; // Monday = 0
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
    for (let w = 0; w < 6; w += 1) {
      const tr = document.createElement('tr');
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
        const td = document.createElement('td');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'widget-calendar-day';
        btn.textContent = String(date.getDate());
        btn.dataset.date = isoDate(date);
        btn.setAttribute('aria-label', date.toLocaleDateString(config.locale, { dateStyle: 'full' }));
        if (date.getMonth() !== view.getMonth()) td.classList.add('widget-calendar-outside');
        if (date < today) td.classList.add('widget-calendar-past');
        if (sameDay(date, today)) {
          td.classList.add('widget-calendar-is-today');
          btn.setAttribute('aria-current', 'date');
        }
        btn.addEventListener('click', () => select(date));
        td.append(btn);
        tr.append(td);
      }
      tbody.append(tr);
      // stop after the week that holds the month's last day
      const weekEnd = start.getDate() + w * 7 + 6;
      const lastShown = new Date(start.getFullYear(), start.getMonth(), weekEnd);
      if (lastShown >= new Date(view.getFullYear(), view.getMonth() + 1, 0)) break;
    }
    grid.replaceChildren(thead, tbody);
  };

  prev.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    render();
  });
  next.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    render();
  });

  render();
  block.replaceChildren(buildToday(today, config.locale), picker);
}
