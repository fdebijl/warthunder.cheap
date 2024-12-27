import { API_URL } from '../env.js';

// TODO: Finish implementing this class, add styling, add in-dialog error messaging, add newItem alert signup
// adjust rows to show human-friendly eventType labels
export class AlertRenderer {
  constructor(selector) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      throw new Error(`Element with selector "${selector}" not found.`);
    }

    this.token = new URLSearchParams(window.location.search).get('token');

    if (!this.token) {
      const token = localStorage.getItem('wtcheap-token');

      if (token) {
        this.token = token;
      }
    } else {
      localStorage.setItem('wtcheap-token', this.token);

      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url);
    }

    this.init();
  }

  async init() {
    if (!this.token) {
      this.renderLoginForm();
    } else {
      await this.renderAlerts();
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

  async renderAlerts() {
    try {
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (!response.ok) {
        alert('Failed to fetch alerts. Please check your token or try again later.');
        return;
      }

      const alerts = await response.json();
      this.container.innerHTML = '';

      alerts.forEach(alert => {
        const alertRow = document.createElement('div');
        alertRow.className = 'alert-row';

        const alertText = document.createElement('span');
        alertText.textContent = `Alert: ${alert.eventType} for Item ID: ${alert.itemId}`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
          await this.deleteAlert(alert._id);
        });

        alertRow.appendChild(alertText);
        alertRow.appendChild(deleteButton);
        this.container.appendChild(alertRow);
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      alert('An error occurred while fetching alerts.');
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
        await this.renderAlerts();
      } else {
        alert('Failed to delete alert. Please try again later.');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('An error occurred while deleting the alert.');
    }
  }
}
