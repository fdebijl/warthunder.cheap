import { capitalize } from '../util/capitalize.js';
import { romanToNumericalRank } from '../util/romanToNumericalRank.js';

// TODO: Wire up sorting
export class NavRenderer {
  items;
  ranks;
  nations;
  categories;
  types;

  /**
   * Set the active filters for the itemgrid. Filters are objects with a type and a value, items will be shown if the dataset[type] matches the value.
   *
   * @sample
   * [
   *   {
   *     "type": "nation",
   *     "value": "britain"
   *   },
   *   {
   *     "type": "category",
   *     "value": "WarThunderPacks"
   *   },
   *   {
   *     "type": "rank",
   *     "value": "Rank II"
   *   }
   * ]
   */
  activeFilters = [];

  /**
   * Set the sorting for items in the itemgrid. Key can be one of 'default', 'price', 'discount', 'name', 'date', direction is either 'up' or 'down'.
   *
   * @sample
   * {
   *   key: 'price',
   *   direction: 'down'
   * }
   */
  activeSorting = {
    key: 'default',
    direction: 'down'
  }

  constructor(items) {
    this.items = items;

    this.ranks = this.findRanks();
    this.nations = this.findNations();
    this.categories = this.findCategories();

    this.setupCategories();
    this.setupNations();
    this.setupRanks();

    this.setupSorting();
  }

