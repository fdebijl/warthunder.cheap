FROM nginx:alpine

COPY ./src /usr/share/nginx/html

COPY entrypoint.sh /docker-entrypoint.d/entrypoint.sh
RUN chmod +x /docker-entrypoint.d/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.d/entrypoint.sh"]
