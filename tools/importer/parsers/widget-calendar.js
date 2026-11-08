/* eslint-disable */
/* global WebImporter */

/**
 * Parser for widget-calendar (madrid.es agenda "today" panel + date picker).
 * Source: .actividades .calendario (a JS datepicker; no authorable content).
 * Model: 1 row, 1 cell: a link to /widgets/activities-calendar.html with
 * optional query params agenda / dateparam / lang.
 * The source markup carries no agenda search URL (day links are "#"): the
 * datepicker JS opens MADRID_AGENDA with fechaAccesible=dd/mm/yyyy, so that is
 * the default when the markup holds no real URL.
 */
const MADRID_AGENDA = {
  agenda: 'https://www.madrid.es/portales/munimadrid/es/Inicio/Agenda?vgnextfmt=default&vgnextchannel=ca9671ee4a9eb410VgnVCM100000171f5a0aRCRD&cuando=cuandoDia&enviar=Buscar&newSearch=true&unfolded=true',
  dateparam: 'fechaAccesible',
  dateformat: 'dd/mm/yyyy',
};

export default function parse(element, { document }) {
  const url = new URL('/widgets/activities-calendar.html', 'https://example.com');

  // agenda search URL for picked dates, if the markup carries one
  const agendaSource = [
    element.getAttribute('data-agenda'),
    element.getAttribute('data-url'),
    ...[...element.querySelectorAll('[data-agenda], [data-url], form[action]')]
      .map((el) => el.getAttribute('data-agenda') || el.getAttribute('data-url') || el.getAttribute('action')),
    ...[...element.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  ].find((href) => href && href.trim() && !href.trim().startsWith('#') && !/^javascript:/i.test(href.trim()));

  if (agendaSource) {
    try {
      const agenda = new URL(agendaSource.trim(), 'https://www.madrid.es');
      const dateParam = [...agenda.searchParams.keys()].find((k) => /fecha|date/i.test(k));
      if (dateParam) {
        agenda.searchParams.delete(dateParam);
        url.searchParams.set('dateparam', dateParam);
      }
      url.searchParams.set('agenda', agenda.href);
    } catch (e) {
      // malformed URL: leave agenda out
    }
  }

  const lang = (document.documentElement && document.documentElement.getAttribute('lang')) || '';
  url.searchParams.set('lang', lang ? lang.split('-')[0].toLowerCase() : 'es');
  if (!url.searchParams.has('agenda')) {
    Object.entries(MADRID_AGENDA).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const a = document.createElement('a');
  const href = `${url.pathname}${url.search}`;
  a.href = href;
  a.textContent = href;

  const cells = [[a]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-calendar', cells });

  // The calendar sits in an li of the agenda list; a block table must not stay
  // inside a list, so place it before that list and drop the emptied li/list.
  const li = element.closest('li');
  const list = li && li.parentElement && /^(UL|OL)$/.test(li.parentElement.tagName) ? li.parentElement : null;
  element.replaceWith(block);
  if (list) {
    list.before(block);
    if (!li.textContent.trim() && !li.querySelector('img, a, table')) li.remove();
    if (!list.querySelector('li')) list.remove();
  }
}
