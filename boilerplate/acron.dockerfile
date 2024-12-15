FROM node:__NODEVERSION__-alpine AS base
WORKDIR /usr/src/%%PROJECTNAME%%
COPY package*.json ./

# Builder image used only for compiling Typescript files
FROM base as builder
RUN npm ci
COPY . .
RUN npm run compile

# Lean production image that just contains the dist directory (copied to the root of the workdir) and runtime dependencies
FROM base as prod
RUN npm ci --only=production
COPY --from=builder /usr/src/%%PROJECTNAME%%/dist ./

# Setup cronjob
RUN mkdir -p /etc/cron.d
COPY %%PROJECTNAME%%-cron /etc/cron.d/%%PROJECTNAME%%-cron
RUN chmod 0644 /etc/cron.d/%%PROJECTNAME%%-cron
RUN crontab /etc/cron.d/%%PROJECTNAME%%-cron

# Create the log files to be able to run tail
RUN touch /var/log/cron.log
RUN touch /usr/src/%%PROJECTNAME%%/%%PROJECTNAME%%.log
CMD crond && tail -f /var/log/cron.log
