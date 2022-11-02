import { retryQuerySelectorAll } from './utils';
import { search } from './query';
import { Manager } from './manager';

async function init() {
  const progress = document.querySelector('#hfs_progressbar') as HTMLElement;
  if (!progress.querySelectorAll('li')[1].classList.contains('active')) return;

  await retryQuerySelectorAll(document.body, '.sectionDeparture .time, .sectionArrival .time', 200);
  const manager = new Manager();
  await manager.loadTickets();
  try {
    const saving = await search();
    await manager.addSaving(saving);
  } catch (e) {
    manager.setError(e as Error);
  }
}

init();
