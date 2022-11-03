import { retryQuerySelectorAll } from './utils';
import { Manager } from './manager';

async function init() {
  const progress = document.querySelector('#hfs_progressbar') as HTMLElement;
  if (!progress.querySelectorAll('li')[1].classList.contains('active')) return;

  await retryQuerySelectorAll(document.body, '.sectionDeparture .time, .sectionArrival .time', 200);
  const manager = new Manager();
  await manager.loadTickets();
  try {
    await manager.search();
  } catch (e) {
    manager.setError(e as Error);
  }
}

init();
