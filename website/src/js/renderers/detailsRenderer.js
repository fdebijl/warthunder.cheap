import { ChartRenderer } from './chartRenderer.js';

import { API_URL } from '../env.js';

/** The DetailsRenderer handles populating the modal that shows when clicking 'View details' on an item card */
export class DetailsRenderer extends EventTarget {
  item;

  constructor(referalRenderer) {
    super();

    this.referalRenderer = referalRenderer;
    this.fullCapsNations = ['usa', 'ussr'];
  }

  updateDetailsElement(data) {
    const dialog = document.querySelector('#details');
    const wrapper = dialog.querySelector('.dialog__wrapper');

    if (!dialog) {
      console.error('Details dialog not found in DOM.');
      return;
    }

    wrapper.innerHTML = '';

    const carousel = document.createElement('div');
    carousel.classList.add('carousel');

    const slidesContainer = document.createElement('div');
    slidesContainer.classList.add('carousel__slides');

    data.details.media.forEach((media) => {
      const mediaParts = media.split(';');
      const isVideo = mediaParts[0].endsWith('.webm') || mediaParts[0].endsWith('.mp4');

      if (isVideo) {
        const video = document.createElement('video');
        video.controls = true;
        video.classList.add('carousel__slide');
        video.volume = 0.1; // WT Store videos are loud

        for (let source of mediaParts) {
          const sourceElement = document.createElement('source');

          if (source.startsWith('/')) {
            source = `https://static-store.gaijin.net${source}`;
          }

          sourceElement.src = source;
          video.appendChild(sourceElement);
        }

        slidesContainer.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.classList.add('carousel__slide');
        img.src = mediaParts[0];
        img.alt = `Screenshot for ${data.title}`;
        slidesContainer.appendChild(img);
      }
    });

    carousel.appendChild(slidesContainer);
    wrapper.appendChild(carousel);

    const detailWrapper = document.createElement('div');
    detailWrapper.classList.add('details__wrapper');

    wrapper.appendChild(detailWrapper);

    const title = document.createElement('h1');
    title.classList.add('details__title');
    title.textContent = data.title;
    detailWrapper.appendChild(title);

    // Archive warning
    if (data.source === 'archive') {
      const archiveWarning = document.createElement('p');
      archiveWarning.classList.add('details__archive-warning');
      archiveWarning.textContent = 'The information about this item was scraped from The Internet Archive, not all information may be accurate or complete. The description may also not be in English.';
      detailWrapper.appendChild(archiveWarning);
    }

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('details__info');

    // Left Info Column
    const infoLeft = document.createElement('div');
    infoLeft.classList.add('details__info-left');

    const pricing = document.createElement('span');
    pricing.classList.add('details__pricing');

    if (data.isDiscounted) {
      const oldPrice = document.createElement('p');
      oldPrice.classList.add('details__price', 'details__price-old');

      const newPrice = document.createElement('p');
      newPrice.classList.add('details__price-new');

      let oldPriceValue = data.oldPrice;
      let newPriceValue = data.newPrice;

      oldPrice.textContent = `€${oldPriceValue.toFixed(2)}`;
      newPrice.textContent = `€${newPriceValue.toFixed(2)}`;
      pricing.appendChild(oldPrice);
      pricing.appendChild(newPrice);
    } else {
      const price = document.createElement('p');
      price.classList.add('details__price');

      let priceValue = data.defaultPrice;

      if (this.referalRenderer) {
        priceValue *= this.referalRenderer.discountFactor;
      }

      price.textContent = `€${priceValue.toFixed(2)}`;
      pricing.appendChild(price);
    }

    infoLeft.appendChild(pricing);

    const discount = document.createElement('p');
    discount.classList.add('details__discount', 'muted');
    discount.textContent = data.isDiscounted
      ? `${data.discountPercent || 0}% discount over normal price`
      : 'Normal pricing for this item';
    infoLeft.appendChild(discount);

    const availability = document.createElement('p');
    availability.classList.add('details__availability');
    availability.textContent = data.buyable ? 'Available' : 'Not available, sign up for an alert below to get an email when it\'s back in stock';
    infoLeft.appendChild(availability);

    if (data.buyable) {
      const actionsLeftBuy = document.createElement('div');
      actionsLeftBuy.classList.add('details__actions', 'margin-top-xs');

      const buyButton = document.createElement('a');
      let link = data.href;

      if (this.referalRenderer && this.referalRenderer.referalQueryParams) {
        link += this.referalRenderer.referalQueryParams;
      }

      buyButton.href = link;
      buyButton.target = '_blank';
      buyButton.classList.add('details__action', 'fab', 'primary');
      buyButton.textContent = 'Buy';
      actionsLeftBuy.appendChild(buyButton);
      infoLeft.appendChild(actionsLeftBuy);
    }

    const actionsLeftAlert = document.createElement('div');
    actionsLeftAlert.classList.add('details__actions', 'margin-top-xs');
    const eventType = data.buyable ? 'priceChange' : 'itemAvailable';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email address for alert';
    emailInput.classList.add('details__alert-email', 'jab');
    actionsLeftAlert.appendChild(emailInput);

    const alertButton = document.createElement('a');
    alertButton.href = '#';
    alertButton.classList.add('details__action', 'jab', 'secondary');
    alertButton.textContent = data.buyable ? 'Alert me on discount' : 'Alert me when available';

    alertButton.addEventListener('click', (e) => {
      e.preventDefault();

      fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: emailInput.value,
          itemId: data.id,
          eventType,
        }),
      });

      // TODO: Probably show a success/failure message here
    });

    actionsLeftAlert.appendChild(alertButton);

    infoLeft.appendChild(actionsLeftAlert);
    infoContainer.appendChild(infoLeft);

    // Right Info Column
    const infoRight = document.createElement('div');
    infoRight.classList.add('details__info-right');

    if (data.rank || data.nation) {
      const meta = document.createElement('p');
      meta.classList.add('details__meta', 'margin-bottom-xs');

      if (data.rank) {
        const rankSpan = document.createElement('span');
        rankSpan.classList.add('details__meta-rank');
        rankSpan.textContent = data.rank;
        meta.appendChild(rankSpan);
      }

      if (data.rank && data.nation) {
        meta.append(' - ');
      }

      if (data.nation) {
        const countrySpan = document.createElement('span');
        countrySpan.classList.add('details__meta-country');
        countrySpan.textContent = this.capitalize(data.nation);
        meta.appendChild(countrySpan);
      }

      infoRight.appendChild(meta);
    }

    const descriptionHeader = document.createElement('p');
    descriptionHeader.classList.add('details__description-header');
    descriptionHeader.textContent = 'This pack includes';
    infoRight.appendChild(descriptionHeader);

    const descriptionShort = document.createElement('p');
    descriptionShort.classList.add('details__description-short');
    descriptionShort.textContent = data.description;
    infoRight.appendChild(descriptionShort);

    const scrapeInfo = document.createElement('p');
    scrapeInfo.classList.add('details__scrape-info', 'muted', 'margin-top-sm');
    scrapeInfo.innerHTML = `ID: ${data.id}<br>`;
    scrapeInfo.innerHTML += `Source: ${this.capitalize(data.source || 'live')}<br>`;
    scrapeInfo.innerHTML += `First seen: ${new Date(data.createdAt).toDateString()}<br>`;
    if (!data.buyable && data.lastAvailableAt) {
      scrapeInfo.innerHTML += `Last available: ${new Date(data.lastAvailableAt).toDateString()}<br>`;
    }
    scrapeInfo.innerHTML += `Last scraped: ${new Date(data.updatedAt).toDateString()}`;
    infoRight.appendChild(scrapeInfo);

    infoContainer.appendChild(infoRight);
    detailWrapper.appendChild(infoContainer);

    const descriptionLongWrapper = document.createElement('div');
    descriptionLongWrapper.classList.add('center');

    const descriptionLong = document.createElement('div');
    descriptionLong.classList.add('details__description-long');
    descriptionLong.textContent = data.details.description;
    descriptionLongWrapper.appendChild(descriptionLong);

    detailWrapper.appendChild(descriptionLongWrapper);

    // Chart container
    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add('details__chart-wrapper');

    const chartHeader = document.createElement('h2');
    chartHeader.classList.add('details__chart-header');
    chartHeader.textContent = 'Price history';
    chartWrapper.appendChild(chartHeader);

    const chartContainer = document.createElement('div');
    chartContainer.classList.add('details__chart');
    chartWrapper.appendChild(chartContainer);

    detailWrapper.appendChild(chartWrapper);

    // Close button
    const closeButtonWrapper = document.createElement('div');
    closeButtonWrapper.classList.add('center');

    const closeButton = document.createElement('button');
    closeButton.classList.add('dialog_close', 'fab');
    closeButton.textContent = 'Close';
    closeButton.dataset.dialogId = 'details';

    closeButton.addEventListener('click', () => {
      this.dispatchEvent(new Event('item_dismissed'));
      dialog.close();
    });

    closeButtonWrapper.appendChild(closeButton);
    detailWrapper.appendChild(closeButtonWrapper);
  }

  show(data) {
    this.item = data;

    const dialogId = 'details';
    const modal = document.querySelector(`#${dialogId}`);

    if (modal) {
      this.updateDetailsElement(data);

      const closeModalHandler = () => {
        this.dispatchEvent(new Event('item_dismissed'));

        modal.removeEventListener('click', clickOutsideToClose)
        modal.close();
      }

      const clickOutsideToClose = (e) => {
        if (e.target.id === dialogId) {
          closeModalHandler();
        }
      }

      modal.showModal();
      modal.addEventListener('click', clickOutsideToClose);

      this.dispatchEvent(new Event('item_selected'));

      this.renderChart();
    }
  }

  async renderChart() {
    const priceData = await fetch(`${API_URL}/prices/${this.item.id}`).then((res) => res.json());

    if (!priceData.length) {
      document.querySelector('.details__chart').innerHTML = '<p class="muted">No price history available</p>';
      return;
    }

    const chartRenderer = new ChartRenderer(priceData);
    chartRenderer.renderInto('.details__chart');
  }

  capitalize(str) {
    const lower = str.toLowerCase();

    if (this.fullCapsNations.includes(lower)) {
      return lower.toUpperCase();
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
