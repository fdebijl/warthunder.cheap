import { ItemRenderer } from './renderers/itemRenderer.js';
import { DetailsRenderer } from './renderers/detailsRenderer.js';
import { ReferalRenderer } from './renderers/referalRenderer.js';
import { ParamManager } from './paramManager.js';
import { loadModals } from './modalLoader.js';
import { loadHeader } from './headerLoader.js';

import { API_URL } from './env.js';

document.addEventListener('DOMContentLoaded', async () => {
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

  if (archivedItems.length === 0) {
    document.querySelector('.itemcategory.archived').classList.add('hidden');
  }

  archivedItems.forEach((item) => {
    const renderer = new ItemRenderer(item, referalRenderer, detailsRenderer);
    renderer.appendTo('.itemcategory.archived .itemgrid');
  });

  const paramManager = new ParamManager(referalRenderer, detailsRenderer, [...currentItems, ...archivedItems]);
  paramManager.initParams();
  paramManager.bindEvents();

  loadModals();
  loadHeader();
});

document.querySelectorAll('.navtab').forEach((tab) => {
  tab.addEventListener('click', async (event) => {
    event.preventDefault();

    document.querySelector('.navtab.active').classList.remove('active');
    tab.classList.add('active');

    const category = tab.dataset.filterCategory;

    if (category === 'All') {
      document.querySelectorAll('.item').forEach((item) => {
        item.classList.remove('hidden');
      });

      return;
    }

    document.querySelectorAll('.item').forEach((item) => {
      if (item.classList.contains(`item-category-${category}`)) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  });
});
