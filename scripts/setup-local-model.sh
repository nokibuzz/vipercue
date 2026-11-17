#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
whisper_dir="$project_dir/vendor/whisper"
source_dir="$whisper_dir/source"
build_dir="$whisper_dir/build"
model_dir="$whisper_dir/model"
binary="$build_dir/bin/whisper-cli"
model="$model_dir/ggml-base.bin"
expected_arch=$(uname -m)

if [ -x "$binary" ] && ! lipo "$binary" -verify_arch "$expected_arch" >/dev/null 2>&1; then
  previous="$whisper_dir/build-previous-$(date +%Y%m%d-%H%M%S)-$$"
  mv "$build_dir" "$previous"
  echo "Moved a Whisper build for a different Mac architecture to $previous"
fi

if [ -x "$binary" ] && [ -s "$model" ]; then
  exit 0
fi

if [ ! -x "$binary" ]; then
  command -v cmake >/dev/null 2>&1 || { echo 'CMake is required to build local speech recognition. Install it, then run npm start again.' >&2; exit 1; }
fi
if [ ! -f "$source_dir/CMakeLists.txt" ]; then
  command -v git >/dev/null 2>&1 || { echo 'Git is required to download whisper.cpp.' >&2; exit 1; }
fi

mkdir -p "$whisper_dir" "$model_dir"
if [ ! -f "$source_dir/CMakeLists.txt" ]; then
  git clone --depth 1 --branch v1.9.5 https://github.com/ggml-org/whisper.cpp.git "$source_dir"
fi
if [ ! -x "$binary" ]; then
  cmake -S "$source_dir" -B "$build_dir" -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_OSX_ARCHITECTURES="$expected_arch" \
    -DBUILD_SHARED_LIBS=OFF -DGGML_METAL=OFF -DGGML_NATIVE=OFF
  cmake --build "$build_dir" --config Release -j 4
fi
if [ ! -s "$model" ]; then
  sh "$source_dir/models/download-ggml-model.sh" base "$model_dir"
fi
[ -x "$binary" ] && [ -s "$model" ] || { echo 'Local Whisper setup did not produce the binary and model.' >&2; exit 1; }
lipo "$binary" -verify_arch "$expected_arch" >/dev/null 2>&1 || { echo "Whisper does not match this Mac ($expected_arch)." >&2; exit 1; }
