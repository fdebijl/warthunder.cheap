import { capitalize } from '../util/capitalize.js';
import { romanToNumericalRank } from '../util/romanToNumericalRank.js';

export class StatsRenderer {
  currentItems;
  archivedItems;
  filter = 'both';

  _charts = [];

  constructor(currentItems, archivedItems) {
    this.currentItems = currentItems;
    this.archivedItems = archivedItems;
  }

  get _filteredItems() {
    if (this.filter === 'current') return this.currentItems;
    if (this.filter === 'archived') return this.archivedItems;
    return [...this.currentItems, ...this.archivedItems];
  }

  init() {
    document.querySelectorAll('[data-stats-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelector('[data-stats-filter].active')?.classList.remove('active');
        btn.classList.add('active');
        this.filter = btn.dataset.statsFilter;
        this.renderCharts();
      });
    });
  }

  open() {
    this.renderCharts();
  }

  renderCharts() {
    this._charts.forEach((c) => c.destroy());
    this._charts = [];

    this._renderRankChart();
    this._renderCountryChart();
    this._renderPriceChart();
  }

  _renderRankChart() {
    const counts = {};
    this._filteredItems
      .filter((i) => i.rank)
      .forEach((i) => { counts[i.rank] = (counts[i.rank] || 0) + 1; });

    const sorted = Object.entries(counts)
      .sort(([a], [b]) => romanToNumericalRank(a) - romanToNumericalRank(b));

    const canvas = document.querySelector('#stats-rank-chart');
    this._charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: 'rgba(79, 209, 197, 0.75)',
          borderColor: 'rgba(79, 209, 197, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
        },
      },
    }));
  }

  _renderCountryChart() {
    const counts = {};
    this._filteredItems
      .filter((i) => i.nation)
      .forEach((i) => { counts[i.nation] = (counts[i.nation] || 0) + 1; });

    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);

    const canvas = document.querySelector('#stats-country-chart');
    this._charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(([k]) => capitalize(k)),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: 'rgba(246, 224, 94, 0.75)',
          borderColor: 'rgba(246, 224, 94, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.08)' } },
          y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
        },
      },
    }));
  }

  _renderPriceChart() {
    const BUCKET = 10;
    const MAX = 100;
    const buckets = {};

    for (let i = 0; i < MAX; i += BUCKET) {
      buckets[`€${i}–${i + BUCKET}`] = 0;
    }
    buckets[`€${MAX}+`] = 0;

    this._filteredItems.forEach((item) => {
      const price = item.defaultPrice || item.oldPrice;
      if (!price) return;
      const key = price >= MAX ? `€${MAX}+` : `€${Math.floor(price / BUCKET) * BUCKET}–${Math.floor(price / BUCKET) * BUCKET + BUCKET}`;
      buckets[key]++;
    });

    const canvas = document.querySelector('#stats-price-chart');
    this._charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(buckets),
        datasets: [{
          data: Object.values(buckets),
          backgroundColor: 'rgba(198, 132, 255, 0.75)',
          borderColor: 'rgba(198, 132, 255, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.08)' } },
          x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { display: false } },
        },
      },
    }));
  }
}
