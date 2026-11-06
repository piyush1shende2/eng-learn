#!/usr/bin/env bash
# Starts the teacher server and the app. Press Ctrl+C to stop both.
cd "$(dirname "$0")"
(cd server && npm start) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
npm run dev
