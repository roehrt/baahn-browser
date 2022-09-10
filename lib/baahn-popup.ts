import POPUP_HTML from 'bundle-text:./popup.html';
import { search } from './query';
import { formatPrice, parsePrice } from './utils';

class Popup {
  private readonly container: HTMLElement;

  private readonly status: HTMLElement;

  private readonly rootClass = 'baahn-popup';

  private isLoading = true;

  constructor(parent: HTMLElement) {
    parent.innerHTML += POPUP_HTML;
    this.container = parent.querySelector(`.${this.rootClass}`) as HTMLElement;
    this.status = this.container.querySelector(`.${this.rootClass}__status`) as HTMLElement;
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.container.classList.toggle(`${this.rootClass}--loading`, this.isLoading);
  }

  private displayStatus(text: string) {
    this.status.innerHTML = text;
  }

  public addSaving(saving: Saving) {
    const {
      price,
      provider,
    } = saving;
    this.displayStatus(`Ab ${formatPrice(price)} € mit ${provider}`);
    this.setLoading(false);
  }
}

class BaahnManager {
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
    BaahnManager.openDetails(elem);
    console.debug('Waiting for details to load');
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, 500));
    const hash = Array.from(elem.querySelectorAll('.sectionDeparture .time, .sectionArrival .time'))
      .map((e: Element) => (e as HTMLElement).innerText.match(/\d{2}:\d{2}/)?.[0]);
    BaahnManager.closeDetails(elem);
    return hash.join('#');
  }

  private static async parseTicket(elem: Element) {
    const priceElem = elem.querySelector('.fareOutput');
    const price = priceElem ? parsePrice(
      (priceElem as HTMLElement).innerText.match(/\d+,\d+/)?.[0] ?? 'Infinity',
    ) : Infinity;
    const hash = await BaahnManager.hashJourney(elem);
    return {
      elem,
      price,
      hash,
    };
  }

  private async parseTickets(): Promise<Array<Ticket>> {
    const tickets = await Promise.all(
      Array.from(this.uiRoot.querySelectorAll('.overviewConnection'))
        .map(BaahnManager.parseTicket),
    );
    return tickets.filter((t) => t !== null && t.hash !== '' && t.price < Infinity);
  }

  public async loadTickets() {
    this.tickets = await this.parseTickets();
    console.debug('Tickets loaded', this.tickets);
  }

  public async addSaving(saving: Saving) {
    if (this.tickets === null) await this.loadTickets();
    this.popup.addSaving(saving);
    const updates: { [key: string]: { elem: Element, price: number } } = {};

    saving.journeys?.forEach((journey) => {
      const ticket = this.tickets?.find((t) => journey.hash.startsWith(t.hash) || journey.hash.endsWith(t.hash));
      if (!ticket) return;
      if (ticket.price > journey.price && (updates[ticket.hash]?.price ?? Infinity) > journey.price) {
        updates[ticket.hash] = {
          elem: ticket.elem,
          price: journey.price,
        };
      }
    });
    for (const journey of Object.values(updates)) {
      const fare = journey?.elem?.querySelector('.fareOutput');
      if (journey && fare) {
        fare.innerHTML += ` <span class="baahn-price">(${formatPrice(journey.price)} € mit ${saving.provider})</span>`;
      }
    }
  }
}
setTimeout(async () => {
  const manager = new BaahnManager();
  await manager.loadTickets();
  const saving = await search();
  await manager.addSaving(saving);
}, 2000);
