output "users_table_name" {
  description = "Name of the DynamoDB users table."
  value       = aws_dynamodb_table.users.name
}

output "products_table_name" {
  description = "Name of the DynamoDB products table."
  value       = aws_dynamodb_table.products.name
}

output "jwt_secret_parameter_name" {
  description = "Name of the SSM parameter that holds the JWT secret."
  value       = aws_ssm_parameter.jwt_secret.name
}
