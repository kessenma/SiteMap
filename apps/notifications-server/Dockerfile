# Build stage
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o notifications-server .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/notifications" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    notifications || true

RUN mkdir -p /notifications && chown -R notifications:notifications /notifications

WORKDIR /notifications

COPY --from=builder /app/notifications-server .

RUN chown notifications:notifications notifications-server

USER notifications

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./notifications-server"]
