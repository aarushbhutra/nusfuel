package store

import (
	"context"
	"fmt"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/contracts"
	"github.com/aarushbhutra/nusfuel/backend/internal/domain"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type dynamoDBClient interface {
	GetItem(context.Context, *dynamodb.GetItemInput, ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	PutItem(context.Context, *dynamodb.PutItemInput, ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
}

type DynamoDBGoalStore struct {
	client    dynamoDBClient
	tableName string
}

func NewDynamoDBGoalStore(client dynamoDBClient, tableName string) *DynamoDBGoalStore {
	return &DynamoDBGoalStore{client: client, tableName: tableName}
}

func (s *DynamoDBGoalStore) Get(ctx context.Context, userID string) (contracts.Goal, bool, error) {
	if err := validateUserID(userID); err != nil {
		return contracts.Goal{}, false, err
	}

	result, err := s.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(s.tableName),
		Key: map[string]types.AttributeValue{
			"userId": &types.AttributeValueMemberS{Value: userID},
		},
	})
	if err != nil {
		return contracts.Goal{}, false, fmt.Errorf("get goal: %w", err)
	}
	if len(result.Item) == 0 {
		return contracts.Goal{}, false, nil
	}

	var item goalItem
	if err := attributevalue.UnmarshalMap(result.Item, &item); err != nil {
		return contracts.Goal{}, false, fmt.Errorf("decode goal: %w", err)
	}
	goal := item.goal()
	if err := domain.ValidateGoal(goal); err != nil {
		return contracts.Goal{}, false, fmt.Errorf("stored goal is invalid: %w", err)
	}
	return goal, true, nil
}

func (s *DynamoDBGoalStore) Put(ctx context.Context, userID string, goal contracts.Goal) error {
	if err := validateUserID(userID); err != nil {
		return err
	}
	if err := domain.ValidateGoal(goal); err != nil {
		return fmt.Errorf("validate goal: %w", err)
	}

	item, err := attributevalue.MarshalMap(newGoalItem(userID, goal))
	if err != nil {
		return fmt.Errorf("encode goal: %w", err)
	}
	if _, err := s.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(s.tableName),
		Item:      item,
	}); err != nil {
		return fmt.Errorf("put goal: %w", err)
	}
	return nil
}

type goalItem struct {
	UserID        string   `dynamodbav:"userId"`
	Mode          string   `dynamodbav:"mode"`
	Preset        string   `dynamodbav:"preset,omitempty"`
	CaloriesKcal  float64  `dynamodbav:"caloriesKcal"`
	ProteinG      float64  `dynamodbav:"proteinG"`
	TotalFatG     *float64 `dynamodbav:"totalFatG,omitempty"`
	CarbohydrateG *float64 `dynamodbav:"carbohydrateG,omitempty"`
	SugarG        *float64 `dynamodbav:"sugarG,omitempty"`
}

func newGoalItem(userID string, goal contracts.Goal) goalItem {
	item := goalItem{
		UserID:       userID,
		Mode:         goal.Mode,
		Preset:       goal.Preset,
		CaloriesKcal: goal.CaloriesKcal,
		ProteinG:     goal.ProteinG,
	}
	if goal.MoreOptions != nil {
		item.TotalFatG = goal.MoreOptions.TotalFatG
		item.CarbohydrateG = goal.MoreOptions.CarbohydrateG
		item.SugarG = goal.MoreOptions.SugarG
	}
	return item
}

func (i goalItem) goal() contracts.Goal {
	var moreOptions *contracts.MacroTargets
	if i.TotalFatG != nil || i.CarbohydrateG != nil || i.SugarG != nil {
		moreOptions = &contracts.MacroTargets{
			TotalFatG:     i.TotalFatG,
			CarbohydrateG: i.CarbohydrateG,
			SugarG:        i.SugarG,
		}
	}
	return contracts.Goal{
		Mode:         i.Mode,
		Preset:       i.Preset,
		CaloriesKcal: i.CaloriesKcal,
		ProteinG:     i.ProteinG,
		MoreOptions:  moreOptions,
	}
}

func validateUserID(userID string) error {
	if strings.TrimSpace(userID) == "" {
		return fmt.Errorf("user ID is required")
	}
	return nil
}
