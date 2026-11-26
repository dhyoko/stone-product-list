resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name    = "${local.name}-api"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "dist/lambda.handler"
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  memory_size      = var.lambda_memory_mb
  timeout          = 10

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      NODE_ENV                 = "production"
      USERS_TABLE              = aws_dynamodb_table.users.name
      PRODUCTS_TABLE           = aws_dynamodb_table.products.name
      REDIS_URL                = local.redis_url
      REDIS_KEY_PREFIX         = "${local.name}:"
      JWT_SECRET_SSM_PARAMETER = aws_ssm_parameter.jwt_secret.name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_vpc_access,
  ]
}
