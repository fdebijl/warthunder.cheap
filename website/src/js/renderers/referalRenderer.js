const codes = [
  { partner_name: 'PhlyDaily', partner_slug: 'PhlyDaily', partner_val: 'wp39fzab' },
  { partner_name: 'Pandramodo', partner_slug: 'Pandramodo', partner_val: '7w7ht1t2' },
  { partner_name: 'BoTimeGaming', partner_slug: 'BohicaIce', partner_val: 'e6sna5ff' },
  { partner_name: 'CrewGTW', partner_slug: 'CrewGTW', partner_val: 'f15yf6x6' },
  { partner_name: 'Fall System Academy', partner_slug: 'FallFire', partner_val: 'j2f2tya6' },
  { partner_name: 'MikeGoesBoom', partner_slug: 'MikeGoesBoom', partner_val: 'pytyqs8n' },
  { partner_name: 'Omero', partner_slug: 'Omero', partner_val: 'msxjfpaf' },
  { partner_name: '4CB', partner_slug: '4CB', partner_val: 'u7dhds18' },
  { partner_name: 'ManyMilesAway', partner_slug: 'ManyMilesAway', partner_val: '35aja848' },
  { partner_name: 'Alatriste', partner_slug: 'AL300', partner_val: 'w1maj7aa' },
  { partner_name: 'PoleznyiBes', partner_slug: 'PoleznyiBes', partner_val: 'q8uwq953' },
  { partner_name: 'Dita', partner_slug: 'Dita', partner_val: 'u2jkn1a4' },
  { partner_name: 'Iron Armenian', partner_slug: 'IronArmenian', partner_val: 'u5g16ff2' },
  { partner_name: 'Thorneyed', partner_slug: 'Thorneyed', partner_val: 'c4pcauuf' },
  { partner_name: 'Wartube', partner_slug: 'Ezida', partner_val: 'a6dyjc1z' },
  { partner_name: 'Alan LuckeR', partner_slug: 'AlanLuckeR', partner_val: 'djs5hueq' },
  { partner_name: 'PrivatePenguin', partner_slug: 'PrivatePinguin', partner_val: 'qbgtfgbb' },
  { partner_name: 'D31m0s', partner_slug: 'D31m0s', partner_val: 'bhmyhjes' },
  { partner_name: 'DOLLARplays', partner_slug: 'DOLLARplays', partner_val: 'jft18lc5' },
  { partner_name: 'HowToPlay1337', partner_slug: 'HowToPlay1337', partner_val: 'au8cyjmt' },
  { partner_name: 'MakcuVolk', partner_slug: 'MakcuVolk', partner_val: '6azsyugr' },
  { partner_name: 'kyMARik', partner_slug: 'kyMARik', partner_val: 'xy1fp865' },
  { partner_name: 'Jaguara333', partner_slug: 'Jaguara333', partner_val: 'q59c7spr' },
  { partner_name: 'JeanClodVanShot', partner_slug: 'JeanClodVanShot', partner_val: 'd154268p' },
  { partner_name: 'JustinPlaysTV', partner_slug: 'JustinPlaysTV', partner_val: '8xs6p63k' },
  { partner_name: 'Spit_flyer', partner_slug: 'Spit_flyer', partner_val: 'js5tlndd' },
  { partner_name: 'TheEuropeanCanadian', partner_slug: 'TheEuropeanCanadian', partner_val: '4wwn7fcr' },
  { partner_name: 'WingalingDragon', partner_slug: 'WingalingDragon', partner_val: 'pzf78jse' },
  { partner_name: 'Ruski9000', partner_slug: 'Ruskii9000', partner_val: '8h9d3kwl' },
  { partner_name: 'GERBrowny', partner_slug: 'GerBrowny', partner_val: 'uzzpg7cj' },
  { partner_name: 'CathFawr', partner_slug: 'Cathfawr', partner_val: 'f63blmfa' },
  { partner_name: 'OddBawZ', partner_slug: 'Oddbawz', partner_val: '2bpa5qx4' },
  { partner_name: 'Oxy', partner_slug: 'Oxy', partner_val: '5qb9d31f' },
  { partner_name: 'SpaceCat', partner_slug: 'SpaceCat', partner_val: 'p17qn61p' },
  { partner_name: 'Spookston', partner_slug: 'Spookston', partner_val: 'd3zfba73' },
  { partner_name: 'Trenlass', partner_slug: 'Trenlass', partner_val: 'ctud7l7c' },
  { partner_name: 'Avarik', partner_slug: 'Avarik', partner_val: 'mpaknd2y' },
  { partner_name: 'VALIDUZz', partner_slug: 'Validuz', partner_val: '9t9q9tsx' },
  { partner_name: 'Freeman Project', partner_slug: 'FreemanProject', partner_val: '8yhkf7y9' },
  { partner_name: 'УКУС', partner_slug: 'YKYC', partner_val: 'w721bkd6' },
  { partner_name: 'Futcher_', partner_slug: 'Futcher_', partner_val: 'sqfkdnpn' },
  { partner_name: 'Mootality', partner_slug: 'Mootality', partner_val: 't5aehn9j' },
  { partner_name: 'Steiner734', partner_slug: 'Steiner734', partner_val: '13t6bc8s' },
  { partner_name: 'Ash', partner_slug: 'Ash', partner_val: 'njxnyxcg' },
  { partner_name: 'Freige', partner_slug: 'Freige', partner_val: '17yc2ydg' },
  { partner_name: 'DriftyWingss', partner_slug: 'Driftywingss', partner_val: '4gsrr8re' },
  { partner_name: 'Copsi', partner_slug: 'Copsi', partner_val: 'n4xnug42' },
  { partner_name: 'ZoltanSultan', partner_slug: 'ZoltanSultan', partner_val: 'sx4m1cmu' },
  { partner_name: 'GIB_o7', partner_slug: 'GIB_07', partner_val: 'el12clbg' },
  { partner_name: 'MarkusHatDieGansGestohlen', partner_slug: 'MarkushatdieGansgestohlen', partner_val: 'egegmy9l' },
  { partner_name: 'DEFYN', partner_slug: 'DEFYN', partner_val: 'c56e1lgp' },
  { partner_name: 'Teamkrado', partner_slug: 'Teamkrado', partner_val: 'zrcu5138' },
  { partner_name: 'Reib00n', partner_slug: 'reib00n', partner_val: 'fp6bjbxd' },
  { partner_name: 'Cavenub', partner_slug: 'Cavenub', partner_val: 'f1ljzg8h' },
  { partner_name: 'Nordern', partner_slug: 'TheNordern', partner_val: 'xqdjqffk' },
  { partner_name: 'Meumeu', partner_slug: 'Meumeu03', partner_val: 'w7cyuzdj' },
  { partner_name: 'TVKowalowe', partner_slug: 'TVKowalowe', partner_val: '713f47rh' },
  { partner_name: 'Nexooos', partner_slug: 'Nexooos', partner_val: 'p18hzz7j' },
  { partner_name: 'Dirty Oxy Clean', partner_slug: 'DirtyOxyClean', partner_val: 'tw1tqjsy' },
  { partner_name: 'PINK', partner_slug: 'Pink', partner_val: '6z7k7k23' },
  { partner_name: 'Joob', partner_slug: 'Joob', partner_val: 'u7tsfhey' },
  { partner_name: 'BPA_Jon', partner_slug: 'BPA_Jon', partner_val: 'n6ylk6r4' },
  { partner_name: 'ImJeffafa', partner_slug: 'ImJeffafa', partner_val: 'y82chsba' },
  { partner_name: 'xSolitude', partner_slug: 'xS0litude', partner_val: 'a4eb66pq' },
  { partner_name: 'TheGreenlandicGamer', partner_slug: 'TheGreenlandicGamer', partner_val: 'rt16bh24' },
  { partner_name: 'Panzerblitz', partner_slug: 'Panzerblitz', partner_val: 'hr67ht1p' },
  { partner_name: 'Zenturion7', partner_slug: 'Zenturion7', partner_val: 'tmx898cr' },
  { partner_name: 'Seek', partner_slug: 'Seek', partner_val: '7zuxqznm' },
  { partner_name: 'Windsurfer2105', partner_slug: 'Windsurfer2105', partner_val: '1ujagp4w' },
  { partner_name: 'Deeyohh', partner_slug: 'Deeyohh', partner_val: '22atu34d' },
  { partner_name: 'General Lee', partner_slug: 'GeneralLee', partner_val: 'mnzw4g72' },
  { partner_name: 'Kila West', partner_slug: 'KilaWest', partner_val: '9jrjg3gy' },
  { partner_name: 'Ask3lad', partner_slug: 'Ask3lad', partner_val: 'lpzjtauw' },
  { partner_name: 'Lionstripe', partner_slug: 'Lionstripe', partner_val: '42alaxss' },
  { partner_name: 'TheCodMineMan', partner_slug: 'TheCodMineMan', partner_val: '8epts9c1' },
  { partner_name: 'SteamySnuggler', partner_slug: 'SteamySnuggler', partner_val: '32u8crg5' },
  { partner_name: 'theScottishKoala', partner_slug: 'theScottishKoala', partner_val: 'p858myc5' },
  { partner_name: 'Alconafter', partner_slug: 'Alconafter', partner_val: 'l4hlnydz' },
  { partner_name: 'HollaDieWaldfee', partner_slug: 'HollaDieWaldfee', partner_val: 'used7zkp' },
  { partner_name: 'JeanClodVanShot', partner_slug: 'JeanClodVanShot', partner_val: 'd154268p' },
  { partner_name: 'Ruski9000', partner_slug: 'Ruskii9000', partner_val: '8h9d3kwl' },
];

