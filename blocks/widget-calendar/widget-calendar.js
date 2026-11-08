/**
 * Widget (calendar): a "today" panel beside a month date picker.
 *
 * Authored content: one cell with a link such as
 * `/widgets/activities-calendar.html?agenda=/agenda&dateparam=fecha`.
 * Query params become data attributes on the block (as in the project `widget` block):
 * - `agenda`: URL a picked date navigates to (optional; without it, only an event fires)
 * - `dateparam`: query param name for the picked date (default `fecha`)
 * - `dateformat`: `iso` (yyyy-mm-dd, default) or `dd/mm/yyyy`, as the agenda expects
 * - `lang`: locale for day and month names (default: document language, then `es`)
 * Every pick also dispatches a `widget-calendar:select` event with `detail.date` (ISO).
 * Days before today are shown but cannot be picked, as on www.madrid.es.
 * @param {Element} block The block element
 */

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(date, format) {
  if (format !== 'dd/mm/yyyy') return isoDate(date);
  const [y, m, d] = isoDate(date).split('-');
  return `${d}/${m}/${y}`;
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
    dateFormat: (block.dataset.dateformat || 'iso').toLowerCase(),
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

  // ARIA grid: one tab stop; arrows move by day/week, Home/End within the week,
  // PageUp/PageDown by month (roving tabindex)
  const grid = document.createElement('table');
  grid.className = 'widget-calendar-grid';
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-label', 'Calendario de actividades');
  picker.append(header, grid);
  let focusDate = today; // the day that holds tabindex="0"

  const select = (date) => {
    const iso = isoDate(date);
    block.dispatchEvent(new CustomEvent('widget-calendar:select', { bubbles: true, detail: { date: iso } }));
    if (config.agenda) {
      const target = new URL(config.agenda, window.location.href);
      target.searchParams.set(config.dateParam, formatDate(date, config.dateFormat));
      window.location.href = target.href;
    }
  };

  const render = () => {
    const monthLabel = view.toLocaleDateString(config.locale, { month: 'short' }).replace('.', '');
    title.textContent = `${monthLabel.toLocaleUpperCase()} ${view.getFullYear()}`;
    const prevMonth = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    const nextMonth = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    prev.setAttribute('aria-label', prevMonth.toLocaleDateString(config.locale, { month: 'long', year: 'numeric' }));
    // nothing before the current month can be picked
    prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
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
        const isPast = date < today;
        // past days are plain text; only today and later can be picked
        const day = document.createElement(isPast ? 'span' : 'button');
        if (!isPast) {
          day.type = 'button';
          day.tabIndex = -1;
          day.addEventListener('click', () => select(date));
        }
        day.className = 'widget-calendar-day';
        day.textContent = String(date.getDate());
        day.dataset.date = isoDate(date);
        day.setAttribute('aria-label', date.toLocaleDateString(config.locale, { dateStyle: 'full' }));
        if (date.getMonth() !== view.getMonth()) td.classList.add('widget-calendar-outside');
        if (isPast) td.classList.add('widget-calendar-past');
        if (sameDay(date, today)) {
          td.classList.add('widget-calendar-is-today');
          day.setAttribute('aria-current', 'date');
        }
        td.append(day);
        tr.append(td);
      }
      tbody.append(tr);
      // stop after the week that holds the month's last day
      const weekEnd = start.getDate() + w * 7 + 6;
      const lastShown = new Date(start.getFullYear(), start.getMonth(), weekEnd);
      if (lastShown >= new Date(view.getFullYear(), view.getMonth() + 1, 0)) break;
    }
    grid.replaceChildren(thead, tbody);

    // roving tabindex: the focus day if it is in this month, else the first pickable day
    const inMonth = (d) => d.getMonth() === view.getMonth()
      && d.getFullYear() === view.getFullYear();
    const focusSelector = `button[data-date="${isoDate(focusDate)}"]`;
    let rover = inMonth(focusDate) ? tbody.querySelector(focusSelector) : null;
    if (!rover) {
      rover = [...tbody.querySelectorAll('button.widget-calendar-day')]
        .find((b) => !b.closest('.widget-calendar-outside')) || tbody.querySelector('button.widget-calendar-day');
      if (rover) focusDate = new Date(`${rover.dataset.date}T00:00:00`);
    }
    if (rover) rover.tabIndex = 0;
  };

  const moveFocus = (date) => {
    const target = date < today ? today : date;
    focusDate = target;
    if (target.getMonth() !== view.getMonth() || target.getFullYear() !== view.getFullYear()) {
      view = new Date(target.getFullYear(), target.getMonth(), 1);
    }
    render();
    grid.querySelector(`button[data-date="${isoDate(target)}"]`)?.focus();
  };

  grid.addEventListener('keydown', (e) => {
    const current = e.target.closest('button.widget-calendar-day');
    if (!current) return;
    const d = new Date(`${current.dataset.date}T00:00:00`);
    const weekday = (d.getDay() + 6) % 7; // Monday = 0
    const steps = {
      ArrowLeft: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1),
      ArrowRight: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      ArrowUp: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7),
      ArrowDown: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7),
      Home: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() - weekday),
      End: () => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - weekday)),
      PageUp: () => new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()),
      PageDown: () => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
    };
    if (!steps[e.key]) return;
    e.preventDefault();
    moveFocus(steps[e.key]());
  });

  prev.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    render();
  });
  next.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    render();
  });

  render();
  const todayPanel = buildToday(today, config.locale);
  block.replaceChildren(todayPanel, picker);

  // long month names (SEPTIEMBRE) would overflow the today column: shrink to fit
  const month = todayPanel.querySelector('.widget-calendar-today-month');
  const fitMonth = () => {
    month.style.fontSize = '';
    if (!month.clientWidth) return; // panel hidden below desktop
    let size = parseFloat(getComputedStyle(month).fontSize);
    while (month.scrollWidth > month.clientWidth && size > 16) {
      size -= 1;
      month.style.fontSize = `${size}px`;
    }
  };
  new ResizeObserver(fitMonth).observe(todayPanel);
  document.fonts?.ready.then(fitMonth);
}
