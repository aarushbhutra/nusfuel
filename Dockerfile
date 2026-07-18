FROM golang:1.26.3 AS build

WORKDIR /src
COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download
COPY backend ./backend
COPY data ./data
RUN cd backend && CGO_ENABLED=0 go build -o /out/nusfuel ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/nusfuel ./nusfuel
COPY --from=build /src/data ./data
CMD ["./nusfuel"]
