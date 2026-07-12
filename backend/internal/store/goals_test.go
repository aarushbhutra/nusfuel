package store

import (
	"context"
	"testing"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type fakeDynamoDB struct {
	item    map[string]types.AttributeValue
	getKey  map[string]types.AttributeValue
	putItem map[string]types.AttributeValue
}

func (f *fakeDynamoDB) GetItem(_ context.Context, input *dynamodb.GetItemInput, _ ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
	f.getKey = input.Key
	return &dynamodb.GetItemOutput{Item: f.item}, nil
}

func (f *fakeDynamoDB) PutItem(_ context.Context, input *dynamodb.PutItemInput, _ ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
	f.putItem = input.Item
	f.item = input.Item
	return &dynamodb.PutItemOutput{}, nil
}

func TestDynamoDBGoalStoreRoundTripsGoalByUserID(t *testing.T) {
	client := &fakeDynamoDB{}
	goals := NewDynamoDBGoalStore(client, "goals")
	fat := 70.0
	goal := contracts.Goal{
		Mode:         "custom",
		CaloriesKcal: 2400,
		ProteinG:     150,
		MoreOptions:  &contracts.MacroTargets{TotalFatG: &fat},
	}

	if err := goals.Put(context.Background(), "user-1", goal); err != nil {
		t.Fatalf("put goal: %v", err)
	}

	got, found, err := goals.Get(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("get goal: %v", err)
	}
	if userID := client.getKey["userId"].(*types.AttributeValueMemberS).Value; userID != "user-1" {
		t.Fatalf("get key = %q, want user-1", userID)
	}
	if !found || got.Mode != goal.Mode || got.CaloriesKcal != goal.CaloriesKcal || got.MoreOptions == nil || got.MoreOptions.TotalFatG == nil || *got.MoreOptions.TotalFatG != fat {
		t.Fatalf("goal = %+v, found = %v, want %+v", got, found, goal)
	}
}

func TestDynamoDBGoalStoreReturnsNotFound(t *testing.T) {
	goals := NewDynamoDBGoalStore(&fakeDynamoDB{}, "goals")
	_, found, err := goals.Get(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("get goal: %v", err)
	}
	if found {
		t.Fatal("expected missing goal")
	}
}

func TestDynamoDBGoalStoreRejectsInvalidGoalAndUser(t *testing.T) {
	goals := NewDynamoDBGoalStore(&fakeDynamoDB{}, "goals")
	if err := goals.Put(context.Background(), "", contracts.Goal{}); err == nil {
		t.Fatal("empty user ID should fail")
	}
	if err := goals.Put(context.Background(), "user-1", contracts.Goal{Mode: "custom"}); err == nil {
		t.Fatal("invalid goal should fail")
	}
}
