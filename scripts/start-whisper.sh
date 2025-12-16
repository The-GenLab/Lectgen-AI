#!/usr/bin/env bash
set -euxo pipefail

ROOT=""
if [ -d /whisper.cpp ]; then
  ROOT="/whisper.cpp"
elif [ -d /app ]; then
  ROOT="/app"
else
  ROOT="/"
fi

echo "[whisper] ROOT=$ROOT"
cd "$ROOT"

MODEL_NAME="${WHISPER_MODEL_NAME:-base}"
LANGUAGE="${WHISPER_LANGUAGE:-vi}"
PROMPT="${WHISPER_PROMPT:-}"
SUPPRESS_NST="${WHISPER_SUPPRESS_NST:-1}"

MODEL="/models/ggml-${MODEL_NAME}.bin"
DL="$ROOT/models/download-ggml-model.sh"

if [ ! -f "$DL" ]; then
  echo "[whisper] download script not found at $DL"
  exit 1
fi

if [ ! -f "$MODEL" ]; then
  echo "[whisper] downloading model: $MODEL_NAME"
  "$DL" "$MODEL_NAME" /models
fi

SERVER=""
SERVER="$(command -v whisper-server || true)"
if [ -z "$SERVER" ]; then SERVER="$(command -v whisper-whisper-server || true)"; fi
if [ -z "$SERVER" ] && [ -x "$ROOT/build/bin/whisper-server" ]; then SERVER="$ROOT/build/bin/whisper-server"; fi
if [ -z "$SERVER" ] && [ -x "$ROOT/build/bin/whisper-whisper-server" ]; then SERVER="$ROOT/build/bin/whisper-whisper-server"; fi

if [ -z "$SERVER" ]; then
  echo "[whisper] whisper server binary not found"
  echo "[whisper] PATH=$PATH"
  ls -lah "$ROOT/build/bin" || true
  exit 1
fi

echo "[whisper] SERVER=$SERVER"
ARGS=(
  -m "$MODEL"
  --host 0.0.0.0
  --port 8080
  --convert
  -ng
  --tmp-dir /tmp
  -l "$LANGUAGE"
)

if [ "$SUPPRESS_NST" = "1" ] || [ "$SUPPRESS_NST" = "true" ]; then
  ARGS+=( -sns )
fi

if [ -n "$PROMPT" ]; then
  ARGS+=( --prompt "$PROMPT" )
fi

exec "$SERVER" "${ARGS[@]}"
