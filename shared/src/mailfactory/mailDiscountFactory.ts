import { Alert, Item, Mail, MailFactory } from '../domain/index.js';
import { deleteAlert } from '../db/index.js';
import { sendEmail } from '../mailgun.js';
import { generateFooter, generateHeader } from './templates.js';

export class MailDiscountFactory implements MailFactory {
  private alert;
  private item: Item;
  private mail: Partial<Mail> = {};

  constructor(alert: Alert, item: Item) {
    this.alert = alert;
    this.item = item;

    this.mail.to = alert.recipient;
  }

  async generate(): Promise<MailFactory> {
    this.mail.subject = `Discount available for '${this.item.title}' in the War Thunder store`;

    this.mail.html = generateHeader('html');
    this.mail.html +=
    '<p>' +
      `The item '${this.item.title}' in the War Thunder store just got a discount, it's now ${this.item.discountPercent}% cheaper at €${this.item.newPrice}.\n` +
      `You can get it here: <a href="${this.item.resolvedHref}" target="_blank" rel="noopener">${this.item.resolvedHref}</a>.` +
    '</p>';
    this.mail.html += generateFooter({ eventType: 'priceChange', format: 'html' });

    this.mail.text = generateHeader('text');
    this.mail.text += `The item '${this.item.title}' in the War Thunder store just got a discount, it's now ${this.item.discountPercent}% cheaper at €${this.item.newPrice}.\n` +
    `You can get it here: ${this.item.resolvedHref}.\n`;
    this.mail.text += generateFooter({ eventType: 'priceChange', format: 'text' });

    return this;
  }

  async send(): Promise<MailFactory> {
    await sendEmail(this.mail as Mail);

    return this;
  }

  async cleanup(): Promise<MailFactory> {
    await deleteAlert(this.alert._id!);

    return this;
  }
}
