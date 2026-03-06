const codes = [
  { partner_name: 'Alan LuckeR', partner_slug: 'AlanLuckeR', partner_val: 'djs5hueq' },
  { partner_name: 'Alatriste', partner_slug: 'AL300', partner_val: 'w1maj7aa' },
  { partner_name: 'Aoeilaeiepae', partner_slug: 'Aoeilaeiepae', partner_val: 'q61bemt4' },
  { partner_name: 'Ash', partner_slug: 'Ash', partner_val: 'njxnyxcg' },
  { partner_name: 'Ask3lad', partner_slug: 'Ask3lad', partner_val: 'lpzjtauw' },
  { partner_name: 'Avarik', partner_slug: 'Avarik', partner_val: 'mpaknd2y' },
  { partner_name: 'BoTimeGaming', partner_slug: 'BohicaIce', partner_val: 'e6sna5ff' },
  { partner_name: 'BPA_Jon', partner_slug: 'BPA_Jon', partner_val: 'n6ylk6r4' },
  { partner_name: 'CathFawr', partner_slug: 'Cathfawr', partner_val: 'f63blmfa' },
  { partner_name: 'Cavenub', partner_slug: 'Cavenub', partner_val: 'f1ljzg8h' },
  { partner_name: 'Copsi', partner_slug: 'Copsi', partner_val: 'n4xnug42' },
  { partner_name: 'D31m0s', partner_slug: 'D31m0s', partner_val: 'bhmyhjes' },
  { partner_name: 'Dark Productions', partner_slug: 'DarkProductions', partner_val: 'wh27akb2' },
  { partner_name: 'Deeyohh', partner_slug: 'Deeyohh', partner_val: '22atu34d' },
  { partner_name: 'DEFYN', partner_slug: 'DEFYN', partner_val: 'c56e1lgp' },
  { partner_name: 'Dirty Oxy Clean', partner_slug: 'DirtyOxyClean', partner_val: 'tw1tqjsy' },
  { partner_name: 'Dita', partner_slug: 'Dita', partner_val: 'u2jkn1a4' },
  { partner_name: 'DOLLARplays', partner_slug: 'DOLLARplays', partner_val: 'jft18lc5' },
  { partner_name: 'DonutWithMustache', partner_slug: 'DonutWithMustache', partner_val: '2tskbzkj' },
  { partner_name: 'DriftyWingss', partner_slug: 'Driftywingss', partner_val: '4gsrr8re' },
  { partner_name: 'FallFire', partner_slug: 'FallFire', partner_val: 'j2f2tya6' },
  { partner_name: 'Freeman Project', partner_slug: 'FreemanProject', partner_val: '8yhkf7y9' },
  { partner_name: 'Futcher_', partner_slug: 'Futcher_', partner_val: 'sqfkdnpn' },
  { partner_name: 'Gaijin (eSports)', partner_slug: 'eSport', partner_val: '4h2g7hzd' },
  { partner_name: 'Gaijin (Skilled Pilot)', partner_slug: 'News', partner_val: '8jrteghy' },
  { partner_name: 'General Lee', partner_slug: 'GeneralLee', partner_val: 'mnzw4g72' },
  { partner_name: 'GERBrowny', partner_slug: 'GerBrowny', partner_val: 'uzzpg7cj' },
  { partner_name: 'HowToPlay1337', partner_slug: 'HowToPlay1337', partner_val: 'au8cyjmt' },
  { partner_name: 'ImJeffafa', partner_slug: 'ImJeffafa', partner_val: 'y82chsba' },
  { partner_name: 'Iron Armenian', partner_slug: 'IronArmenian', partner_val: 'u5g16ff2' },
  { partner_name: 'Jaguara333', partner_slug: 'Jaguara333', partner_val: 'q59c7spr' },
  { partner_name: 'JeanClodVanShot', partner_slug: 'JeanClodVanShot', partner_val: 'd154268p' },
  { partner_name: 'Joob', partner_slug: 'Joob', partner_val: 'u7tsfhey' },
  { partner_name: 'JustinPlaysTV', partner_slug: 'JustinPlaysTV', partner_val: '8xs6p63k' },
  { partner_name: 'Kila West', partner_slug: 'KilaWest', partner_val: '9jrjg3gy' },
  { partner_name: 'kyMARik', partner_slug: 'kyMARik', partner_val: 'xy1fp865' },
  { partner_name: 'Lionstripe', partner_slug: 'Lionstripe', partner_val: '42alaxss' },
  { partner_name: 'MakcuVolk', partner_slug: 'MakcuVolk', partner_val: '6azsyugr' },
  { partner_name: 'ManyMilesAway', partner_slug: 'ManyMilesAway', partner_val: '35aja848' },
  { partner_name: 'MarkushatdieGansgestohlen', partner_slug: 'MarkushatdieGansgestohlen', partner_val: 'egegmy9l' },
  { partner_name: 'Meumeu', partner_slug: 'Meumeu03', partner_val: 'w7cyuzdj' },
  { partner_name: 'MikeGoesBoom', partner_slug: 'MikeGoesBoom', partner_val: 'pytyqs8n' },
  { partner_name: 'MilitaryTok', partner_slug: 'TheMilitaryTok', partner_val: 'bbk2w433' },
  { partner_name: 'Mootality', partner_slug: 'Mootality', partner_val: 't5aehn9j' },
  { partner_name: 'Nexooos', partner_slug: 'Nexooos', partner_val: 'p18hzz7j' },
  { partner_name: 'Nordern', partner_slug: 'TheNordern', partner_val: 'xqdjqffk' },
  { partner_name: 'OddBawZ', partner_slug: 'Oddbawz', partner_val: '2bpa5qx4' },
  { partner_name: 'Omero', partner_slug: 'Omero', partner_val: 'msxjfpaf' },
  { partner_name: 'Oxy', partner_slug: 'Oxy', partner_val: '5qb9d31f' },
  { partner_name: 'Pandramodo', partner_slug: 'Pandramodo', partner_val: '7w7ht1t2' },
  { partner_name: 'Panzerblitz', partner_slug: 'Panzerblitz', partner_val: 'hr67ht1p' },
  { partner_name: 'PhlyDaily', partner_slug: 'PhlyDaily', partner_val: 'wp39fzab' },
  { partner_name: 'PINK', partner_slug: 'Pink', partner_val: '6z7k7k23' },
  { partner_name: 'PoleznyiBes', partner_slug: 'PoleznyiBes', partner_val: 'q8uwq953' },
  { partner_name: 'PrivatePenguin', partner_slug: 'PrivatePinguin', partner_val: 'qbgtfgbb' },
  { partner_name: 'reib00n', partner_slug: 'reib00n', partner_val: 'fp6bjbxd' },
  { partner_name: 'RevDeuce', partner_slug: 'RevDeuce', partner_val: 'ynwfnbln' },
  { partner_name: 'Ruski9000', partner_slug: 'Ruskii9000', partner_val: '8h9d3kwl' },
  { partner_name: 'Seek', partner_slug: 'Seek', partner_val: '7zuxqznm' },
  { partner_name: 'SpaceCat', partner_slug: 'SpaceCat', partner_val: 'p17qn61p' },
  { partner_name: 'Spit_flyer', partner_slug: 'Spit_flyer', partner_val: 'js5tlndd' },
  { partner_name: 'Spookston', partner_slug: 'Spookston', partner_val: 'd3zfba73' },
  { partner_name: 'SteamySnuggler', partner_slug: 'SteamySnuggler', partner_val: '32u8crg5' },
  { partner_name: 'Steiner734', partner_slug: 'Steiner734', partner_val: '13t6bc8s' },
  { partner_name: 'Teamkrado', partner_slug: 'Teamkrado', partner_val: 'zrcu5138' },
  { partner_name: 'TheCodMineMan', partner_slug: 'TheCodMineMan', partner_val: '8epts9c1' },
  { partner_name: 'TheEuropeanCanadian', partner_slug: 'TheEuropeanCanadian', partner_val: '4wwn7fcr' },
  { partner_name: 'TheGreenlandicGamer', partner_slug: 'TheGreenlandicGamer', partner_val: 'rt16bh24' },
  { partner_name: 'Thorneyed', partner_slug: 'Thorneyed', partner_val: 'c4pcauuf' },
  { partner_name: "Tim's Variety", partner_slug: 'TimsVariety', partner_val: 'jklbe9u1' },
  { partner_name: 'Trenlass', partner_slug: 'Trenlass', partner_val: 'ctud7l7c' },
  { partner_name: 'TVKowalowe', partner_slug: 'TVKowalowe', partner_val: '713f47rh' },
  { partner_name: 'VALIDUZz', partner_slug: 'Validuz', partner_val: '9t9q9tsx' },
  { partner_name: 'Walv!s', partner_slug: 'Walv1s', partner_val: 'egbc5q9n' },
  { partner_name: 'Wartube', partner_slug: 'Ezida', partner_val: 'a6dyjc1z' },
  { partner_name: 'Windsurfer2105', partner_slug: 'Windsurfer2105', partner_val: '1ujagp4w' },
  { partner_name: 'WingalingDragon', partner_slug: 'WingalingDragon', partner_val: 'pzf78jse' },
  { partner_name: 'xSolitude', partner_slug: 'xS0litude', partner_val: 'a4eb66pq' },
  { partner_name: 'YKYC', partner_slug: 'YKYC', partner_val: 'w721bkd6' },
  { partner_name: 'Zenturion7', partner_slug: 'Zenturion7', partner_val: 'tmx898cr' },
  { partner_name: 'ZoltanSultan', partner_slug: 'ZoltanSultan', partner_val: 'sx4m1cmu' },
];

