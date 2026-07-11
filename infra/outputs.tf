output "api_url" {
  description = "Base URL for the authenticated HTTP API."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID for the mobile client."
  value       = aws_cognito_user_pool.auth.id
}

output "cognito_client_id" {
  description = "Cognito public client ID for the mobile app."
  value       = aws_cognito_user_pool_client.mobile.id
}

output "goals_table_name" {
  description = "DynamoDB table name used by the goals API."
  value       = aws_dynamodb_table.goals.name
}
