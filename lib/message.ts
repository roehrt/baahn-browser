import { formatPrice } from './utils';

export default {
  popup: {
    error: 'Fehler beim Abrufen der Daten',
    noResults: 'Keine Ergebnisse',
    summary: (j: Journey) => (
      `Ab <span class="baahn-popup__status__price">${formatPrice(j.price)} €</span> mit ${j.details.provider}`
    ),
  },

};
