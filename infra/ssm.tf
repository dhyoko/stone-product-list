resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project}/${var.environment}/jwt-secret"
  description = "HS256 secret that signs the API access tokens."
  type        = "SecureString"
  value       = random_password.jwt_secret.result
}