const DISCOUNT_FACTOR = 0.97;

export class ReferalRenderer extends EventTarget {
  codes = [];
  partner;
  selector;

  constructor(selector) {
    super();

    this.selector = selector;
    this.codes = codes.sort(() => Math.random() - 0.5);
  }

  renderInto() {
    const select = document.querySelector(this.selector);

    this.codes.forEach((code) => {
      const option = document.createElement('option');
      option.value = code.partner_name;
      option.innerText = code.partner_name;
      select.appendChild(option);
    });

    this.bindChange();
  }

  bindChange() {
    const select = document.querySelector(this.selector);

    select.addEventListener('change', (e) => {
      const partner = this.codes.find((code) => code.partner_name === e.target.value);
      this.partner = partner;
      this.dispatchEvent(new Event('partner_changed'));
    });
  }

  setPartner(partnerName) {
    this.partner = this.codes.find((code) => code.partner_name === partnerName);

    const select = document.querySelector(this.selector);
    select.value = partnerName;

    this.dispatchEvent(new Event('partner_changed'));
  }

  get hasPartner() {
    return !!this.partner;
  }

  get referalQueryParams() {
    if (this.partner) {
      return `&partner=${this.partner.partner_slug}&partner_val=${this.partner.partner_val}`;
    }
  }

  get discountFactor() {
    if (this.hasPartner) {
      return DISCOUNT_FACTOR;
    }

    return 1;
  }
}
