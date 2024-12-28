import { API_URL } from '../env.js';

export class AlertRenderer {
  dialog;
  container;
  identitySpan;
  token;
  items;
  alerts;


  constructor(selector, items) {
    this.dialog = document.querySelector(selector);
    this.container = document.querySelector('.alerts__wrapper');
    this.identitySpan = this.dialog.querySelector('.alerts__identity');
    this.messageSpan = this.dialog.querySelector('.alerts__message');

    this.items = items;

    if (!this.container) {
      throw new Error(`Element with selector "${selector}" not found.`);
    }

    this.token = localStorage.getItem('wtcheap-token');
    this.email = localStorage.getItem('wtcheap-email');

    this.init();
  }

  get isAuthenticated() {
    return !!this.token;
  }

  async init() {
    if (!this.token) {
      this.identitySpan.textContent = 'Request a login link below to get started.';
      this.renderLoginForm();
    } else {
      this.identitySpan.textContent = `You're currently logged in as ${this.email}`;
      await this.reloadAlerts();
    }
  }

  showMessage(message, isError = false, timeout = 10_000) {
    this.messageSpan.textContent = message;

    if (isError) {
      this.messageSpan.classList.add('error');
    } else {
      this.messageSpan.classList.add('success');
    }

    setTimeout(() => {
      this.messageSpan.textContent = '';
      this.messageSpan.classList.remove('error', 'success');
    }, timeout);
  }

  renderLoginForm() {
    this.container.innerHTML = '';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter your email';
    emailInput.id = 'emailInput';
    emailInput.classList.add('jab');

    const requestButton = document.createElement('button');
    requestButton.textContent = 'Request Access';
    requestButton.classList.add('jab', 'primary');
    requestButton.addEventListener('click', async () => {
      const email = emailInput.value.trim();

      if (!email) {
        this.showMessage('Please enter a valid email address.', true);
        return;
      }

      await this.requestToken(email);
    });

    this.container.appendChild(emailInput);
    this.container.appendChild(requestButton);
  }

  async requestToken(email) {
    try {
      const response = await fetch(`${API_URL}/tokens/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        this.showMessage('A link has been sent to your email.');
      } else {
        this.showMessage('Failed to request token. Please try again later.', true);
      }
    } catch (error) {
      console.error('Error requesting token:', error);
      this.showMessage('An error occurred while requesting the token.', true);
    }
  }

  async reloadAlerts() {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (!response.ok) {
        this.showMessage('Failed to fetch alerts. Please check your token or try again later.', true);
        return;
      }

      this.alerts = await response.json();
      this.renderAlertsTable(this.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      this.showMessage('An error occurred while fetching alerts.', true);
    }
  }

  renderAlertsTable(alerts) {
    this.container.innerHTML = '';

    const visibleAlerts = alerts.filter(alert => alert.eventType !== 'newItem');

    const globalAlertToggleContainer = document.createElement('div');
    globalAlertToggleContainer.classList.add('alerts__global-toggle');

    const newItemAlert = alerts.find(alert => alert.eventType === 'newItem');
    const globalAlertToggle = document.createElement('input');
    globalAlertToggle.type = 'checkbox';
    globalAlertToggle.checked = !!newItemAlert;
    globalAlertToggle.addEventListener('change', async (e) => {
      e.preventDefault();

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      if (this.isAuthenticated) {
        headers.append('Authorization', `Bearer ${this.token}`);
      }

      if (globalAlertToggle.checked) {
        fetch(`${API_URL}/alerts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            recipient: this.email,
            eventType: 'newItem'
          }),
        }).then(async (res) => {
          const body = await res.json();
          return { body, res };
        }).then(({ body, res }) => {
          if (!res.ok || res.status < 200 || res.status >= 300) {
            throw new Error(body.message);
          }

          this.showMessage(`Alert set, you will receive an email every time new items are added to the War Thunder store`);

          setTimeout(() => {
            this.reloadAlerts();
          }, 5000);
        }).catch((e) => {
          console.error('Failed to set alert:', e);
          this.showMessage(`Failed to set alert: ${e.message}`, true);
        });
      } else {
        if (newItemAlert) {
          await this.deleteAlert(newItemAlert._id);

          this.showMessage('Alert removed successfully.');

          setTimeout(() => {
            this.reloadAlerts();
          }, 5000);
        }
      }
    });

    const globalAlertToggleLabel = document.createElement('label');
    globalAlertToggleLabel.textContent = 'Enable alert for new items';

    globalAlertToggleContainer.appendChild(globalAlertToggle);
    globalAlertToggleContainer.appendChild(globalAlertToggleLabel);
    this.container.appendChild(globalAlertToggleContainer);

    const alertsHeader = document.createElement('h2');
    alertsHeader.textContent = 'Your Alerts';
    this.container.appendChild(alertsHeader);

    if (visibleAlerts.length === 0) {
      const noAlertsMessage = document.createElement('p');
      noAlertsMessage.textContent = 'You currently have no alerts.';
      this.container.appendChild(noAlertsMessage);
      return;
    }

    const table = document.createElement('table');
    table.classList.add('alerts__table');

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th></th>
        <th>Item name</th>
        <th>Event type</th>
        <th>Item ID</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    visibleAlerts.forEach(alert => {
      const item = this.items.find(item => item.id === alert.itemId);

      const row = document.createElement('tr');
      row.classList.add('alerts__row');

      if (item) {
        const posterCell = document.createElement('td');
        const posterImage = document.createElement('img');
        posterImage.src = item.poster;
        posterImage.alt = `${item.name} thumbnail`;
        posterImage.classList.add('alerts__poster');
        posterCell.appendChild(posterImage);
        row.appendChild(posterCell);

        const itemNameCell = document.createElement('td');
        itemNameCell.textContent = item.title;
        row.appendChild(itemNameCell);
      } else {
        const posterCell = document.createElement('td');
        row.appendChild(posterCell);

        const itemNameCell = document.createElement('td');
        itemNameCell.textContent = 'N/A';
        row.appendChild(itemNameCell);
      }

      const eventTypeCell = document.createElement('td');
      eventTypeCell.textContent = this.getHumanFriendlyEventType(alert.eventType);
      row.appendChild(eventTypeCell);

      const itemIdCell = document.createElement('td');
      itemIdCell.textContent = alert.itemId || 'N/A';
      row.appendChild(itemIdCell);

      const actionsCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('fab', 'compact', 'dangerous');
      deleteButton.addEventListener('click', async () => {
        await this.deleteAlert(alert._id);
      });
      actionsCell.appendChild(deleteButton);
      row.appendChild(actionsCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    this.container.appendChild(table);
  }

  getHumanFriendlyEventType(eventType) {
    switch (eventType) {
      case 'priceChange':
        return 'Price change';
      case 'itemAvailable':
        return 'Item available';
      case 'newItem':
        return 'New item';
      default:
        return 'Unknown';
    }
  }

  async deleteAlert(alertId) {
    try {
      const response = await fetch(`${API_URL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (response.ok) {
        this.showMessage('Alert deleted successfully.');
        await this.reloadAlerts();
      } else {
        const body = await response.json();
        console.error('Failed to delete alert:', response, body);
        this.showMessage('Failed to delete alert. Please try again later.', true);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      this.showMessage('An error occurred while deleting the alert.', true);
    }
  }
}
