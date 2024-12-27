import { EventType } from '../domain';

const HUMAN_READABLE_EVENT_TYPES = {
  'priceChange': 'discount alert for this item',
  'itemAvailable': 'availability alert for this item',
  'newItem': 'alert for new items in the store'
}

export const generateHeader = (format: 'text' | 'html'): string => {
  if (format === 'text') {
    return 'Hello!';
  } else {
    return '<p>Hello!</p>';
  }
}

// Note: Mailgun inserts an unsubscribe link automatically at the bottom of each email
export const generateFooter = ({ eventType, format }: { eventType?: EventType, format: 'text' | 'html' }): string => {
  if (eventType) {
    if (format === 'text') {
      return 'Greetings,\r\nFloris\r\nWarthunder.cheap\n\n' +
      `You are receiving this email because your email address was signed up to receive a one-time ${HUMAN_READABLE_EVENT_TYPES[eventType]}.\n` +
      `You will not receive any further alerts for ${eventType === 'newItem' ? 'new items' : 'this item'} unless you subscribe again on https://warthunder.cheap/">.\n` +
      'Should you wish to never receive any alerts again, simply click the unsubscribe link below.';
    } else if (format === 'html') {
      return '<p>Greetings,<br>Floris<br>Warthunder.cheap</p>' +
      '<br><p style="font-size: 10pt; color: #797979;">' +
        `You are receiving this email because your email address was signed up to receive a one-time ${HUMAN_READABLE_EVENT_TYPES[eventType]}.\n` +
        `You will not receive any further alerts for ${eventType === 'newItem' ? 'new items' : 'this item'} unless you subscribe again on <a href="https://warthunder.cheap/" target="_blank">warthunder.cheap</a>.\n` +
        'Should you wish to never receive any alerts again, simply click the unsubscribe link below.' +
      '</p>';
    }
  } else {
    if (format === 'text') {
      return 'Greetings,\r\nFloris\r\nWarthunder.cheap\n\n' +
      'You are receiving this email because your email address was signed up to receive alerts from Warthunder.cheap.\n' +
      'Should you wish to never receive any alerts again, simply click the unsubscribe link below.';
    } else if (format === 'html') {
      return '<p>Greetings,<br>Floris<br>Warthunder.cheap</p>' +
      '<br><p style="font-size: 10pt; color: #797979;">' +
        'You are receiving this email because your email address was signed up to receive alerts from Warthunder.cheap.\n' +
        'Should you wish to never receive any alerts again, simply click the unsubscribe link below.' +
      '</p>';
    }
  }

  return '';
}
