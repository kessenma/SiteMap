FROM journeyapps/powersync-service:latest

USER root

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /config

COPY config/sync-config.yaml /config/sync-config.yaml

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV POWERSYNC_CONFIG_PATH=/config/config.yaml

EXPOSE 6061 6062

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:6061/probes/liveness || exit 1

ENTRYPOINT ["/entrypoint.sh"]
