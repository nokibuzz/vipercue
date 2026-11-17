#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
whisper_dir="$project_dir/vendor/whisper"
source_dir="$whisper_dir/source"
build_dir="$whisper_dir/build"
model_dir="$whisper_dir/model"
binary="$build_dir/bin/whisper-cli"
model="$model_dir/ggml-base.bin"

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
  cmake -S "$source_dir" -B "$build_dir" -DCMAKE_BUILD_TYPE=Release
  cmake --build "$build_dir" --config Release -j 4
fi
if [ ! -s "$model" ]; then
  sh "$source_dir/models/download-ggml-model.sh" base "$model_dir"
fi
[ -x "$binary" ] && [ -s "$model" ] || { echo 'Local Whisper setup did not produce the binary and model.' >&2; exit 1; }
