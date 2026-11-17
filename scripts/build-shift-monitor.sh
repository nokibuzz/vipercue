#!/bin/sh
set -eu
mkdir -p vendor/shift-monitor
xcrun swiftc -O src/shift-monitor.swift -o vendor/shift-monitor/shift-monitor
