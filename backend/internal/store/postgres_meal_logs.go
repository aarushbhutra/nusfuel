package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type PostgresMealLogStore struct{ db *sql.DB }

func NewPostgresMealLogStore(db *sql.DB) *PostgresMealLogStore { return &PostgresMealLogStore{db: db} }

func (s *PostgresMealLogStore) Put(ctx context.Context, userID string, mealLog contracts.MealLog) error {
	if err := validateUserID(userID); err != nil {
		return err
	}
	if err := mealLog.Validate(); err != nil {
		return fmt.Errorf("validate meal log: %w", err)
	}
	loggedAt, err := time.Parse(time.RFC3339, mealLog.LoggedAt)
	if err != nil {
		return fmt.Errorf("parse meal log timestamp: %w", err)
	}
	_, err = s.db.ExecContext(ctx, `
INSERT INTO meal_logs (id, user_id, menu_item_id, logged_at, serving_quantity, energy_kcal, protein_g, total_fat_g, carbohydrate_g, sugar_g)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		mealLog.ID, userID, mealLog.MenuItemID, loggedAt.UTC(), mealLog.ServingQuantity, mealLog.NutritionTotal.EnergyKcal,
		mealLog.NutritionTotal.ProteinG, mealLog.NutritionTotal.TotalFatG, mealLog.NutritionTotal.CarbohydrateG, mealLog.NutritionTotal.SugarG,
	)
	if err != nil {
		return fmt.Errorf("put meal log: %w", err)
	}
	return nil
}

func (s *PostgresMealLogStore) List(ctx context.Context, userID string, start, end time.Time) ([]contracts.MealLog, error) {
	if err := validateUserID(userID); err != nil {
		return nil, err
	}
	if !end.After(start) {
		return nil, fmt.Errorf("meal log range must be positive")
	}
	rows, err := s.db.QueryContext(ctx, `
SELECT id, menu_item_id, logged_at, serving_quantity, energy_kcal, protein_g, total_fat_g, carbohydrate_g, sugar_g
FROM meal_logs WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3 ORDER BY logged_at, id`, userID, start.UTC(), end.UTC())
	if err != nil {
		return nil, fmt.Errorf("list meal logs: %w", err)
	}
	defer rows.Close()
	logs := []contracts.MealLog{}
	for rows.Next() {
		var mealLog contracts.MealLog
		var loggedAt time.Time
		if err := rows.Scan(&mealLog.ID, &mealLog.MenuItemID, &loggedAt, &mealLog.ServingQuantity, &mealLog.NutritionTotal.EnergyKcal,
			&mealLog.NutritionTotal.ProteinG, &mealLog.NutritionTotal.TotalFatG, &mealLog.NutritionTotal.CarbohydrateG, &mealLog.NutritionTotal.SugarG); err != nil {
			return nil, fmt.Errorf("scan meal log: %w", err)
		}
		mealLog.LoggedAt = loggedAt.UTC().Format(time.RFC3339)
		if err := mealLog.Validate(); err != nil {
			return nil, fmt.Errorf("stored meal log is invalid: %w", err)
		}
		logs = append(logs, mealLog)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate meal logs: %w", err)
	}
	return logs, nil
}
