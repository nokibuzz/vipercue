#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

command -v node >/dev/null 2>&1 || { echo 'Node.js is required. Install Node.js 22.12 or newer.' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'npm is required. Install Node.js 22.12 or newer.' >&2; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major<22 || (major===22 && minor<12)) process.exit(1)' || {
  echo 'Node.js 22.12 or newer is required to build this Electron version.' >&2
  exit 1
}
[ -d node_modules/electron ] || { echo 'Dependencies are missing. Run npm install first.' >&2; exit 1; }

node_arch=$(node -p 'process.arch')
hardware_arm=$(sysctl -n hw.optional.arm64 2>/dev/null || true)
if [ "$hardware_arm" = 1 ] && [ "$node_arch" != arm64 ]; then
  echo 'This is an Apple Silicon Mac, but Node.js is running under Rosetta. Install arm64 Node.js and retry from a native Terminal.' >&2
  exit 1
fi
case "$node_arch" in
  arm64) mac_arch=arm64 ;;
  x64) mac_arch=x86_64 ;;
  *) echo "Unsupported Node.js architecture: $node_arch" >&2; exit 1 ;;
esac

npm run pack:local

if [ "$mac_arch" = arm64 ]; then
  app_source="$project_dir/dist/mac-arm64/ViperCue.app"
else
  app_source="$project_dir/dist/mac/ViperCue.app"
fi
[ -d "$app_source" ] || { echo 'The local build did not produce ViperCue.app.' >&2; exit 1; }
lipo "$app_source/Contents/MacOS/ViperCue" -verify_arch "$mac_arch" >/dev/null 2>&1 || {
  echo "The built app does not contain the expected $mac_arch architecture." >&2
  exit 1
}
lipo "$project_dir/vendor/whisper/build/bin/whisper-cli" -verify_arch "$mac_arch" >/dev/null 2>&1 || {
  echo "The Whisper binary does not contain the expected $mac_arch architecture. Remove the old vendor/whisper/build directory and retry." >&2
  exit 1
}
lipo "$project_dir/vendor/shift-monitor/shift-monitor" -verify_arch "$mac_arch" >/dev/null 2>&1 || {
  echo "The Shift monitor does not contain the expected $mac_arch architecture." >&2
  exit 1
}
codesign --verify --deep --strict "$app_source" || {
  echo 'The locally built app did not pass code-signature verification.' >&2
  exit 1
}

install_dir=${VIPERCUE_LOCAL_INSTALL_DIR:-"$HOME/Applications"}
destination="$install_dir/ViperCue.app"
stage="$install_dir/.ViperCue-install-$$.app"
backup_dir="$HOME/Library/Application Support/ViperCue/local-install-backups"
mkdir -p "$install_dir"
ditto "$app_source" "$stage"

if [ -e "$destination" ]; then
  mkdir -p "$backup_dir"
  backup="$backup_dir/ViperCue-$(date +%Y%m%d-%H%M%S)-$$.app"
  mv "$destination" "$backup"
  echo "Previous local installation saved to: $backup"
fi
mv "$stage" "$destination"

echo "Installed: $destination"
echo "To launch: open \"$destination\""
