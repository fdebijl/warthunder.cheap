import { ChartRenderer } from './chartRenderer.js';
import { isAuthenticated } from '../util/authenticate.js';
import { capitalize } from '../util/capitalize.js';
import { API_URL } from '../env.js';

let detailsTemplate;
let vehicleTemplate;

/**
 * Derive the pricing presentation from item data. Pure — no DOM — so the
 * discounted / unknown / normal branch lives in one readable place. Returns the
 * price paragraph(s) to render plus the discount caption.
 */
function pricingView(data, referalRenderer) {
  if (data.isDiscounted) {
    return {
      prices: [
        { text: `€${data.oldPrice.toFixed(2)}`, classes: ['details__price', 'details__price-old'] },
        { text: `€${data.newPrice.toFixed(2)}`, classes: ['details__price-new'] },
      ],
      discount: `${data.discountPercent || 0}% discount over normal price`,
    };
  }

  if (!data.oldPrice && !data.newPrice && !data.defaultPrice) {
    return {
      prices: [{ text: 'Unknown', classes: ['details__price'] }],
      discount: 'No pricing information available',
    };
  }

  let priceValue = data.defaultPrice ?? data.oldPrice;
  if (referalRenderer && data.category !== 'GoldenEagles') {
    priceValue *= referalRenderer.discountFactor;
  }

  return {
    prices: [{ text: `€${priceValue.toFixed(2)}`, classes: ['details__price'] }],
    discount: 'Normal pricing for this item',
  };
}

/** Build the scrape-metadata block as an HTML string (the inspect link is appended separately). */
function scrapeInfoHtml(data) {
  let html = `ID: ${data.id}<br>`;
  html += `Source: ${capitalize(data.source || 'live')}<br>`;
  if (!data.buyable) html += `Store link: <a href="${data.href}" target="_blank">${data.href}</a><br>`;
  if (!data.buyable && data.archivedHref) html += `Archive link: <a href="${data.archivedHref}" target="_blank">${data.archivedHref}</a><br>`;
  html += `First available: ${new Date(data.firstAvailableAt ?? data.createdAt).toDateString()}<br>`;
  if (!data.buyable && data.lastAvailableAt) html += `Last available: ${new Date(data.lastAvailableAt).toDateString()}<br>`;
  html += `First scraped: ${new Date(data.createdAt).toDateString()}<br>`;
  html += `Last scraped: ${new Date(data.updatedAt).toDateString()}`;
  html += `<br><br>`;
  return html;
}

/** Select the key specs worth showing for a datamine vehicle blob. Pure — returns [label, value] pairs. */
function vehicleStats(vehicle) {
  const prettyType = (type) => (type ? type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : null);

  const stats = [];
  if (prettyType(vehicle.vehicle_type)) stats.push(['Class', prettyType(vehicle.vehicle_type)]);
  const brParts = [vehicle.arcade_br, vehicle.realistic_br, vehicle.simulator_br].filter((v) => typeof v === 'number');
  if (brParts.length) stats.push(['BR (AB/RB/SB)', brParts.map((v) => v.toFixed(1)).join(' / ')]);
  if (vehicle.crew_total_count) stats.push(['Crew', String(vehicle.crew_total_count)]);
  if (vehicle.mass) stats.push(['Mass', `${(vehicle.mass / 1000).toFixed(1)} t`]);
  if (vehicle.engine?.max_speed_rb_sb) stats.push(['Max speed', `${vehicle.engine.max_speed_rb_sb} km/h`]);
  if (vehicle.engine?.horse_power_rb_sb) stats.push(['Engine', `${vehicle.engine.horse_power_rb_sb} hp`]);
  if (vehicle.is_premium) stats.push(['Type', vehicle.is_pack ? 'Pack vehicle' : 'Premium vehicle']);
  return stats;
}

/** The DetailsRenderer handles populating the modal that shows when clicking 'View details' on an item card */
export class DetailsRenderer extends EventTarget {
  item;

  _docTitle;
  _docMeta;

  constructor(referalRenderer) {
    super();

    this.referalRenderer = referalRenderer;
  }

  get emailAddress() {
    return localStorage.getItem('wtcheap-email');
  }

  get token() {
    return localStorage.getItem('wtcheap-token');
  }

  get isAuthenticated() {
    return isAuthenticated();
  }

  updateDocInfo(data) {
    this._docTitle = window.document.title;
    this._docMeta = document.querySelector('meta[name="description"]').getAttribute('content');

    window.document.title = `Warthunder.cheap | ${data.title} price tracker`;
    const desc = `Get an email alert when the price of the ${data.title} changes on the War Thunder store and view historical pricing data.`;
    document.querySelector('meta[name="description"]').setAttribute('content', desc);
  }

  rollbackDocInfo() {
    window.document.title = this._docTitle;
    document.querySelector('meta[name="description"]').setAttribute('content', this._docMeta);
  }

