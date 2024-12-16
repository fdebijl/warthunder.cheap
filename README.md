# [Warthunder.cheap](https://warthunder.cheap)

WarThunder.Cheap is a web application that tracks item prices, discounts, and availability in the War Thunder store. It allows users to sign up for alerts on specific items to be notified via email when:

- An item is discounted
- An item is back in stock
- New items are added

The system consists of three main components:

1. **Scraper:** Periodically scrapes the War Thunder store using puppeteer to update price and item information.
2. **API:** Exposes the scraped data and manages user alerts.
3. **Website:** The interface for browsing item data and managing alerts.

## License
This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Acknowledgments
- [Mailgun](https://www.mailgun.com/) for email notifications.
- [Chart.js](https://www.chartjs.org/) for data visualization.
- [LazySizes.js](https://github.com/aFarkas/lazysizes) for image optimization.
