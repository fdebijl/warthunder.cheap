import { clog } from '../../index';
import { Alert, Item, Mail, MailFactory } from '../../domain';

// TODO: Implement
export class MailNewItemFactory implements MailFactory {
  private alert;
  private item;
  private mail: Partial<Mail> = {};

  constructor(alert: Alert, item?: Item | Item[]) {
    this.alert = alert;
    this.item = item;

    this.mail.to = alert.recipient;
  }

  async generate(): Promise<MailFactory> {
    clog.log('Generating newitem email');
    return this;
  }

  async send(): Promise<MailFactory> {
    clog.log('Sending newitem email');
    return this;
  }

  async cleanup(): Promise<MailFactory> {
    clog.log('Cleaning up newitem email');
    return this;
  }
}
