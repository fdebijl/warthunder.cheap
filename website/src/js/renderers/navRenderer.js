import { capitalize } from '../util/capitalize.js';
import { romanToNumericalRank } from '../util/romanToNumericalRank.js';

export class NavRenderer {
  items;
  ranks;
  nations;
  categories;
  types;

  activeFilters = [];

  constructor(items) {
    this.items = items;

    this.ranks = this.findRanks();
    this.nations = this.findNations();
    this.categories = this.findCategories();

    this.setupCategories();
    this.setupNations();
    this.setupRanks();
  }

  toggleNav() {
    document.querySelector('nav').classList.toggle('active');
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
