import { search } from 'fast-fuzzy';
import assert from 'assert';
import { formatTime } from './utils';

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
  isOfDetailedSearch: true,
  eszkozSzamok: [],
  selectedServices: ['50'],
  selectedSearchServices: ['BUDAPESTI_HELYI_KOZLEKEDESSEL'],
};

const loadStationList = async (): Promise<Array<MAVStation>> => {
  let { stationList } = await browser.storage.local.get('stationList');
  if (!stationList) {
    console.info('Loading station list from API');
    const raw = await fetch(stationApi, { method: 'POST' });
    const res = await raw.json();
    stationList = res;
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

  return {
    ...defaultParams,
    startStationCode: stops[0],
    innerStationsCodes: [{
      stationCode: stops[1],
      durationOfStay: 0,
    }],
    endStationCode: stops[2],
    travelStartDate: params.date.toISOString(),
    travelReturnDate: new Date(params.date.getTime() + 30 * 60 * 1000).toISOString(), // + 30 min
    isTravelEndTime: !params.isDeparture,
  };
};

const parsePrice = (price: any): Number => {
  assert(price.currency.uicCode === 'EUR', 'Only EUR currency is supported');
  return parseInt(price.amount, 10);
};

const parseJourney = (journey: any): JourneyHash => {
  const prices = journey.travelClasses.map((c: any) => parsePrice(c.price))
    .filter((p: Number) => p > 0);
  const price = Math.min(...prices) ?? Infinity;
  const hash = journey.details.routes.map(
    (s: any) => `${formatTime(s.departure.time)}#${formatTime(s.arrival.time)}`,
  ).join('#');

  return {
    price,
    hash,
  };
};

const parseResponse = (res: any): Array<JourneyHash> => res.route.map((journey: any) => parseJourney(journey));

const makeQuery = async (params: SearchParams, mode: 'append' | 'prepend') => {
  const transformed = await transformQuery(params, mode);
  const res = await searchReq(transformed);
  const journeys = parseResponse(res);
  return {
    price: Math.min(...journeys.map((j) => j.price)),
    journeys,
  };
};

export const findJourney = async (params: SearchParams): Promise<Saving> => {
  const A = await makeQuery(params, 'prepend');
  const B = await makeQuery(params, 'append');
  return {
    price: Math.min(A.price, B.price),
    provider: 'MAV',
    journeys: A.journeys.concat(B.journeys),
  };
};
