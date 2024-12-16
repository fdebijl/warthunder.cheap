FROM node:22 AS base
WORKDIR /usr/src/scraper
COPY package*.json ./

RUN apt-get update && apt-get install -y bash ca-certificates cron fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# Builder image used only for compiling Typescript files
FROM base as builder
RUN npm ci
COPY . .
RUN npm run compile

# Lean production image that just contains the dist directory (copied to the root of the workdir) and runtime dependencies
FROM base as prod
RUN npm ci --only=production
COPY --from=builder /usr/src/scraper/dist ./

# Setup cronjob
RUN mkdir -p /etc/cron.d
COPY scraper-cron /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron
RUN crontab /etc/cron.d/scraper-cron

# Create the log files to be able to run tail
RUN touch /var/log/cron.log
RUN touch /usr/src/scraper/scraper.log
CMD printenv > /etc/environment && service cron start && tail -f /var/log/cron.log
