import {
  debug, formatPrice, parsePrice, retryQuerySelectorAll,
} from './utils';
import { Popup } from './baahn-popup';

export class Manager {
  private readonly popup: Popup;

  private tickets: Array<Ticket> | null = null;

  private readonly uiRoot = document.getElementById('doc') ?? document.body;

  constructor() {
    this.popup = new Popup(this.uiRoot);
  }

  private static openDetails(elem: Element) {
    const details = elem.querySelector('a.iconLink.open') as HTMLAnchorElement;
    details?.click();
  }

  private static closeDetails(elem: Element) {
    const details = elem.querySelector('a.iconLink.close') as HTMLAnchorElement;
    details?.click();
  }

  private static async hashJourney(elem: Element): Promise<string> {
    Manager.openDetails(elem);
    debug('Waiting for details to load');

    const times = await retryQuerySelectorAll(elem, '.sectionDeparture .time, .sectionArrival .time', 200, 10);

    const hash = Array.from(times)
      .map((e: Element) => (e as HTMLElement).innerText.match(/\d{2}:\d{2}/)?.[0]);

    Manager.closeDetails(elem);
    return hash.join('#');
  }

  private static async parseTicket(elem: Element): Promise<Ticket> {
    const priceElem = elem.querySelector('.fareOutput');
    const price = priceElem ? parsePrice(
      (priceElem as HTMLElement).innerText.match(/\d+,\d+/)?.[0] ?? 'Infinity',
    ) : Infinity;
    const hash = await Manager.hashJourney(elem);
    return {
      elem,
      price,
      hash,
      details: {
        provider: 'DB',
        url: 'https://www.bahn.de',
        text: 'Deutsche Bahn',
      },
    };
  }

  private async parseTickets(): Promise<Array<Ticket>> {
    const tickets = await Promise.all(
      Array.from(this.uiRoot.querySelectorAll('.overviewConnection'))
        .map(Manager.parseTicket),
    );
    return tickets.filter((t) => t !== null && t.hash !== '' && t.price < Infinity);
  }

  public async loadTickets() {
    this.tickets = await this.parseTickets();
    debug('Tickets loaded', this.tickets);
  }

  public async addSaving(journeys: Array<Journey>) {
    if (this.tickets === null) await this.loadTickets();
    this.popup.addSaving(journeys);
    const updates: { [key: string]: Ticket } = {};

    journeys.forEach((journey) => {
      const ticket = this.tickets?.find((t) => journey.hash.startsWith(t.hash) || journey.hash.endsWith(t.hash));
      if (!ticket) return;
      if (ticket.price > journey.price && (updates[ticket.hash]?.price ?? Infinity) > journey.price) {
        updates[ticket.hash] = {
          elem: ticket.elem,
          ...journey,
        };
      }
    });
    for (const journey of Object.values(updates)) {
      const fare = journey?.elem?.querySelector('.fareOutput');
      if (journey && fare) {
        fare.innerHTML += ' <span class="baahn-badge">'
          + `${formatPrice(journey.price)} € mit <span class="baahn-provider">${journey.details.provider}</span>`
          + '</span>';
      }
    }
  }

  public setError(error: Error) {
    this.popup.setError(error);
  }
}
