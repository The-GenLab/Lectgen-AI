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
THREADS="${WHISPER_THREADS:-}"
BEAM_SIZE="${WHISPER_BEAM_SIZE:-}"
BEST_OF="${WHISPER_BEST_OF:-}"
VAD="${WHISPER_VAD:-0}"
VAD_MODEL="${WHISPER_VAD_MODEL:-}"
NO_TIMESTAMPS="${WHISPER_NO_TIMESTAMPS:-0}"
NO_CONTEXT="${WHISPER_NO_CONTEXT:-0}"

if [ "$MODEL_NAME" = "large" ]; then
  MODEL_NAME="large-v3"
fi

MODEL="/models/ggml-${MODEL_NAME}.bin"
DL="$ROOT/models/download-ggml-model.sh"

if [ ! -f "$DL" ]; then
  echo "[whisper] download script not found at $DL"
  exit 1
fi

if [ ! -f "$MODEL" ]; then
  echo "[whisper] downloading model: $MODEL_NAME"
  "$DL" "$MODEL_NAME" /models
else
  MODEL_SIZE="$(stat -c%s "$MODEL" 2>/dev/null || echo 0)"
  MODEL_MAGIC="$(od -An -t x1 -N4 "$MODEL" 2>/dev/null | tr -d ' \n' || echo '')"
  if [ "$MODEL_SIZE" -lt 1000000 ] || ( [ "$MODEL_MAGIC" != "67676d6c" ] && [ "$MODEL_MAGIC" != "6c6d6767" ] ); then
    echo "[whisper] model file looks corrupted (size=$MODEL_SIZE, magic=$MODEL_MAGIC). Re-downloading: $MODEL_NAME"
    rm -f "$MODEL"
    "$DL" "$MODEL_NAME" /models
  fi
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

if [ -n "$THREADS" ]; then
  ARGS+=( -t "$THREADS" )
fi

if [ -n "$BEAM_SIZE" ]; then
  ARGS+=( -bs "$BEAM_SIZE" )
fi

if [ -n "$BEST_OF" ]; then
  ARGS+=( -bo "$BEST_OF" )
fi

if [ "$NO_TIMESTAMPS" = "1" ] || [ "$NO_TIMESTAMPS" = "true" ]; then
  ARGS+=( -nt )
fi

if [ "$NO_CONTEXT" = "1" ] || [ "$NO_CONTEXT" = "true" ]; then
  ARGS+=( -nc )
fi

if [ "$VAD" = "1" ] || [ "$VAD" = "true" ]; then
  if [ -n "$VAD_MODEL" ]; then
    ARGS+=( --vad -vm "$VAD_MODEL" )
  else
    echo "[whisper] WHISPER_VAD is enabled but WHISPER_VAD_MODEL is empty; skipping VAD"
  fi
fi

if [ "$SUPPRESS_NST" = "1" ] || [ "$SUPPRESS_NST" = "true" ]; then
  ARGS+=( -sns )
fi

if [ -n "$PROMPT" ]; then
  ARGS+=( --prompt "$PROMPT" )
fi

exec "$SERVER" "${ARGS[@]}"
