#!/bin/bash
export PATH="/usr/local/bin:$PATH"
cd "$(dirname "$0")"
exec /usr/local/bin/node ./node_modules/.bin/next dev
