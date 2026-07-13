package store

import (
	"context"
	"testing"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type fakeMealLogDynamoDB struct {
	item       map[string]types.AttributeValue
	queryInput *dynamodb.QueryInput
}

func (f *fakeMealLogDynamoDB) PutItem(_ context.Context, input *dynamodb.PutItemInput, _ ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
	f.item = input.Item
	return &dynamodb.PutItemOutput{}, nil
}

func (f *fakeMealLogDynamoDB) Query(_ context.Context, input *dynamodb.QueryInput, _ ...func(*dynamodb.Options)) (*dynamodb.QueryOutput, error) {
	f.queryInput = input
	return &dynamodb.QueryOutput{Items: []map[string]types.AttributeValue{f.item}}, nil
}

func TestDynamoDBMealLogStorePersistsScaledTotalsAndQueriesTimeRange(t *testing.T) {
	client := &fakeMealLogDynamoDB{}
	logs := NewDynamoDBMealLogStore(client, "meal-logs")
	mealLog := contracts.MealLog{
		ID: "log-1", MenuItemID: "meal-1", LoggedAt: "2026-07-13T08:00:00Z", ServingQuantity: 1.5,
		NutritionTotal: contracts.Nutrition{EnergyKcal: 750, ProteinG: 45, TotalFatG: 15, CarbohydrateG: 75, SugarG: 7.5},
	}
	if err := logs.Put(context.Background(), "user-1", mealLog); err != nil {
		t.Fatalf("put meal log: %v", err)
	}

	start := time.Date(2026, 7, 13, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 0, 1)
	got, err := logs.List(context.Background(), "user-1", start, end)
	if err != nil {
		t.Fatalf("list meal logs: %v", err)
	}
	if len(got) != 1 || got[0] != mealLog {
		t.Fatalf("meal logs = %+v, want %+v", got, []contracts.MealLog{mealLog})
	}
	if client.queryInput.KeyConditionExpression == nil || *client.queryInput.KeyConditionExpression != "userId = :userId AND loggedAt >= :start AND loggedAt < :end" {
		t.Fatalf("query condition = %v", client.queryInput.KeyConditionExpression)
	}
	if userID := client.queryInput.ExpressionAttributeValues[":userId"].(*types.AttributeValueMemberS).Value; userID != "user-1" {
		t.Fatalf("query user ID = %q, want user-1", userID)
	}
}
