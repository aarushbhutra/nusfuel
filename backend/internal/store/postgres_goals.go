package store

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
)

type PostgresGoalStore struct{ db *sql.DB }

func NewPostgresGoalStore(db *sql.DB) *PostgresGoalStore { return &PostgresGoalStore{db: db} }

func (s *PostgresGoalStore) Get(ctx context.Context, userID string) (contracts.Goal, bool, error) {
	if err := validateUserID(userID); err != nil {
		return contracts.Goal{}, false, err
	}
	var record postgresGoal
	err := s.db.QueryRowContext(ctx, `
SELECT mode, preset, calories_kcal, protein_g, total_fat_g, carbohydrate_g, sugar_g, profile_age, profile_weight_kg, profile_gender
FROM goals WHERE user_id = $1`, userID).Scan(
		&record.mode, &record.preset, &record.caloriesKcal, &record.proteinG, &record.totalFatG, &record.carbohydrateG, &record.sugarG,
		&record.profileAge, &record.profileWeightKg, &record.profileGender,
	)
	if err == sql.ErrNoRows {
		return contracts.Goal{}, false, nil
	}
	if err != nil {
		return contracts.Goal{}, false, fmt.Errorf("get goal: %w", err)
	}
	goal := record.goal()
	if err := domain.ValidateGoal(goal); err != nil {
		return contracts.Goal{}, false, fmt.Errorf("stored goal is invalid: %w", err)
	}
	return goal, true, nil
}

func (s *PostgresGoalStore) Put(ctx context.Context, userID string, goal contracts.Goal) error {
	if err := validateUserID(userID); err != nil {
		return err
	}
	if err := domain.ValidateGoal(goal); err != nil {
		return fmt.Errorf("validate goal: %w", err)
	}
	record := newPostgresGoal(goal)
	_, err := s.db.ExecContext(ctx, `
INSERT INTO goals (user_id, mode, preset, calories_kcal, protein_g, total_fat_g, carbohydrate_g, sugar_g, profile_age, profile_weight_kg, profile_gender)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
ON CONFLICT (user_id) DO UPDATE SET
  mode = EXCLUDED.mode, preset = EXCLUDED.preset, calories_kcal = EXCLUDED.calories_kcal, protein_g = EXCLUDED.protein_g,
  total_fat_g = EXCLUDED.total_fat_g, carbohydrate_g = EXCLUDED.carbohydrate_g, sugar_g = EXCLUDED.sugar_g,
  profile_age = EXCLUDED.profile_age, profile_weight_kg = EXCLUDED.profile_weight_kg, profile_gender = EXCLUDED.profile_gender, updated_at = now()`,
		userID, record.mode, record.preset, record.caloriesKcal, record.proteinG, record.totalFatG, record.carbohydrateG, record.sugarG,
		record.profileAge, record.profileWeightKg, record.profileGender,
	)
	if err != nil {
		return fmt.Errorf("put goal: %w", err)
	}
	return nil
}

type postgresGoal struct {
	mode, preset                     string
	caloriesKcal, proteinG           float64
	totalFatG, carbohydrateG, sugarG *float64
	profileAge                       *int
	profileWeightKg                  *float64
	profileGender                    *string
}

func newPostgresGoal(goal contracts.Goal) postgresGoal {
	record := postgresGoal{mode: goal.Mode, preset: goal.Preset, caloriesKcal: goal.CaloriesKcal, proteinG: goal.ProteinG}
	if goal.MoreOptions != nil {
		record.totalFatG, record.carbohydrateG, record.sugarG = goal.MoreOptions.TotalFatG, goal.MoreOptions.CarbohydrateG, goal.MoreOptions.SugarG
	}
	if goal.Profile != nil {
		record.profileAge, record.profileWeightKg, record.profileGender = &goal.Profile.Age, &goal.Profile.WeightKg, &goal.Profile.Gender
	}
	return record
}

func (r postgresGoal) goal() contracts.Goal {
	goal := contracts.Goal{Mode: r.mode, Preset: r.preset, CaloriesKcal: r.caloriesKcal, ProteinG: r.proteinG}
	if r.totalFatG != nil || r.carbohydrateG != nil || r.sugarG != nil {
		goal.MoreOptions = &contracts.MacroTargets{TotalFatG: r.totalFatG, CarbohydrateG: r.carbohydrateG, SugarG: r.sugarG}
	}
	if r.profileAge != nil || r.profileWeightKg != nil || r.profileGender != nil {
		goal.Profile = &contracts.UserProfile{Age: valueOrZero(r.profileAge), WeightKg: valueOrZero(r.profileWeightKg), Gender: valueOrZero(r.profileGender)}
	}
	return goal
}

func valueOrZero[T any](value *T) T {
	if value != nil {
		return *value
	}
	var zero T
	return zero
}
