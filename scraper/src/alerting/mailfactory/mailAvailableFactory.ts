import { deleteAlert } from '../../db';
import { Alert, Item, Mail, MailFactory } from '../../domain';
import { sendEmail } from '../../mailgun';
import { generateFooter, generateHeader } from './templates';

export class MailAvailableFactory implements MailFactory {
  private alert;
  private item: Item;
  private mail: Partial<Mail> = {};

  constructor(alert: Alert, item: Item) {
    this.alert = alert;
    this.item = item;

    this.mail.to = alert.recipient;
  }

  async generate(): Promise<MailFactory> {
    this.mail.subject = `${this.item.title} is available again in the War Thunder store`;

    this.mail.html = generateHeader('html');
    this.mail.html +=
    '<p>' +
      `The item '${this.item.title}' in the War Thunder store is now available for purchase again!\n` +
      `You can get it here: <a href="${this.item.resolvedHref}" target="_blank" rel="noopener">${this.item.resolvedHref}</a>.` +
    '</p>';
    this.mail.html += generateFooter('itemAvailable', 'html');

    this.mail.text = generateHeader('text');
    this.mail.text += `The item '${this.item.title}' in the War Thunder store is now available for purchase again!\n` +
    `You can get it here: ${this.item.resolvedHref}.\n`;
    this.mail.text += generateFooter('itemAvailable', 'text');

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
