#!/bin/sh

cd /app/cms

PB_DEBUG=${PB_DEBUG:+--dev}
exec /app/cms/pocketbase serve --http 0.0.0.0:80 $PB_DEBUG