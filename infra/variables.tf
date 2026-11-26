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
