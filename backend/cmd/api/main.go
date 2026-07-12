package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/aarushbhutra/nusfuel/backend/internal/handlers"
	"github.com/aarushbhutra/nusfuel/backend/internal/store"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

func main() {
	tableName := strings.TrimSpace(os.Getenv("GOALS_TABLE_NAME"))
	if tableName == "" {
		log.Fatal("GOALS_TABLE_NAME is required")
	}

	awsConfig, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("load AWS config: %v", err)
	}

	goalStore := store.NewDynamoDBGoalStore(dynamodb.NewFromConfig(awsConfig), tableName)
	lambda.Start((handlers.GoalHandler{Store: goalStore}).Handle)
}
