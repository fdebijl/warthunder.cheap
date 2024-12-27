import { Alert, Item, Mail, MailFactory } from '../domain';
import { deleteAlert } from '../db/alerts';
import { sendEmail } from '../mailgun';
import { generateFooter, generateHeader } from './templates';

export class MailNewItemFactory implements MailFactory {
  private alert;
  private items: Item[];
  private mail: Partial<Mail> = {};

  constructor(alert: Alert, items: Item[]) {
    this.alert = alert;
    this.items = items;

    this.mail.to = alert.recipient;
  }

  async generate(): Promise<MailFactory> {
    this.mail.subject = `${this.items.length} new items are now available in the War Thunder store`;

    this.mail.html = generateHeader('html');
    this.mail.html +=
    '<p>' +
      `The following ${this.items.length > 1 ? 'items' : 'item'} are now available in the War Thunder store:\n` +
      '<ul>' +
        this.items.map((item) => `<li><a href="${item.resolvedHref}" target="_blank" rel="noopener">${item.title}</a></li>`).join('\n') +
      '</ul>'
    '</p>';
    this.mail.html += generateFooter({ eventType: 'newItem', format: 'html' });

    this.mail.text = generateHeader('text');
    this.mail.text += `The following ${this.items.length > 1 ? 'items' : 'item'} are now available in the War Thunder store:\n` +
    this.items.map((item) => ` - ${item.title} (${item.resolvedHref})`).join('\n');
    this.mail.text += generateFooter({ eventType: 'newItem', format: 'text' });

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
