import POPUP_HTML from 'bundle-text:./popup.html';
import { formatPrice } from './utils';

export class Popup {
  private readonly container: HTMLElement;

  private readonly status: HTMLElement;

  private readonly button: HTMLElement;

  private readonly resultList: HTMLElement;

  private readonly rootClass = 'baahn-popup';

  private isLoading = true;

  constructor(parent: HTMLElement) {
    parent.innerHTML += POPUP_HTML;
    this.container = parent.querySelector(`.${this.rootClass}`) as HTMLElement;
    this.status = this.container.querySelector(`.${this.rootClass}__status`) as HTMLElement;
    this.button = this.container.querySelector(`.${this.rootClass}__action`) as HTMLElement;
    this.resultList = this.container.querySelector(`.${this.rootClass}__results`) as HTMLElement;
    this.button.addEventListener('click', () => this.toggleSheet());
  }

  private toggleSheet() {
    this.container.classList.toggle(`${this.rootClass}--expanded`);
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.container.classList.toggle(`${this.rootClass}--loading`, this.isLoading);
  }

  public setError(error: Error) {
    this.displayStatus('Fehler beim Abrufen der Daten');
    this.container.classList.add(`${this.rootClass}--error`);
    this.setLoading(false);
    // eslint-disable-next-line no-console
    console.error(error);
  }

  private displayStatus(text: string) {
    this.status.innerHTML = text;
  }

  private addResult(result: Journey) {
    const resultItem = document.createElement('li');
    resultItem.classList.add(`${this.rootClass}__result`);
    resultItem.innerHTML = `
      <span class="baahn-popup__result__price">${formatPrice(result.price)} €</span>
      <span class="baahn-popup__result__text">${result.details.text}</span>
      <a class="baahn-popup__result__link" href="${result.details.url}" target="_blank">${result.details.provider}</a>
    `;
    this.resultList.appendChild(resultItem);
  }

  private updateResults(journeys: Array<Journey>) {
    this.resultList.innerHTML = '';
    journeys.forEach((journey) => this.addResult(journey));
  }

  private noResults() {
    this.displayStatus('Keine Ergebnisse');
    this.container.classList.add(`${this.rootClass}--no-results`);
    this.setLoading(false);
  }

  public addSaving(journeys: Array<Journey>) {
    journeys.sort((a, b) => a.price - b.price);
    const cheapest = journeys?.[0];
    if (!cheapest) {
      this.noResults();
      return;
    }

    this.displayStatus(`Ab <span class="baahn-popup__status__price">${formatPrice(cheapest.price)} €</span>`
      + ` mit ${cheapest.details.provider}`);
    this.updateResults(journeys);
    this.setLoading(false);
  }
}
