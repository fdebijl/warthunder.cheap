export class ChartRenderer {
  constructor(priceData) {
    this.priceData = priceData;
  }

  renderInto(selector) {
    const container = document.querySelector(selector);

    if (!container) {
      console.error('Container not found for selector:', selector);
      return;
    }

    const labels = this.priceData.map((price) => new Date(price.date).toLocaleDateString());
    const prices = this.priceData.map((price) => price.isDiscounted ? price.newPrice : price.defaultPrice);
    const discountPercents = this.priceData.map((price) => price.discountPercent || 0);

    container.innerHTML = '';

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Price',
            data: prices,
            borderColor: '#4FD1C5',
            fill: false,
          },
          {
            label: 'Discount Percentage',
            data: discountPercents,
            borderColor: '#F6E05E',
            fill: false,
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const price = this.priceData[context.dataIndex];
                if (context.dataset.label === 'Price') {
                  if (price.isDiscounted) {
                    return `Price: €/$${context.raw} (Discounted)`;
                  }
                  return `Price: €/$${context.raw}`;
                } else if (context.dataset.label === 'Discount Percentage') {
                  return `Discount: ${context.raw}%`;
                }
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Price (EUR/USD)',
            },
            beginAtZero: true,
          },
          y2: {
            title: {
              display: true,
              text: 'Discount (%)',
            },
            position: 'right',
            beginAtZero: true,
          },
        },
      },
    });
  }
}
