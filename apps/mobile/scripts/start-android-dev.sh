#!/usr/bin/env bash
set -euo pipefail

# Run as your normal user — NOT inside `sudo su`.
if [[ "$(id -u)" -eq 0 ]]; then
  echo "ERROR: Do not run this script as root. Type 'exit' to leave sudo su first."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MOBILE="$ROOT/apps/mobile"
METRO_PORT="${METRO_PORT:-8081}"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools"

AVD="${1:-Medium_Phone_API_36.0}"

if ! command -v adb >/dev/null 2>&1; then
  echo "ERROR: adb not found. Set ANDROID_HOME=$ANDROID_HOME"
  exit 1
fi

if ! adb devices | grep -qE 'device$'; then
  echo "No Android device/emulator attached. Starting AVD: $AVD"
  if [[ ! -x "$ANDROID_HOME/emulator/emulator" ]]; then
    echo "ERROR: emulator binary missing at $ANDROID_HOME/emulator/emulator"
    exit 1
  fi
  "$ANDROID_HOME/emulator/emulator" -avd "$AVD" &
  echo "Waiting for emulator to boot..."
  adb wait-for-device
  for _ in $(seq 1 60); do
    boot="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
    if [[ "$boot" == "1" ]]; then
      break
    fi
    sleep 2
  done
fi

echo "Devices:"
adb devices

if adb devices | grep -qE 'emulator-.*device$'; then
  echo "Setting adb reverse for Metro (${METRO_PORT})..."
  adb reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}" || true
fi

echo "Stopping any existing Metro bundlers on 8081/8082..."
lsof -ti:8081,8082 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

cd "$ROOT"
exec pnpm --filter mobile exec expo start --localhost --port "$METRO_PORT" --clear
