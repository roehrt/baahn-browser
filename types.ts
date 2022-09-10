type SearchParams = {
  origin: string,
  destination: string,
  date: Date,
  isDeparture: boolean,
};

type MAVPassenger = {
  passengerId: Number,
  passengerCount: Number,
  customerTypeKey: string,
  customerDiscountsKeys: Array<string>,
};

type MAVSearchParams = {
  offerkind: string,
  startStationCode: string,
  innerStationsCodes: Array<{
    stationCode: string,
    durationOfStay: Number,
  }>,
  endStationCode: string,
  passangers: Array<MAVPassenger>,
  isOneWayTicket: boolean,
  isTravelEndTime: boolean,
  isSupplementaryTicketsOnly: boolean,
  travelStartDate: string,
  travelReturnDate: string,
  selectedServices: Array<string>,
  selectedSearchServices: Array<string>,
  eszkozSzamok: Array<any>,
  isOfDetailedSearch: boolean,
};

type MAVStation = {
  id: string,
  name: string,
  code: string,
};

type JourneyHash = {
  price: number,
  hash: string,
};

type Ticket = JourneyHash & {
  elem: Element,
};

type Saving = {
  price: number,
  provider: 'MAV' | 'DB',
  journeys?: Array<JourneyHash>,
};

declare module 'bundle-text:*' {
  const value: string;
  export default value;
}
