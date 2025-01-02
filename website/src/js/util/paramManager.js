export class ParamManager {
  items = [];
  params = {};
  referalRenderer = null;
  detailsRenderer = null;

  constructor(referalRenderer, detailsRenderer, items) {
    this.items = items;
    this.referalRenderer = referalRenderer;
    this.detailsRenderer = detailsRenderer;
  }

  initParams() {
    const urlParams = new URLSearchParams(window.location.search);

    this.params = {
      partner: urlParams.get('partner'),
      item: urlParams.get('item')
    };

    if (this.params.partner) {
      this.referalRenderer.setPartner(this.params.partner);
    }

    if (this.params.item) {
      const item = this.items.find((item) => item.id == this.params.item);
      this.detailsRenderer.show(item);
    }
  }

  bindEvents() {
    this.referalRenderer.addEventListener('partner_changed', () => {
      if (this.referalRenderer.partner) {
        this.params.partner = this.referalRenderer.partner.partner_name;
      } else {
        this.params.partner = null;
      }

      this.updateUrl();
    });

    this.detailsRenderer.addEventListener('item_selected', () => {
      this.params.item = this.detailsRenderer.item.id;
      this.updateUrl();
    });

    this.detailsRenderer.addEventListener('item_dismissed', () => {
      this.params.item = null;
      this.updateUrl();
    });
  }

  updateUrl() {
    const url = new URL(window.location);

    if (this.params.partner) {
      url.searchParams.set('partner', this.params.partner);
    } else {
      url.searchParams.delete('partner');
    }

    if (this.params.item) {
      url.searchParams.set('item', this.params.item);
    } else {
      url.searchParams.delete('item');
    }

    window.history.pushState({}, '', url);
  }
}
