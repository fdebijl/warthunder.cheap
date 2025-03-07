import { ItemRenderer } from './renderers/itemRenderer.js';
import { DetailsRenderer } from './renderers/detailsRenderer.js';
import { ReferalRenderer } from './renderers/referalRenderer.js';
import { AlertRenderer } from './renderers/alertRenderer.js';
import { NavRenderer } from './renderers/navRenderer.js';

import { ParamManager } from './util/paramManager.js';
import { loadModals } from './util/loadModals.js';
import { loadHeader } from './util/loadHeader.js';
import { authenticate } from './util/authenticate.js';

import { API_URL } from './env.js';

document.addEventListener('DOMContentLoaded', async () => {
  await authenticate();

  const referalRenderer = new ReferalRenderer('#referal_code');
  referalRenderer.renderInto();

  const detailsRenderer = new DetailsRenderer(referalRenderer);

  const currentItems = await fetch(`${API_URL}/items/current`).then((res) => res.json());

  currentItems.sort((a, b) => {
    if (a.isDiscounted && !b.isDiscounted) {
      return -1;
    }

    if (!a.isDiscounted && b.isDiscounted) {
      return 1;
    }

    return 0;
  });

  currentItems.forEach((item) => {
    const itemRenderer = new ItemRenderer(item, referalRenderer, detailsRenderer);
    itemRenderer.appendTo('.itemcategory.current .itemgrid');
  });

  const archivedItems = await fetch(`${API_URL}/items/archived`).then((res) => res.json());

  archivedItems.forEach((item) => {
    const renderer = new ItemRenderer(item, referalRenderer, detailsRenderer);
    renderer.appendTo('.itemcategory.archived .itemgrid');
  });

  const allItems = [...currentItems, ...archivedItems];

  const alertRenderer = new AlertRenderer('#alerts', allItems);
  detailsRenderer.addEventListener('alert_set', () => alertRenderer.reloadAlerts());

  const paramManager = new ParamManager(referalRenderer, detailsRenderer, allItems);
  paramManager.initParams();
  paramManager.bindEvents();

  loadModals();
  loadHeader();

  const navRenderer = new NavRenderer(allItems);
  navRenderer.setupToggles();

  document.querySelectorAll('.fadeloading-only').forEach((element) => {
    element.classList.remove('fadeloading-only');
    element.classList.add('hidden');
  });

  document.querySelectorAll('.fadeloading').forEach((element) => {
    element.classList.remove('fadeloading');
    element.classList.add('fadeloaded');
  });

  window.wtCheap = {
    referalRenderer,
    detailsRenderer,
    alertRenderer,
    paramManager,
    navRenderer,
    currentItems,
    archivedItems
  };

  console.info('Evaluate `window.wtCheap` to debug/inspect the renderers');
});
