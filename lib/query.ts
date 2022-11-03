import { MAVSearch } from './MAV';
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

export const search = async (abortSignal: AbortSignal) => {
  // return [{"price":65,"hash":"22:29#05:02#05:56#07:04#07:23#14:19","details":{"url":"https://jegy.mav.hu","text":"Ab: 22:29","provider":"MAV"}},{"price":56,"hash":"04:30#09:17#09:45#11:59#12:08#14:30#14:37#17:19","details":{"url":"https://jegy.mav.hu","text":"Ab: 04:30","provider":"MAV"}}];
  const searchParams = await parseQuery();
  debug('Searching for', searchParams);
  const mav = new MAVSearch(searchParams, abortSignal);
  const saving = await mav.search();
  debug(JSON.stringify(saving));
  return saving;
};
