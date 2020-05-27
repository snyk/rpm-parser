#! /bin/bash

curl -X POST -H 'Content-Type:application/json' -d '{"attachments": [{"color": "#7CD197", "fallback": "Build Notification: '$CIRCLE_BUILD_URL'", "title": "RPM-Parser Build Notification", "text": ":krotik-yay: RPM-Parser Successful Master Build :krotik-yay:"}]}' $SLACK_WEBHOOK
