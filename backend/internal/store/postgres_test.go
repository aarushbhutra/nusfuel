package store

import (
	"strings"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

func TestPostgresGoalRecordPreservesOptionalValues(t *testing.T) {
	fat := 70.0
	goal := contracts.Goal{Mode: "custom", CaloriesKcal: 2400, ProteinG: 150, MoreOptions: &contracts.MacroTargets{TotalFatG: &fat}, Profile: &contracts.UserProfile{Age: 24, WeightKg: 68.5, Gender: contracts.GenderFemale}}
	got := newPostgresGoal(goal).goal()
	if got.MoreOptions == nil || got.MoreOptions.TotalFatG == nil || *got.MoreOptions.TotalFatG != fat || got.Profile == nil || *got.Profile != *goal.Profile {
		t.Fatalf("goal round trip = %+v", got)
	}
}

func TestInitialSchemaDefinesRailwayQueryIndexes(t *testing.T) {
	for _, statement := range []string{"CREATE TABLE IF NOT EXISTS users", "CREATE TABLE IF NOT EXISTS goals", "CREATE INDEX IF NOT EXISTS meal_logs_user_logged_at_idx"} {
		if !strings.Contains(initialSchema, statement) {
			t.Fatalf("schema missing %q", statement)
		}
	}
}
