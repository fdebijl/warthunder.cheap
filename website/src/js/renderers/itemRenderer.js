import { capitalize } from '../util/capitalize.js';
import { romanToNumericalRank } from '../util/romanToNumericalRank.js';

let template;

/**
 * Derive the price/discount presentation from item data. Pure — no DOM — so the
 * five-way availability/discount branch stays readable and testable in one place.
 * Returns the text, CSS classes and dataset values the card should render.
 */
function priceView(data) {
  if (!data.buyable && data.isDiscounted) {
    return {
      price: `€${data.newPrice.toFixed(2)}`,
      discount: 'Last known price (discounted)',
      dataset: { price: data.newPrice.toFixed(2), discount: data.discountPercent.toFixed(2) },
    };
  }

  if (!data.buyable && data.defaultPrice) {
    const price = data.defaultPrice || data.oldPrice;
    return {
      price: `€${price.toFixed(2)}`,
      priceClass: 'normal',
      discount: 'Last known price',
      discountClass: 'normal',
      dataset: { price: price.toFixed(2) },
    };
  }

  if (!data.buyable) {
    return {
      priceClass: 'hidden',
      discount: 'No longer available, no price on record',
      discountClass: 'normal',
      dataset: {},
    };
  }

  if (data.isDiscounted) {
    return {
      price: `€${data.newPrice.toFixed(2)}`,
      priceClass: 'discounted',
      discount: `Discounted by ${data.discountPercent.toFixed(2)}%, normally €${data.oldPrice.toFixed(2)}`,
      discountClass: 'discounted',
      dataset: { price: data.newPrice.toFixed(2), discount: data.discountPercent.toFixed(2) },
    };
  }

  return {
    price: `€${data.defaultPrice.toFixed(2)}`,
    priceClass: 'normal',
    discount: 'Normal pricing for this item',
    discountClass: 'normal',
    dataset: { price: data.defaultPrice.toFixed(2) },
  };
}

/**
 * A single item card in the grid. Light-DOM custom element so the existing
 * `.item` CSS and the nav filtering/sorting (which read `.item` + `dataset.*`)
 * keep working unchanged. The element clones `#tpl-item` for its markup and
 * owns its own `partner_changed` subscription via the connect/disconnect
 * lifecycle — so the listener is cleaned up when the grid re-renders.
 */
export class ItemCard extends HTMLElement {
  #data;
  #referalRenderer;
  #detailsRenderer;
  #priceEl;
  #storeEl;
  #rendered = false;

  // We only ever instantiate via `new ItemCard(...)` in JS (never authored in
  // HTML), so constructor arguments are safe here.
  constructor(data, referalRenderer, detailsRenderer) {
    super();
    this.#data = data;
    this.#referalRenderer = referalRenderer;
    this.#detailsRenderer = detailsRenderer;
  }

  connectedCallback() {
    if (!this.#rendered) {
      this.#render();
      this.#rendered = true;
    }

    this.#referalRenderer?.addEventListener('partner_changed', this.#onPartnerChange);
  }

  disconnectedCallback() {
    this.#referalRenderer?.removeEventListener('partner_changed', this.#onPartnerChange);
  }

  appendTo(selector) {
    document.querySelector(selector)?.append(this);
  }

  #render() {
    const data = this.#data;
    template ??= document.getElementById('tpl-item');
    const frag = template.content.cloneNode(true);
    const ref = (name) => frag.querySelector(`[data-ref="${name}"]`);

    this.classList.add('item');
    this.dataset.itemId = data.id;
    this.dataset.category = data.category;
    this.dataset.nation = data.nation;
    this.dataset.rank = data.rank;
    this.dataset.rankNo = romanToNumericalRank(data.rank);
    this.dataset.title = data.title;
    this.dataset.date = data.firstAvailableAt ?? data.createdAt;
    // Vehicle class (from datamine match) drives the type filter; only set when known.
    if (data.vehicleClass) this.dataset.vehicleClass = data.vehicleClass;
    if (data.br != null) this.dataset.br = data.br;

    const img = ref('img');
    const posterName = data.poster.split('/').pop();
    const fallbackSrc = `/media/${data.id}/${posterName}`;
    img.setAttribute('data-src', data.poster);
    img.onerror = () => { img.src = fallbackSrc; img.onerror = null; };
    img.alt = `Item image for the ${data.title}`;

    ref('title').textContent = data.title;
    this.#renderMeta(ref('meta'));

    const view = priceView(data);
    this.#priceEl = ref('price');
    this.#priceEl.textContent = view.price ?? '';
    if (view.priceClass) this.#priceEl.classList.add(view.priceClass);

    const discountEl = ref('discount');
    discountEl.textContent = view.discount;
    if (view.discountClass) discountEl.classList.add(view.discountClass);

    if (view.dataset.price != null) this.dataset.price = view.dataset.price;
    if (view.dataset.discount != null) this.dataset.discount = view.dataset.discount;

    this.#storeEl = ref('store');
    if (data.buyable) {
      this.#storeEl.href = this.#storeHref();
    } else {
      this.#storeEl.remove();
      this.#storeEl = null;
    }

    ref('details').href = `/item/${data.id}`;
    ref('details').addEventListener('click', (event) => {
      event.preventDefault();
      this.#detailsRenderer.show(data);
    });

    this.append(frag);
  }

  #renderMeta(metaEl) {
    const { rank, nation, br } = this.#data;

    if (!rank && !nation) {
      metaEl.remove();
      return;
    }

    const span = (cls, text) => {
      const el = document.createElement('span');
      el.classList.add(cls);
      el.textContent = text;
      return el;
    };

    if (rank) metaEl.appendChild(span('item__meta__rank', rank));

    if (br != null) {
      if (rank) metaEl.append(', ');
      metaEl.appendChild(span('item__meta__br', `BR ${br.toFixed(1)}`));
    }

    if ((rank || br != null) && nation) metaEl.append(' - ');

    if (nation) metaEl.appendChild(span('item__meta__country', capitalize(nation)));
  }

  #storeHref() {
    return this.#data.href + (this.#referalRenderer?.referalQueryParams ?? '');
  }

  #onPartnerChange = () => {
    if (this.#storeEl) this.#storeEl.href = this.#storeHref();

    const data = this.#data;
    if (data.category === 'GoldenEagles' || !data.buyable || data.isDiscounted) {
      return;
    }

    this.#priceEl.textContent = `€${(data.defaultPrice * this.#referalRenderer.discountFactor).toFixed(2)}`;
  };
}

customElements.define('item-card', ItemCard);
