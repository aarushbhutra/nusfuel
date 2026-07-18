package logging

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"os"
	"strconv"
	"time"
)

type requestFields struct {
	id    string
	route string
}

type requestFieldsKey struct{}

func Configure() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
}

func NewRequestID() string {
	var value [12]byte
	if _, err := rand.Read(value[:]); err == nil {
		return hex.EncodeToString(value[:])
	}
	return strconv.FormatInt(time.Now().UnixNano(), 36)
}

func WithRequest(ctx context.Context, id, route string) context.Context {
	return context.WithValue(ctx, requestFieldsKey{}, requestFields{id: id, route: route})
}

func Info(ctx context.Context, message string, args ...any) {
	slog.InfoContext(ctx, message, withRequest(ctx, args)...)
}

func Warn(ctx context.Context, message string, args ...any) {
	slog.WarnContext(ctx, message, withRequest(ctx, args)...)
}

func Error(ctx context.Context, message string, args ...any) {
	slog.ErrorContext(ctx, message, withRequest(ctx, args)...)
}

func withRequest(ctx context.Context, args []any) []any {
	fields, _ := ctx.Value(requestFieldsKey{}).(requestFields)
	return append([]any{"request_id", fields.id, "route", fields.route}, args...)
}
