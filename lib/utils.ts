export function debug(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
}

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

export function wait(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryQuerySelectorAll(parent: Element, selector: string, ms: number = 200, retries: number = Infinity) {
  let tryCount = 0;
  let elems;
  do {
    // eslint-disable-next-line no-await-in-loop
    await wait(ms);
    elems = parent.querySelectorAll(selector);
    tryCount++;
    debug(`Try ${tryCount} of ${retries} for ${selector}`);
  } while (elems.length === 0 && tryCount > retries);
  return elems;
}
