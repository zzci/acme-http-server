FROM alpine:3.20

RUN \
  #
  ## install utilities
  apk add --no-cache git sqlite jq curl && \
  #
  ## install pocketbase
  PB_URL=$(curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | jq -r '.assets[] | select(.name | endswith("_linux_amd64.zip")) | .browser_download_url') && \
  curl -L $PB_URL -o /tmp/pb.zip && \
  mkdir -p /app/cms; unzip /tmp/pb.zip -d /app/cms && \
  #
  ## clear
  rm -rf /tmp/* /var/cache/apk/*

COPY devfiles/rootfs /

COPY ext/ /app/cms/

WORKDIR /app/cms

ENV PB_DEBUG=""
ENV PB_LOG_LEVEL=3

EXPOSE 80

CMD [ "/start.sh" ]
