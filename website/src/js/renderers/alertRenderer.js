import { API_URL } from '../env.js';

// TODO: Finish implementing this class, add styling, add in-dialog error messaging, add newItem alert signup
// adjust rows to show human-friendly eventType labels
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

  renderLoginForm() {
    this.container.innerHTML = '';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter your email';
    emailInput.id = 'emailInput';

    const requestButton = document.createElement('button');
    requestButton.textContent = 'Request Access';
    requestButton.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email) {
        alert('Please enter a valid email address.');
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
        alert('A link has been sent to your email.');
      } else {
        alert('Failed to request token. Please try again later.');
      }
    } catch (error) {
      console.error('Error requesting token:', error);
      alert('An error occurred while requesting the token.');
    }
  }

  async reloadAlerts() {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (!response.ok) {
        alert('Failed to fetch alerts. Please check your token or try again later.');
        return;
      }

      this.alerts = await response.json();
      this.renderAlertsTable(this.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      alert('An error occurred while fetching alerts.');
    }
  }

  renderAlertsTable(alerts) {
    this.container.innerHTML = '';

    const alertMessage = document.createElement('p');
    alertMessage.classList.add('alerts__message');
    this.container.appendChild(alertMessage);

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

          alertMessage.classList.remove('error');
          alertMessage.classList.add('success');
          alertMessage.innerText = `Alert set, you will receive an email every time new items are added to the War Thunder store`;

          setTimeout(() => {
            this.reloadAlerts();
          }, 5000);
        }).catch((e) => {
          alertMessage.classList.add('error');
          alertMessage.innerText = `Failed to set alert: ${e.message}`;
        });
      } else {
        if (newItemAlert) {
          await this.deleteAlert(newItemAlert._id);

          setTimeout(() => {
            this.reloadAlerts();
          }, 5000);
        }
      }
    });

    const globalAlertToggleLabel = document.createElement('label');
    globalAlertToggleLabel.textContent = 'Enable alert for new items.';

    globalAlertToggleContainer.appendChild(globalAlertToggle);
    globalAlertToggleContainer.appendChild(globalAlertToggleLabel);
    this.container.appendChild(globalAlertToggleContainer);

    const alertsHeader = document.createElement('h2');
    alertsHeader.textContent = 'Your Alerts';
    this.container.appendChild(alertsHeader);

    // TODO: Add an error/success message area

    if (alerts.length === 0) {
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

    alerts.forEach(alert => {
      if (alert.eventType === 'newItem') {
        return;
      }

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
        alert('Alert deleted successfully.');
        await this.reloadAlerts();
      } else {
        alert('Failed to delete alert. Please try again later.');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('An error occurred while deleting the alert.');
    }
  }
}
