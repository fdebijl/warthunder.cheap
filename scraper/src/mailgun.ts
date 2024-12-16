import formData from 'form-data';
import Mailgun from 'mailgun.js';

import { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_SENDER } from './constants';
import { Mail } from './domain';

const mailgun = new Mailgun(formData);
const mailgunClient = mailgun.client({
  url: 'https://api.eu.mailgun.net',
  username: 'api',
  key: MAILGUN_API_KEY,
});

export const sendEmail = async (mail: Mail) => {
  const { to, subject, html, text } = mail;

  try {
    await mailgunClient.messages.create(MAILGUN_DOMAIN, {
      from: `Warthunder.cheap Notifications <${MAILGUN_SENDER}>`,
      to,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error(`Failed to send email to ${to}: ${error}`);
  }
};
