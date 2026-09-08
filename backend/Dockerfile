FROM golang:1.26.8-bookworm AS tooling
ENV GOTOOLCHAIN=local
WORKDIR /workspace/backend

FROM tooling AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/hash-password ./cmd/hash-password
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -tags="no_azuresql no_clickhouse no_libsql no_mssql no_mysql no_sqlite3 no_vertica no_ydb" -o /out/goose github.com/pressly/goose/v3/cmd/goose

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 focusflow \
    && useradd --system --no-log-init --uid 10001 --gid focusflow --home-dir /app --shell /usr/sbin/nologin focusflow

WORKDIR /app

COPY --from=builder /out/api /app/bin/api
COPY --from=builder /out/hash-password /app/bin/hash-password
COPY --from=builder /out/goose /app/bin/goose
COPY scripts/migrate /app/bin/migrate
COPY migrations /app/migrations

RUN chmod 0555 /app/bin/api /app/bin/hash-password /app/bin/goose /app/bin/migrate \
    && chown -R focusflow:focusflow /app

USER focusflow:focusflow
EXPOSE 8080
CMD ["/app/bin/api"]
