import { findJourney } from './mav';

const parseDate = (dateString: string | null, timeString: string | null) => {
  if (!dateString || !timeString) return new Date();
  dateString = dateString.substring(dateString.indexOf(',') + 1);
  dateString.trimLeft();
  const [day, month, year] = dateString.split('.')
    .map((s) => parseInt(s, 10));
  const [hour, minute] = timeString.split(':')
    .map((s) => parseInt(s, 10));
  return new Date(year, month - 1, day, hour, minute);
};

const parseQuery = async () => {
  const urlParams = new URLSearchParams(document.location.search);

  const searchParams: SearchParams = {
    origin: urlParams.get('S') ?? '',
    destination: urlParams.get('Z') ?? '',
    date: parseDate(urlParams.get('date'), urlParams.get('time')),
    isDeparture: urlParams.get('timesel') === 'depart',
  };

  return searchParams;
};

export const search = async () => {
  const searchParams = await parseQuery();
  console.debug('Searching for', searchParams);
  const saving = await findJourney(searchParams);
  console.log(JSON.stringify(saving));
  return saving;
};
