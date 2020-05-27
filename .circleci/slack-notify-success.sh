#! /bin/bash

curl -X POST -H 'Content-Type:application/json' -d '{"attachments": [{"color": "#7CD197", "fallback": "Build Notification: '$CIRCLE_BUILD_URL'", "title": "RPM-Parser Publish Notification", "text": ":krotik-yay: RPM-Parser Was Published :krotik-yay:"}]}' $SLACK_WEBHOOK
