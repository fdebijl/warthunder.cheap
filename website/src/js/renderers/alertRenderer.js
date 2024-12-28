import { API_URL } from '../env.js';

// TODO: Finish implementing this class, add styling, add in-dialog error messaging, add newItem alert signup
// adjust rows to show human-friendly eventType labels
export class AlertRenderer {
  constructor(selector) {
    this.dialog = document.querySelector(selector);
    this.container = document.querySelector('.alerts__wrapper');
    this.identitySpan = this.dialog.querySelector('.alerts__identity');

    if (!this.container) {
      throw new Error(`Element with selector "${selector}" not found.`);
    }

    this.token = localStorage.getItem('wtcheap-token');
    this.email = localStorage.getItem('wtcheap-email');

    this.init();
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

      const alerts = await response.json();
      this.renderAlertsTable(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      alert('An error occurred while fetching alerts.');
    }
  }

  renderAlertsTable(alerts) {
    this.container.innerHTML = '';

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
        <th>Event Type</th>
        <th>Item ID</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    alerts.forEach(alert => {
      const row = document.createElement('tr');

      const eventTypeCell = document.createElement('td');
      eventTypeCell.textContent = this.getHumanFriendlyEventType(alert.eventType);
      row.appendChild(eventTypeCell);

      const itemIdCell = document.createElement('td');
      itemIdCell.textContent = alert.itemId || 'N/A';
      row.appendChild(itemIdCell);

      const actionsCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
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
        return 'Price Change';
      case 'itemAvailable':
        return 'Item Available';
      case 'newItem':
        return 'New Item';
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
