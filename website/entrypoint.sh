#!/bin/sh

ENV_JS_FILE="/usr/share/nginx/html/js/env.js"

# Add whitelisted environment variables that should be exported to the frontend here
WHITELIST="API_URL"

echo "// Whitelisted environment variables" > $ENV_JS_FILE

for var in $WHITELIST; do
    value=$(printenv "$var")
    if [ ! -z "$value" ]; then
        escaped_value=$(echo "$value" | sed "s/'/\\\'/g")
        echo "export const $var = '$escaped_value';" >> $ENV_JS_FILE
    fi
done

exec nginx -g "daemon off;"
