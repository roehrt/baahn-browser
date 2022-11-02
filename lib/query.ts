import { findJourney } from './MAV';
import { debug } from './utils';

const parseDate = (dateString: string | null, timeString: string | null) => {
  if (!dateString || !timeString) return new Date();
  dateString.trim();
  timeString.trim();
  // eslint-disable-next-line prefer-const
  let [day, month, year] = dateString.split('.')
    .map((s) => parseInt(s, 10));
  const [hour, minute] = timeString.split(':')
    .map((s) => parseInt(s, 10));
  if (year < 1000) year += 2000;
  debug(`Parsed date: ${day}.${month}.${year} ${hour}:${minute}`);
  return new Date(year, month - 1, day, hour, minute);
};

const parseQuery = async () => {
  const origin = document.querySelector('.conSummaryDep')?.innerHTML ?? '';
  const destination = document.querySelector('.conSummaryArr')?.innerHTML ?? '';
  const date = document.querySelector('#tp_overview_headline_date')?.innerHTML ?? '';
  const timestr = document.querySelector('.conSummaryTime')?.innerHTML ?? '';

  const timesel = timestr.trim().slice(0, 2).toLowerCase();
  const time = timestr.trim().slice(3);

  debug(timesel, time);

  const searchParams: SearchParams = {
    origin,
    destination,
    date: parseDate(date, time),
    isDeparture: timesel.trim().toLowerCase() === 'ab',
  };

  return searchParams;
};

export const search = async () => {
  const searchParams = await parseQuery();
  debug('Searching for', searchParams);
  const saving = await findJourney(searchParams);
  debug(JSON.stringify(saving));
  return saving;
};
