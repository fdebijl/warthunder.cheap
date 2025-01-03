import { capitalize } from '../util/capitalize.js';
import { romanToNumericalRank } from '../util/romanToNumericalRank.js';

/** The ItemRenderer handles rendering the item cards into the itemgrids */
export class ItemRenderer {
  id;
  priceElement;

  constructor(data, referalRenderer, detailsRenderer) {
    this.data = data;
    this.id = data.id;
    this.referalRenderer = referalRenderer;
    this.detailsRenderer = detailsRenderer;

    this.bindPartnerChange();
  }

  generateItemElement() {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item');
    itemDiv.dataset.itemId = this.data.id;
    itemDiv.dataset.category = this.data.category;
    itemDiv.dataset.nation = this.data.nation;
    itemDiv.dataset.rank = this.data.rank;
    itemDiv.dataset.rankNo = romanToNumericalRank(this.data.rank);

    const posterName = this.data.poster.split('/').pop();
    const fallbackSrc = `media/${this.data.id}/${posterName}`;

    const img = document.createElement('img');
    img.setAttribute('data-src', this.data.poster);
    img.onerror = () => { img.src = fallbackSrc; img.onerror = null; };
    img.classList.add('lazyload');
    img.alt = `Item image for the ${this.data.title}`;
    img.src = 'img/puff.svg';
    itemDiv.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('item__info');

    const textWrapper = document.createElement('div');
    textWrapper.classList.add('item__text-wrapper');

    const title = document.createElement('h5');
    title.classList.add('item__title');
    title.textContent = this.data.title;
    textWrapper.appendChild(title);

    if (this.data.rank || this.data.nation) {
      const meta = document.createElement('p');
      meta.classList.add('item__meta');

      if (this.data.rank) {
        const rankSpan = document.createElement('span');
        rankSpan.classList.add('item__meta__rank');
        rankSpan.textContent = this.data.rank;
        meta.appendChild(rankSpan);
      }

      if (this.data.rank && this.data.nation) {
        meta.append(' - ');
      }

      if (this.data.nation) {
        const countrySpan = document.createElement('span');
        countrySpan.classList.add('item__meta__country');
        countrySpan.textContent = capitalize(this.data.nation);
        meta.appendChild(countrySpan);
      }

      textWrapper.appendChild(meta);
    }

    infoDiv.appendChild(textWrapper);

    this.priceElement = document.createElement('p');
    this.priceElement.classList.add('item__price');

    const discount = document.createElement('p');
    discount.classList.add('item__discount');

    if (!this.data.buyable && (this.data.defaultPrice || this.data.oldPrice)) {
      const price = this.data.defaultPrice || this.data.oldPrice;
      this.priceElement.textContent = `€${price.toFixed(2)}`;
      this.priceElement.classList.add('normal');
      discount.textContent = 'Last known price';
      discount.classList.add('normal');
      itemDiv.dataset.price = price.toFixed(2);
    } else if (!this.data.buyable) {
      this.priceElement.classList.add('hidden');
      discount.textContent = 'No longer available, no price on record';
      discount.classList.add('normal');
    } else if (this.data.isDiscounted) {
      this.priceElement.textContent = `€${this.data.newPrice.toFixed(2)}`;
      this.priceElement.classList.add('discounted');
      discount.textContent = `Discounted by ${this.data.discountPercent.toFixed(2) || 0}%, normally €${this.data.oldPrice.toFixed(2)}`;
      discount.classList.add('discounted');
      itemDiv.dataset.price = this.data.newPrice.toFixed(2);
    } else {
      this.priceElement.textContent = `€${this.data.defaultPrice.toFixed(2)}`;
      this.priceElement.classList.add('normal');
      discount.textContent = 'Normal pricing for this item';
      discount.classList.add('normal');
      itemDiv.dataset.price = this.data.defaultPrice.toFixed(2);
    }

    infoDiv.appendChild(this.priceElement);
    infoDiv.appendChild(discount);

    itemDiv.appendChild(infoDiv);

    const actionDiv = document.createElement('div');
    actionDiv.classList.add('item__actions');
    const storeButton = document.createElement('button');
    storeButton.classList.add('item__store', 'button', 'primary');
    storeButton.textContent = 'Buy';

    storeButton.addEventListener('click', () => {
      if (this.referalRenderer) {
        const referal = this.referalRenderer.referalQueryParams;
        if (referal) {
          return window.open(this.data.href + referal, '_blank');
        }
      }

      window.open(this.data.href, '_blank');
    });

    const detailsButton = document.createElement('button');
    detailsButton.classList.add('item__details', 'button', 'secondary');
    detailsButton.textContent = 'View Details';

    detailsButton.addEventListener('click', () => {
      this.detailsRenderer.show(this.data);
    });

    if (this.data.buyable) actionDiv.appendChild(storeButton);
    actionDiv.appendChild(detailsButton);

    itemDiv.appendChild(actionDiv);

    return itemDiv;
  }

  bindPartnerChange() {
    this.referalRenderer.addEventListener('partner_changed', () => {
      if (this.data.category === 'GoldenEagles' || !this.data.buyable || this.data.isDiscounted) {
        return;
      }

      this.priceElement.textContent = `€${(this.data.defaultPrice * this.referalRenderer.discountFactor).toFixed(2)}`;
    });
  }

  appendTo(selector) {
    const container = document.querySelector(selector);

    if (container) {
      const itemElement = this.generateItemElement();
      container.appendChild(itemElement);
    }
  }
}
