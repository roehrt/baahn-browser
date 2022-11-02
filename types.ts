type SearchParams = {
  origin: string,
  destination: string,
  date: Date,
  isDeparture: boolean,
};

type JourneyHash = {
  price: number,
  hash: string,
};

type Journey = JourneyHash & {
  details: {
    url: string,
    text: string,
    provider: 'MAV' | 'DB',
  }
};

type Ticket = Journey & {
  elem: Element,
};

declare module 'bundle-text:*' {
  const value: string;
  export default value;
}
