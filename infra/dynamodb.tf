resource "aws_dynamodb_table" "users" {
  name                        = "${local.name}-users"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "email"
  deletion_protection_enabled = var.deletion_protection

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  global_secondary_index {
    name            = "byId"
    projection_type = "ALL"

    key_schema {
      attribute_name = "id"
      key_type       = "HASH"
    }
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "products" {
  name                        = "${local.name}-products"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = var.deletion_protection

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "listKey"
    type = "S"
  }

  attribute {
    name = "createdAtId"
    type = "S"
  }

  global_secondary_index {
    name            = "byCreatedAt"
    projection_type = "ALL"

    key_schema {
      attribute_name = "listKey"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "createdAtId"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }
}
