#!/usr/bin/env sh
# Builds the real-speaker accent data and voice library. Usage: tools/build_data.sh [datasets folder] [lite|standard|full|max]
set -e
ROOT="${1:-$HOME/datasets}"; PROFILE="${2:-full}"
cd "$(dirname "$0")/.."
python3 -m pip install -r tools/requirements.txt
python3 tools/build_accent_data.py --root "$ROOT" --profile "$PROFILE"
python3 tools/build_voice_library.py --root "$ROOT" --n 60
npm test