const DISCOUNT_FACTOR = 0.97;

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="partner-dropdown__chevron"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>`;

export class ReferalRenderer extends EventTarget {
  codes = [];
  partner = null;
  selector;

  _dropdown = null;
  _panel = null;
  _triggerImg = null;
  _triggerLabel = null;
  _search = null;
  _list = null;

  constructor(selector) {
    super();

    this.selector = selector;
    this.codes = codes.sort(() => Math.random() - 0.5);
  }

  renderInto() {
    const mount = document.querySelector(this.selector);

    const dropdown = document.createElement('div');
    dropdown.className = 'partner-dropdown';
    dropdown.setAttribute('aria-expanded', 'false');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'partner-dropdown__trigger fab compact';

    const triggerImg = document.createElement('img');
    triggerImg.className = 'partner-dropdown__img';
    triggerImg.alt = '';
    triggerImg.hidden = true;

    const triggerLabel = document.createElement('span');
    triggerLabel.textContent = 'None';

    trigger.appendChild(triggerImg);
    trigger.appendChild(triggerLabel);
    trigger.insertAdjacentHTML('beforeend', CHEVRON_SVG);

    const panel = document.createElement('div');
    panel.className = 'partner-dropdown__panel';

    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'partner-dropdown__search';
    search.placeholder = 'Search...';
    search.autocomplete = 'off';

    const list = document.createElement('ul');
    list.className = 'partner-dropdown__list';
    list.setAttribute('role', 'listbox');

    const noneItem = document.createElement('li');
    noneItem.className = 'partner-dropdown__item';
    noneItem.dataset.value = '';
    noneItem.setAttribute('role', 'option');
    noneItem.setAttribute('aria-selected', 'true');
    noneItem.textContent = 'None';
    list.appendChild(noneItem);

    const randomItem = document.createElement('li');
    randomItem.className = 'partner-dropdown__item';
    randomItem.dataset.value = '__random__';
    randomItem.setAttribute('role', 'option');
    randomItem.setAttribute('aria-selected', 'false');
    randomItem.textContent = 'Random';
    list.appendChild(randomItem);

    this.codes.forEach((code) => {
      const item = document.createElement('li');
      item.className = 'partner-dropdown__item';
      item.dataset.value = code.partner_name;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');

      const img = document.createElement('img');
      img.src = `/img/partners/${code.partner_slug}.webp`;
      img.alt = '';

      const name = document.createElement('span');
      name.textContent = code.partner_name;

      item.appendChild(img);
      item.appendChild(name);
      list.appendChild(item);
    });

    panel.appendChild(search);
    panel.appendChild(list);
    dropdown.appendChild(trigger);
    dropdown.appendChild(panel);
    mount.appendChild(dropdown);

    this._dropdown = dropdown;
    this._panel = panel;
    this._triggerImg = triggerImg;
    this._triggerLabel = triggerLabel;
    this._search = search;
    this._list = list;

    this.bindChange();
  }

  bindChange() {
    const trigger = this._dropdown.querySelector('.partner-dropdown__trigger');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this._dropdown.getAttribute('aria-expanded') === 'true';
      this._dropdown.setAttribute('aria-expanded', String(!isOpen));
      if (!isOpen) {
        this._positionPanel(trigger);
        this._search.value = '';
        this._filterList('');
        this._search.focus();
      }
    });

    this._search.addEventListener('input', () => {
      this._filterList(this._search.value);
    });

    this._search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._dropdown.setAttribute('aria-expanded', 'false');
      }
    });

    this._list.addEventListener('click', (e) => {
      const item = e.target.closest('.partner-dropdown__item');
      if (!item) return;

      if (item.dataset.value === '__random__') {
        this.partner = this.codes[Math.floor(Math.random() * this.codes.length)];
      } else {
        this.partner = this.codes.find((code) => code.partner_name === item.dataset.value) ?? null;
      }
      this._updateTrigger();
      this._dropdown.setAttribute('aria-expanded', 'false');
      this.dispatchEvent(new Event('partner_changed'));
    });

    document.addEventListener('click', (e) => {
      if (!this._dropdown.contains(e.target)) {
        this._dropdown.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._dropdown.setAttribute('aria-expanded', 'false');
      }
    });
  }

  _positionPanel(trigger) {
    const rect = trigger.getBoundingClientRect();
    this._panel.style.top = `${rect.bottom + 6}px`;
    this._panel.style.right = `${window.innerWidth - rect.right}px`;
  }

  _filterList(query) {
    const q = query.toLowerCase();
    this._list.querySelectorAll('.partner-dropdown__item').forEach((item) => {
      if (item.dataset.value === '' || item.dataset.value === '__random__') return;
      item.hidden = !item.dataset.value.toLowerCase().includes(q);
    });
  }

  _updateTrigger() {
    if (this.partner) {
      this._triggerImg.src = `/img/partners/${this.partner.partner_slug}.webp`;
      this._triggerImg.hidden = false;
      this._triggerLabel.textContent = this.partner.partner_name;
    } else {
      this._triggerImg.hidden = true;
      this._triggerLabel.textContent = 'None';
    }

    const selectedValue = this.partner?.partner_name ?? '';
    this._list.querySelectorAll('.partner-dropdown__item').forEach((item) => {
      item.setAttribute('aria-selected', String(item.dataset.value === selectedValue));
    });
  }

  setPartner(partnerName) {
    this.partner = this.codes.find((code) => code.partner_name === partnerName) ?? null;
    this._updateTrigger();
    this.dispatchEvent(new Event('partner_changed'));
  }

  get hasPartner() {
    return !!this.partner;
  }

  get referalQueryParams() {
    if (this.partner) {
      return `&partner=${this.partner.partner_slug}&partner_val=${this.partner.partner_val}`;
    }

    return '';
  }

  get discountFactor() {
    if (this.hasPartner) {
      return DISCOUNT_FACTOR;
    }

    return 1;
  }
}
