#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This helper currently supports macOS only."
  exit 1
fi

origin_pattern="${OLLAMA_ORIGINS:-chrome-extension://*}"
health_origin="chrome-extension://webpicker-health-check"
api_url="http://127.0.0.1:11434/api/tags"

echo "Configuring Ollama origins: ${origin_pattern}"
launchctl setenv OLLAMA_ORIGINS "${origin_pattern}"

if pgrep -x Ollama >/dev/null 2>&1; then
  killall Ollama
fi

for attempt in {1..20}; do
  if ! pgrep -x Ollama >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

for attempt in {1..5}; do
  if open -a Ollama; then
    break
  fi
  sleep 0.5
done

for attempt in {1..20}; do
  status_code="$(
    curl --silent \
      --output /dev/null \
      --write-out "%{http_code}" \
      --header "Origin: ${health_origin}" \
      "${api_url}" || true
  )"

  if [[ "${status_code}" == "200" ]]; then
    echo "Ollama is ready and accepts Chrome extension origins."
    exit 0
  fi

  sleep 0.5
done

echo "Ollama did not accept the test request. Check the Ollama app logs and try again."
exit 1