  updateDetailsElement(data) {
    const dialog = document.querySelector('#details');

    if (!dialog) {
      console.error('Details dialog not found in DOM.');
      return;
    }

    const wrapper = dialog.querySelector('.dialog__wrapper');
    wrapper.innerHTML = '';

    detailsTemplate ??= document.getElementById('tpl-details');
    const frag = detailsTemplate.content.cloneNode(true);
    const ref = (name) => frag.querySelector(`[data-ref="${name}"]`);

    this.#renderCarousel(ref('slides'), data);

    ref('title').textContent = data.title;

    // Archive warning
    if (data.source !== 'archive') ref('archive').remove();

    // Pricing
    const view = pricingView(data, this.referalRenderer);
    const pricing = ref('pricing');
    for (const price of view.prices) {
      const el = document.createElement('p');
      el.classList.add(...price.classes);
      el.textContent = price.text;
      pricing.appendChild(el);
    }
    ref('discount').textContent = view.discount;

    // Availability
    ref('availability').textContent = data.buyable
      ? 'Available'
      : 'Not available right now, sign up for an alert below to get an email when it\'s back in the store';

    // Buy button
    if (data.buyable) {
      ref('buy').href = data.href + (this.referalRenderer?.referalQueryParams ?? '');
    } else {
      ref('buyActions').remove();
    }

    // Alert form
    const eventType = data.buyable ? 'priceChange' : 'itemAvailable';
    const emailInput = ref('email');
    if (this.isAuthenticated) emailInput.remove();

    const alertButton = ref('alert');
    alertButton.textContent = data.buyable ? 'Alert me on discount' : 'Alert me when available';

    const alertMessage = ref('alertMessage');
    alertButton.addEventListener('click', (e) => {
      e.preventDefault();

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      if (this.isAuthenticated) {
        headers.append('Authorization', `Bearer ${this.token}`);
      }

      fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipient: this.isAuthenticated ? '' : emailInput.value,
          itemId: data.id,
          eventType,
        }),
      }).then(async (res) => {
        const body = await res.json();
        return { body, res };
      }).then(({ body, res }) => {
        if (!res.ok || res.status < 200 || res.status >= 300) {
          throw new Error(body.message);
        }

        alertMessage.innerText = `Alert set, you will receive an email when the item is ${data.buyable ? 'discounted' : 'available'}`;
        this.dispatchEvent(new Event('alert_set'));
      }).catch((err) => {
        alertMessage.classList.add('error');
        alertMessage.innerText = `Failed to set alert: ${err.message}`;
      });
    });

    // Right column: meta, description, scrape info
    this.#renderMeta(ref('meta'), data);

    if (data.description) {
      if (data.description.indexOf(';') > -1) {
        data.description = data.description.split(';').join('\n');
      }

      ref('descShort').textContent = data.description;
    } else {
      ref('descHeader').remove();
      ref('descShort').remove();
    }

    const scrape = ref('scrape');
    scrape.innerHTML = scrapeInfoHtml(data);

    const inspectLink = document.createElement('a');
    inspectLink.href = '#';
    inspectLink.textContent = 'Inspect';
    inspectLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(data);

      inspectLink.textContent = 'Check the console';

      setTimeout(() => {
        inspectLink.textContent = 'Inspect';
      }, 10_000);
    });
    scrape.appendChild(inspectLink);

    // Long description + chart container are static in the template; just fill the text.
    ref('descLong').textContent = data.details?.description;

    // Close button
    ref('close').addEventListener('click', () => {
      this.dispatchEvent(new Event('item_dismissed'));
      dialog.close();
    });

    wrapper.appendChild(frag);
  }

  #renderCarousel(slidesContainer, data) {
    data?.details?.media.forEach((media) => {
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
  }

  #renderMeta(metaEl, data) {
    const { rank, nation } = data;

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

    if (rank) metaEl.appendChild(span('details__meta-rank', rank));
    if (rank && nation) metaEl.append(' - ');
    if (nation) metaEl.appendChild(span('details__meta-country', capitalize(nation)));
  }

  show(data) {
    this.item = data;

    const dialogId = 'details';
    const modal = document.querySelector(`#${dialogId}`);

    if (modal) {
      this.updateDetailsElement(data);
      this.updateDocInfo(data);

      const closeModalHandler = () => {
        this.rollbackDocInfo();
        this.dispatchEvent(new Event('item_dismissed'));

        modal.removeEventListener('click', clickOutsideToClose)
        document.removeEventListener('keydown', clickOutsideToClose);
        modal.close();
      }

      const clickOutsideToClose = (e) => {
        if (e.target.id === dialogId || e.key === 'Escape') {
          closeModalHandler();
        }
      }

      modal.showModal();
      modal.addEventListener('click', clickOutsideToClose);
      document.addEventListener('keydown', clickOutsideToClose);

      this.dispatchEvent(new Event('item_selected'));

      this.renderChart();
      this.renderVehicleInfo(data);
    }
  }

  /**
   * Fetch the matched datamine vehicle(s) and render key specs + a wiki link
   * below the price graph. Packs may bundle several vehicles, so we render one
   * block per matched id. No-ops silently when the item has no match.
   */
  async renderVehicleInfo(data) {
    const wrapper = document.querySelector('.details__vehicles-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const ids = data.datamineIds ?? [];
    if (ids.length === 0) return;

    const vehicles = await Promise.all(
      ids.map((id) => fetch(`${API_URL}/vehicle/${encodeURIComponent(id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)),
    );

    const rendered = vehicles.filter(Boolean);
    if (rendered.length === 0) return;

    const header = document.createElement('h2');
    header.classList.add('details__vehicles-header');
    header.textContent = rendered.length > 1 ? `Vehicles in this pack (${rendered.length})` : 'Vehicle information';
    wrapper.appendChild(header);

    for (const vehicle of rendered) {
      wrapper.appendChild(this.buildVehicleCard(vehicle));
    }
  }

  buildVehicleCard(vehicle) {
    vehicleTemplate ??= document.getElementById('tpl-vehicle-card');
    const frag = vehicleTemplate.content.cloneNode(true);
    const ref = (name) => frag.querySelector(`[data-ref="${name}"]`);

    const name = vehicle.localizedNames?.extended?.en || vehicle.localizedNames?.short?.en || vehicle.identifier;
    ref('title').textContent = name;
    ref('wiki').href = `https://wiki.warthunder.com/unit/${encodeURIComponent(vehicle.identifier)}`;

    const grid = ref('stats');
    for (const [label, value] of vehicleStats(vehicle)) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      grid.appendChild(dt);
      grid.appendChild(dd);
    }

    return frag;
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
}
