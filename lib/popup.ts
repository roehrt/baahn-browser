import POPUP_HTML from 'bundle-text:/static/popup.html';
import { formatPrice } from './utils';
import message from './message';

export class Popup {
  private readonly container: HTMLElement;

  private readonly status: HTMLElement;

  private readonly button: HTMLElement;

  private readonly resultList: HTMLElement;

  private readonly abortController: AbortController;

  private readonly rootClass = 'baahn-popup';

  private isLoading = true;

  constructor(parent: HTMLElement, abortController: AbortController) {
    parent.innerHTML += POPUP_HTML;
    this.container = parent.querySelector(`.${this.rootClass}`) as HTMLElement;
    this.status = this.container.querySelector(`.${this.rootClass}__status`) as HTMLElement;
    this.button = this.container.querySelector(`.${this.rootClass}__action`) as HTMLElement;
    this.resultList = this.container.querySelector(`.${this.rootClass}__results`) as HTMLElement;
    this.button.addEventListener('click', () => this.handleClick());
    this.abortController = abortController;
  }

  public destroy() {
    this.container.remove();
  }

  private handleClick() {
    if (this.isLoading) {
      this.abortController.abort();
    } else {
      this.toggleSheet();
    }
  }


  private toggleSheet() {
    this.container.classList.toggle(`${this.rootClass}--expanded`);
  }

  private setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.container.classList.toggle(`${this.rootClass}--loading`, this.isLoading);
  }

  public setError(error: Error) {
    this.displayStatus(message.popup.error);
    this.container.classList.add(`${this.rootClass}--error`);
    this.setLoading(false);
    // eslint-disable-next-line no-console
    console.error(error);
  }

  private displayStatus(text: string) {
    this.status.innerHTML = text;
  }

  private addResult(result: Journey) {
    const resultItem = document.createElement('tr');
    resultItem.classList.add(`${this.rootClass}__result`);
    resultItem.innerHTML = `
      <td class="baahn-popup__result__price">${formatPrice(result.price)} €</span>
      <td class="baahn-popup__result__text">${result.details.text}</span>
      <td class="baahn-popup__result__link"><a href="${result.details.url}" target="_blank">${result.details.provider}</a></td>
    `;
    this.resultList.appendChild(resultItem);
  }

  private updateResults(journeys: Array<Journey>) {
    // this.resultList.innerHTML = '';
    journeys.forEach((journey) => this.addResult(journey));
  }

  private noResults() {
    this.displayStatus(message.popup.noResults);
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
    this.displayStatus(message.popup.summary(cheapest));
    this.updateResults(journeys);
    this.setLoading(false);
  }
}
