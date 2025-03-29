variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "ID of the RDS security group"
  type        = string
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "feature_request_system"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "root"
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
} 