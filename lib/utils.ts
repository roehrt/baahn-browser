export function parsePrice(price: string) {
  return parseFloat(price.toString()
    .replace(/s/g, '')
    .replace(',', '.'));
}

export function formatPrice(price: Number) {
  return price.toFixed(2)
    .replace('.', ',');
}

export function formatTime(date: string) {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
