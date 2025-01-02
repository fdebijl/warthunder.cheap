#!/bin/bash

cleanup() {
  # Store the last exit code to a variable to prevent overwriting it with the grep exit code
  result="$?"

  # Check for errors in the container log
  if grep -iq error dry-run.log
  then
    echo "Container dry run failed: error in logs"
    exit 1
  fi

  # Docker exits with 143 when it's SIGTERM'd by the timeout command, we catch that there and exit with 0 instead
  if [ $result -eq 143 ] || [ $result -eq 0 ]
  then
    echo "Container dry run passed: no errors during timeout"
    exit 0
  else
    # If the container exited with any other status, we exit with that instead
    echo "Container dry run failed: errored with $result"
    exit $result
  fi
}

trap 'cleanup' EXIT
(docker run \
  -e MAILGUN_API_KEY \
  -e MAILGUN_DOMAIN\
  -e MAILGUN_SENDER \
  --network host \
  --rm wtcheap.$1:latest \
  timeout --preserve-status 15 node index.js) 2>&1 | tee dry-run.log
