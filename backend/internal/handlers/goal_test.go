package handlers

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
)

type fakeGoalStore struct {
	goals map[string]contracts.Goal
}

func (f *fakeGoalStore) Get(_ context.Context, userID string) (contracts.Goal, bool, error) {
	goal, ok := f.goals[userID]
	return goal, ok, nil
}

func (f *fakeGoalStore) Put(_ context.Context, userID string, goal contracts.Goal) error {
	f.goals[userID] = goal
	return nil
}

func TestGoalHandlerRejectsUnauthenticatedRequests(t *testing.T) {
	store := &fakeGoalStore{goals: map[string]contracts.Goal{}}
	got, err := (GoalHandler{Store: store}).Handle(context.Background(), Request{
		RawPath:        "/goals",
		RequestContext: requestContext{HTTP: httpContext{Method: "GET"}},
	})
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", got.StatusCode)
	}
}

func TestGoalHandlerSavesAndReadsGoalForAuthenticatedUser(t *testing.T) {
	store := &fakeGoalStore{goals: map[string]contracts.Goal{}}
	handler := GoalHandler{Store: store}
	moreOptions := &contracts.MacroTargets{TotalFatG: float64Ptr(70)}
	goal := contracts.Goal{
		Mode:         "custom",
		CaloriesKcal: 2400,
		ProteinG:     150,
		MoreOptions:  moreOptions,
	}
	body, err := json.Marshal(goal)
	if err != nil {
		t.Fatalf("marshal goal: %v", err)
	}

	put, err := handler.Handle(context.Background(), authenticatedRequest("PUT", string(body), "user-1"))
	if err != nil {
		t.Fatalf("put goal: %v", err)
	}
	if put.StatusCode != 200 {
		t.Fatalf("put status = %d, want 200", put.StatusCode)
	}

	get, err := handler.Handle(context.Background(), authenticatedRequest("GET", "", "user-1"))
	if err != nil {
		t.Fatalf("get goal: %v", err)
	}
	if get.StatusCode != 200 {
		t.Fatalf("get status = %d, want 200", get.StatusCode)
	}
	var got contracts.Goal
	if err := json.Unmarshal([]byte(get.Body), &got); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if got.Mode != goal.Mode || got.CaloriesKcal != goal.CaloriesKcal || got.MoreOptions == nil || *got.MoreOptions.TotalFatG != 70 {
		t.Fatalf("goal = %+v, want %+v", got, goal)
	}
}

func TestGoalHandlerValidatesMoreOptions(t *testing.T) {
	store := &fakeGoalStore{goals: map[string]contracts.Goal{}}
	request := authenticatedRequest("PUT", `{"mode":"custom","caloriesKcal":2400,"proteinG":150,"moreOptions":{"totalFatG":-1}}`, "user-1")

	got, err := (GoalHandler{Store: store}).Handle(context.Background(), request)
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 400 {
		t.Fatalf("status = %d, want 400", got.StatusCode)
	}
	if len(store.goals) != 0 {
		t.Fatal("invalid goal should not be stored")
	}
}

func TestGoalHandlerDoesNotReturnAnotherUsersGoal(t *testing.T) {
	store := &fakeGoalStore{goals: map[string]contracts.Goal{
		"user-1": {Mode: "custom", CaloriesKcal: 2000, ProteinG: 120},
	}}

	got, err := (GoalHandler{Store: store}).Handle(context.Background(), authenticatedRequest("GET", "", "user-2"))
	if err != nil {
		t.Fatalf("handle request: %v", err)
	}
	if got.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", got.StatusCode)
	}
}

func authenticatedRequest(method, body, userID string) Request {
	return Request{
		RawPath: "/goals",
		Body:    body,
		RequestContext: requestContext{
			HTTP: httpContext{Method: method},
			Authorizer: authorizerContext{JWT: jwtContext{Claims: map[string]string{
				"sub": userID,
			}}},
		},
	}
}

func float64Ptr(value float64) *float64 {
	return &value
}
