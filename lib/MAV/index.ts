import { search } from 'fast-fuzzy';
import assert from 'assert';
import { debug, formatTime } from '../utils';

export class MAVSearch {
  private searchApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetOfferRequest';
  private stationApi = 'https://jegy-a.mav.hu/IK_API_PROD/api/OfferRequestApi/GetStationList';

  private defaultParams = {
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

  private params: SearchParams;

  private abortSignal: AbortSignal;

  constructor(params: SearchParams, abortSignal: AbortSignal) {
    this.params = params;
    this.abortSignal = abortSignal;
  }

  private async searchReq(data: any) {
    const response = await fetch(this.searchApi, {
      method: 'POST',
      headers: {
        UserSessionId: '810aaff1-cec2-4ee3-88b6-9535bb15e4b1',
        'Content-Type': 'application/json; charset=utf-8',
        Language: 'en',
      },
      body: JSON.stringify(data),
      signal: this.abortSignal,
    });
    return response.json();
  }

  private async loadStationList(): Promise<Array<MAVStation>> {
    let { stationList } = await browser.storage.local.get('stationList');
    if (!stationList) {
      debug('Loading station list from API');
      const raw = await fetch(this.stationApi, { method: 'POST' });
      stationList = await raw.json();
      browser.storage.local.set({ stationList });
    }
    return stationList;
  }

  private async findStationCode(stationName: string) {
    const stationList = await this.loadStationList();
    return search(stationName, stationList, { keySelector: (station) => station.name })[0].code;
  }

  private async transformQuery(mode: 'append' | 'prepend'): Promise<MAVSearchParams> {
    const BUDAPEST = await this.findStationCode('Budapest');
    const origin = await this.findStationCode(this.params.origin);
    const destination = await this.findStationCode(this.params.destination);

    const stops = [origin, destination];
    if (mode === 'prepend') {
      if (origin !== BUDAPEST) stops.unshift(BUDAPEST);
    } else if (destination !== BUDAPEST) stops.push(BUDAPEST);

    let time = this.params.date;
    const BUDAPEST_BERLIN_OFFSET = 11 * 60 * 60; // 11 hours
    if (mode === 'prepend' && this.params.isDeparture) {
      time = new Date(time.getTime() - BUDAPEST_BERLIN_OFFSET);
    }
    if (mode === 'append' && !this.params.isDeparture) {
      time = new Date(time.getTime() + BUDAPEST_BERLIN_OFFSET);
    }

    return {
      ...this.defaultParams,
      startStationCode: stops[0],
      innerStationsCodes: [{
        stationCode: stops[1],
        durationOfStay: 0,
      }],
      endStationCode: stops[2],
      travelStartDate: time.toISOString(),
      travelReturnDate: new Date(time.getTime() + 30 * 60 * 1000).toISOString(), // + 30 min
      isTravelEndTime: !this.params.isDeparture,
    };
  }

  private parsePrice(price: any): Number {
    assert(price.currency.uicCode === 'EUR', 'Only EUR currency is supported');
    return parseInt(price.amount, 10);
  }

  private parseJourney(journey: any, mode: 'append' | 'prepend'): Journey {
    const prices = journey.travelClasses.map((c: any) => this.parsePrice(c.price))
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
    const timeInfo = `<span class="baahn-popup__time-kind">${isDep ? 'Ab' : 'An'}</span> ${formatTime(journey[isDep ? 'departure' : 'arrival'].time)}`;

    return {
      price,
      hash,
      details: {
        url: 'https://jegy.mav.hu',
        text: timeInfo,
        provider: '<dfn title="MÁV ist die staatliche ungarische Eisenbahngesellschaft">MÁV</dfn>',
      },
    };
  };

  private parseResponse = (res: any, mode: 'append' | 'prepend'): Array<Journey> => res.route.map(
    (journey: any) => this.parseJourney(journey, mode),
  );

  private async makeQuery (mode: 'append' | 'prepend') {
    const transformed = await this.transformQuery(mode);
    debug(JSON.stringify(transformed));
    const res = await this.searchReq(transformed);
    debug(res);
    return this.parseResponse(res, mode);
  }

  public async search(): Promise<Array<Journey>> {
    // throw new Error('Not implemented');
    const A = await this.makeQuery('prepend');
    const B = await this.makeQuery('append');
    return [...A, ...B];
  }
}