  setupToggles() {
    document.querySelectorAll('.nav-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const isFilterToggle = button.classList.contains('nav-toggle__filters');
        const targetClass = isFilterToggle ? 'filters' : 'sorting';

        const nav = document.querySelector('nav');
        const targetUl = nav.querySelectorAll(`.${targetClass}`);

        const isShowing = nav.classList.contains(`show-${targetClass}`);

        if (isShowing) {
          nav.classList.remove(`show-${targetClass}`);
          targetUl.forEach(ul => {
            ul.style.maxHeight = '0';
          });
        } else {
          nav.classList.add(`show-${targetClass}`);
          targetUl.forEach(ul => {
            ul.style.maxHeight = ul.scrollHeight + 'px';
          });
        }
      });
    });

    document.querySelectorAll('ul.filters, ul.sorting').forEach(ul => {
      ul.addEventListener('transitionend', () => {
        if (ul.style.maxHeight !== '0px') {
          ul.style.maxHeight = 'auto';
        }
      });
    });
  }

  findRanks() {
    const ranks = this.items.map((item) => item.rank).filter(Boolean);
    ranks.sort((a, b) => romanToNumericalRank(a) - romanToNumericalRank(b));
    return ['All', ...new Set(ranks)];
  }

  findNations() {
    const nations = this.items.map((item) => item.nation).filter(Boolean);
    return ['All', ...new Set(nations)];
  }

  findCategories() {
    const categories = this.items.map((item) => item.category);
    return ['All', ...new Set(categories)].sort();
  }

  setupCategories() {
    for (const category of this.categories) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = '#';
      a.classList.add('navtab');
      a.dataset.filterCategory = category;
      a.textContent = this.splitOnCaps(category);

      if (category === 'All') {
        a.classList.add('active');
      }

      li.appendChild(a);

      document.querySelector('.filter__categories').appendChild(li);
    }

    document.querySelectorAll('.filter__categories .navtab').forEach((tab) => {
      tab.addEventListener('click', async (event) => {
        event.preventDefault();

        document.querySelector('.filter__categories .navtab.active').classList.remove('active');
        this.activeFilters = this.activeFilters.filter((filter) => filter.type !== 'category');
        tab.classList.add('active');

        if (tab.dataset.filterCategory !== 'All') {
          this.activeFilters.push({
            type: 'category',
            value: tab.dataset.filterCategory
          });
        }

        this.applyFilters();
      });
    });
  }

  setupNations() {
    for (const nation of this.nations) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = '#';
      a.classList.add('navtab');
      a.dataset.filterNation = nation;
      a.textContent = capitalize(nation);

      if (nation === 'All') {
        a.classList.add('active');
      }

      li.appendChild(a);

      document.querySelector('.filter__nations').appendChild(li);
    }

    document.querySelectorAll('.filter__nations .navtab').forEach((tab) => {
      tab.addEventListener('click', async (event) => {
        event.preventDefault();

        document.querySelector('.filter__nations .navtab.active').classList.remove('active');
        this.activeFilters = this.activeFilters.filter((filter) => filter.type !== 'nation');
        tab.classList.add('active');

        if (tab.dataset.filterNation !== 'All') {
          this.activeFilters.push({
            type: 'nation',
            value: tab.dataset.filterNation
          });
        }

        this.applyFilters();
      });
    });
  }

  setupRanks() {
    for (const rank of this.ranks) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = '#';
      a.classList.add('navtab');
      a.dataset.filterRank = rank;
      a.textContent = capitalize(rank);

      if (rank === 'All') {
        a.classList.add('active');
      }

      li.appendChild(a);

      document.querySelector('.filter__ranks').appendChild(li);
    }

    document.querySelectorAll('.filter__ranks .navtab').forEach((tab) => {
      tab.addEventListener('click', async (event) => {
        event.preventDefault();

        document.querySelector('.filter__ranks .navtab.active').classList.remove('active');
        this.activeFilters = this.activeFilters.filter((filter) => filter.type !== 'rank');
        tab.classList.add('active');

        if (tab.dataset.filterRank !== 'All') {
          this.activeFilters.push({
            type: 'rank',
            value: tab.dataset.filterRank
          });
        }

        this.applyFilters();
      });
    });
  }

  setupSorting() {
    document.querySelectorAll('.sorting__item').forEach((tab) => {
      tab.addEventListener('click', async (event) => {
        event.preventDefault();

        const isDefault = tab.dataset.sort === 'default';
        const isActive = tab.classList.contains('active');
        const direction = tab.classList.contains('sorting__down') ? 'down' : 'up';

        if (isActive && !isDefault) {
          tab.classList.toggle('sorting__down');
          tab.classList.toggle('sorting__up');
          this.activeSorting.direction = direction === 'down' ? 'up' : 'down';
        }

        document.querySelector('.sorting .navtab.active').classList.remove('active');
        tab.classList.add('active');

        this.activeSorting.key = tab.dataset.sort;
        this.applySorting();
      });
    });
  }

  applySorting() {
    const items = [...document.querySelectorAll('.item')].sort((a, b) => {
      if (this.activeSorting.key === 'default') {
        return 0;
      }

      const aKey = a.dataset[this.activeSorting.key];
      const bKey = b.dataset[this.activeSorting.key];

      if (this.activeSorting.key === 'price') {
        return parseFloat(aKey) - parseFloat(bKey);
      }

      if (this.activeSorting.key === 'discount') {
        return parseFloat(aKey) - parseFloat(bKey);
      }

      if (this.activeSorting.key === 'title') {
        return aKey.localeCompare(bKey);
      }

      if (this.activeSorting.key === 'date') {
        return new Date(aKey) - new Date(bKey);
      }
    })

    if (this.activeSorting.direction === 'up') {
      items.reverse();
    }

    items.forEach((item, index) => {
      if (this.activeSorting.key === 'default') {
        item.style.order = 0;
        return;
      }

      item.style.order = index;
    });
  }

  applyFilters() {
    document.querySelectorAll('.item').forEach((item) => {
      if (this.activeFilters.length === 0) {
        item.classList.remove('hidden');
      }

      const satisfiesAllFilters = this.activeFilters.every((filter) => {
        if (filter.value === 'All') {
          return true;
        }

        return item.dataset[filter.type] === filter.value;
      });

      if (satisfiesAllFilters) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  }

  splitOnCaps(string) {
    return string.split(/(?=[A-Z])/).join(' ');
  }
}
