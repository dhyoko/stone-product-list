variable "project" {
  description = "Name used as the prefix of every resource."
  type        = string
  default     = "product-api"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,20}$", var.project))
    error_message = "project must be 3 to 21 lowercase letters, digits, or hyphens, and start with a letter."
  }
}

variable "environment" {
  description = "Deployment environment, such as dev or prod."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for every resource."
  type        = string
  default     = "us-east-1"
}

variable "deletion_protection" {
  description = "Turn on deletion protection for the DynamoDB tables."
  type        = bool
  default     = true
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC. Each private subnet takes a /24 from it."
  type        = string
  default     = "10.20.0.0/16"
}

variable "redis_node_type" {
  description = "ElastiCache node type for the rate limit counters."
  type        = string
  default     = "cache.t4g.micro"
}

variable "lambda_zip_path" {
  description = "Path of the zip that `npm run package:lambda` builds in back/."
  type        = string
  default     = "../back/build/lambda.zip"
}

variable "lambda_memory_mb" {
  description = "Memory of the API Lambda in MB. Lambda gives more CPU with more memory, and argon2 needs the CPU."
  type        = number
  default     = 1024
}

variable "log_retention_days" {
  description = "Days that CloudWatch keeps the API Lambda logs."
  type        = number
  default     = 14
}

variable "api_rate_limit" {
  description = "Requests per second that API Gateway accepts for the whole API, before the app limits run."
  type        = number
  default     = 100
}

variable "api_burst_limit" {
  description = "Request burst that API Gateway accepts for the whole API."
  type        = number
  default     = 200
}

variable "waf_login_limit" {
  description = "Login requests that one IP can send in 5 minutes before WAF blocks it."
  type        = number
  default     = 100

  validation {
    condition     = var.waf_login_limit >= 10
    error_message = "waf_login_limit must be at least 10, the WAF minimum."
  }
}
