package store

import (
	"context"
	"fmt"
	"time"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type mealLogDynamoDBClient interface {
	PutItem(context.Context, *dynamodb.PutItemInput, ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
	Query(context.Context, *dynamodb.QueryInput, ...func(*dynamodb.Options)) (*dynamodb.QueryOutput, error)
}

type DynamoDBMealLogStore struct {
	client    mealLogDynamoDBClient
	tableName string
}

func NewDynamoDBMealLogStore(client mealLogDynamoDBClient, tableName string) *DynamoDBMealLogStore {
	return &DynamoDBMealLogStore{client: client, tableName: tableName}
}

func (s *DynamoDBMealLogStore) Put(ctx context.Context, userID string, mealLog contracts.MealLog) error {
	if err := validateUserID(userID); err != nil {
		return err
	}
	if err := mealLog.Validate(); err != nil {
		return fmt.Errorf("validate meal log: %w", err)
	}
	item, err := attributevalue.MarshalMap(newMealLogItem(userID, mealLog))
	if err != nil {
		return fmt.Errorf("encode meal log: %w", err)
	}
	if _, err := s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	}); err != nil {
		return fmt.Errorf("put meal log: %w", err)
	}
	return nil
}

func (s *DynamoDBMealLogStore) List(ctx context.Context, userID string, start, end time.Time) ([]contracts.MealLog, error) {
	if err := validateUserID(userID); err != nil {
		return nil, err
	}
	if !end.After(start) {
		return nil, fmt.Errorf("meal log range must be positive")
	}

	var logs []contracts.MealLog
	input := &dynamodb.QueryInput{
		TableName:              aws.String(s.tableName),
		KeyConditionExpression: aws.String("userId = :userId AND loggedAt >= :start AND loggedAt < :end"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":userId": &types.AttributeValueMemberS{Value: userID},
			":start":  &types.AttributeValueMemberS{Value: start.UTC().Format(time.RFC3339)},
			":end":    &types.AttributeValueMemberS{Value: end.UTC().Format(time.RFC3339)},
		},
	}
	for {
		result, err := s.client.Query(ctx, input)
		if err != nil {
			return nil, fmt.Errorf("query meal logs: %w", err)
		}
		for _, item := range result.Items {
			var stored mealLogItem
			if err := attributevalue.UnmarshalMap(item, &stored); err != nil {
				return nil, fmt.Errorf("decode meal log: %w", err)
			}
			mealLog := stored.mealLog()
			if err := mealLog.Validate(); err != nil {
				return nil, fmt.Errorf("stored meal log is invalid: %w", err)
			}
			logs = append(logs, mealLog)
		}
		if len(result.LastEvaluatedKey) == 0 {
			return logs, nil
		}
		input.ExclusiveStartKey = result.LastEvaluatedKey
	}
}

type mealLogItem struct {
	UserID          string  `dynamodbav:"userId"`
	ID              string  `dynamodbav:"id"`
	MenuItemID      string  `dynamodbav:"menuItemId"`
	LoggedAt        string  `dynamodbav:"loggedAt"`
	ServingQuantity float64 `dynamodbav:"servingQuantity"`
	EnergyKcal      float64 `dynamodbav:"energyKcal"`
	ProteinG        float64 `dynamodbav:"proteinG"`
	TotalFatG       float64 `dynamodbav:"totalFatG"`
	CarbohydrateG   float64 `dynamodbav:"carbohydrateG"`
	SugarG          float64 `dynamodbav:"sugarG"`
}

func newMealLogItem(userID string, mealLog contracts.MealLog) mealLogItem {
	return mealLogItem{
		UserID:          userID,
		ID:              mealLog.ID,
		MenuItemID:      mealLog.MenuItemID,
		LoggedAt:        mealLog.LoggedAt,
		ServingQuantity: mealLog.ServingQuantity,
		EnergyKcal:      mealLog.NutritionTotal.EnergyKcal,
		ProteinG:        mealLog.NutritionTotal.ProteinG,
		TotalFatG:       mealLog.NutritionTotal.TotalFatG,
		CarbohydrateG:   mealLog.NutritionTotal.CarbohydrateG,
		SugarG:          mealLog.NutritionTotal.SugarG,
	}
}

func (i mealLogItem) mealLog() contracts.MealLog {
	return contracts.MealLog{
		ID:              i.ID,
		MenuItemID:      i.MenuItemID,
		LoggedAt:        i.LoggedAt,
		ServingQuantity: i.ServingQuantity,
		NutritionTotal: contracts.Nutrition{
			EnergyKcal:    i.EnergyKcal,
			ProteinG:      i.ProteinG,
			TotalFatG:     i.TotalFatG,
			CarbohydrateG: i.CarbohydrateG,
			SugarG:        i.SugarG,
		},
	}
}
