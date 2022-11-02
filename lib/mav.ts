import { search } from 'fast-fuzzy';
import assert from 'assert';
import { debug, formatTime } from './utils';

const searchApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetOfferRequest';
const stationApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetStationList';

const searchReq = async (data: any) => {
  const response = await fetch(searchApi, {
    method: 'POST',
    headers: {
      UserSessionId: '810aaff1-cec2-4ee3-88b6-9535bb15e4b1',
      'Content-Type': 'application/json; charset=utf-8',
      Language: 'en',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const defaultParams = {
  offerkind: '4',
  passangers: [{
    passengerId: 0,
    passengerCount: 1,
    customerTypeKey: '52_018-199',
    customerDiscountsKeys: [],
  }],
  isOneWayTicket: true,
  isSupplementaryTicketsOnly: false,
  isOfDetailedSearch: false,
  eszkozSzamok: [],
  selectedServices: [50],
  selectedSearchServices: ['BUDAPESTI_HELYI_KOZLEKEDESSEL'],
};

const loadStationList = async (): Promise<Array<MAVStation>> => {
  let { stationList } = await browser.storage.local.get('stationList');
  if (!stationList) {
    debug('Loading station list from API');
    const raw = await fetch(stationApi, { method: 'POST' });
    stationList = await raw.json();
    browser.storage.local.set({ stationList });
  }
  return stationList;
};

const findStationCode = async (stationName: string) => {
  const stationList = await loadStationList();
  return search(stationName, stationList, { keySelector: (station) => station.name })[0].code;
};

const transformQuery = async (params: SearchParams, mode: 'append' | 'prepend'): Promise<MAVSearchParams> => {
  const BUDAPEST = await findStationCode('Budapest');
  const origin = await findStationCode(params.origin);
  const destination = await findStationCode(params.destination);

  const stops = [origin, destination];
  if (mode === 'prepend') {
    if (origin !== BUDAPEST) stops.unshift(BUDAPEST);
  } else if (destination !== BUDAPEST) stops.push(BUDAPEST);

  let time = params.date;
  const BUDAPEST_BERLIN_OFFSET = 11 * 60 * 60; // 11 hours
  if (mode === 'prepend' && params.isDeparture) {
    time = new Date(time.getTime() - BUDAPEST_BERLIN_OFFSET);
  }
  if (mode === 'append' && !params.isDeparture) {
    time = new Date(time.getTime() + BUDAPEST_BERLIN_OFFSET);
  }

  return {
    ...defaultParams,
    startStationCode: stops[0],
    innerStationsCodes: [{
      stationCode: stops[1],
      durationOfStay: 0,
    }],
    endStationCode: stops[2],
    travelStartDate: time.toISOString(),
    travelReturnDate: new Date(time.getTime() + 30 * 60 * 1000).toISOString(), // + 30 min
    isTravelEndTime: !params.isDeparture,
  };
};

const parsePrice = (price: any): Number => {
  assert(price.currency.uicCode === 'EUR', 'Only EUR currency is supported');
  return parseInt(price.amount, 10);
};

const parseJourney = (journey: any, mode: 'append' | 'prepend'): Journey => {
  const prices = journey.travelClasses.map((c: any) => parsePrice(c.price))
    .filter((p: Number) => p > 0);
  const price = Math.min(...prices) ?? Infinity;
  const hash = journey.details.routes.filter(
    (s: any) => s.travelTime !== null,
  )
    .map(
      (s: any) => `${formatTime(s.departure.time)}#${formatTime(s.arrival.time)}`,
    )
    .join('#');

  const isDep = mode === 'append';
  const timeInfo = `${isDep ? 'Ab' : 'An'}: ${formatTime(journey[isDep ? 'departure' : 'arrival'].time)}`;

  return {
    price,
    hash,
    details: {
      url: 'https://jegy.mav.hu',
      text: timeInfo,
      provider: 'MAV',
    },
  };
};

const parseResponse = (res: any, mode: 'append' | 'prepend'): Array<Journey> => res.route.map(
  (journey: any) => parseJourney(journey, mode),
);

const makeQuery = async (params: SearchParams, mode: 'append' | 'prepend') => {
  const transformed = await transformQuery(params, mode);
  debug(JSON.stringify(transformed));
  const res = await searchReq(transformed);
  debug(res);
  return parseResponse(res, mode);
};

export const findJourney = async (params: SearchParams): Promise<Array<Journey>> => {
  // throw new Error('Not implemented');
  const A = await makeQuery(params, 'prepend');
  const B = await makeQuery(params, 'append');
  return [...A, ...B];
};
