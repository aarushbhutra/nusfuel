variable "aws_region" {
  description = "AWS region for the NUSFuel environment."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Short project name used in AWS resource names."
  type        = string
  default     = "nusfuel"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "log_retention_days" {
  description = "CloudWatch log retention period."
  type        = number
  default     = 30
}
