#!/bin/sh
set -eu
mkdir -p vendor/shift-monitor
xcrun swiftc -O src/shift-monitor.swift -o vendor/shift-monitor/shift-monitor
lipo vendor/shift-monitor/shift-monitor -verify_arch "$(uname -m)" >/dev/null 2>&1 || {
  echo 'The Shift monitor architecture does not match this Mac.' >&2
  exit 1
}
