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
  selectedServices: Array<Number>,
  selectedSearchServices: Array<string>,
  eszkozSzamok: Array<any>,
  isOfDetailedSearch: boolean,
};

type MAVStation = {
  id: string,
  name: string,
  code: string,
};

declare module 'bundle-text:*' {
  const value: string;
  export default value;
}
