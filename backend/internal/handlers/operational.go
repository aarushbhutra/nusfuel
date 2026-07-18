package handlers

import (
	"context"

	"github.com/aarushbhutra/nusfuel/backend/internal/logging"
)

func logPostgresFailure(ctx context.Context, operation string, err error) {
	logging.Error(ctx, "PostgreSQL operation failed", "operation", operation, "error", err)
}
