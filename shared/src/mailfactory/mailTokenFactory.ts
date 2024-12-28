import { Alert, Mail, MailFactory } from '../domain/index.js';
import { deleteAlert } from '../db/index.js';
import { sendEmail } from '../mailgun.js';
import { generateFooter, generateHeader } from './templates.js';

export class MailTokenFactory implements MailFactory {
  private token: string;
  private alert;
  private mail: Partial<Mail> = {};

  constructor(alert: Alert) {
    if (!alert.payload?.token) {
      throw new Error('Token is required for token mail');
    }

    this.alert = alert;
    this.token = alert.payload?.token;
    this.mail.to = alert.recipient;
  }

  async generate(): Promise<MailFactory> {
    this.mail.subject = 'Your login link for Warthunder.cheap';

    this.mail.html = generateHeader('html');
    this.mail.html +=
    '<p>' +
      `You requested a login link for Warthunder.cheap, click <a href="https://warthunder.cheap/?token=${this.token}" target="_blank" rel="noopener">here</a> to log in.<br>` +
      'If you did not request this, you can safely ignore this email.' +
    '</p>';
    this.mail.html += generateFooter({ format: 'html' });

    this.mail.text = generateHeader('text');
    this.mail.text += `You requested a login link for Warthunder.cheap, click https://warthunder.cheap/?token=${this.token} to log in.\n` +
    'If you did not request this, you can safely ignore this email.';
    this.mail.text += generateFooter({ format: 'text' });

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
