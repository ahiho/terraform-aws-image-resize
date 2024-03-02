variable "resource_prefix" {
  type        = string
  description = "The prefix to be used for all resources"
}

variable "resource_suffix" {
  type        = string
  description = "The suffix to be used for all resources"
  default     = ""
}

variable "origin_region" {
  type        = string
  description = "the region of s3 bucket"
}

variable "image_bucket_name" {
  type        = string
  description = "Name of bucket will be created or name of existed bucket"
}

variable "create_new_bucket" {
  type        = bool
  description = "decide to create new s3 bucket to store image or use existing bucket"
}

variable "rounding_value" {
  type        = number
  description = "The rounding value to be used during image resizing"
  default     = 0
}

variable "min_width" {
  type        = number
  description = "The minimum width of the image"
  default     = 100
}

variable "min_height" {
  type        = number
  description = "The minimum height of the image"
  default     = 100
}

variable "max_width" {
  type        = number
  description = "The maximum width of the image"
  default     = 4100
}

variable "max_height" {
  type        = number
  description = "The maximum height of the image"
  default     = 4100
}

variable "default_width" {
  type        = number
  description = "The default width of the image"
  default     = 100
}

variable "default_height" {
  type        = number
  description = "The default height of the image"
  default     = 100
}

variable "default_quality" {
  type        = string
  description = "The default quality of the image"
  default     = "h"
}

variable "default_transform" {
  type        = string
  description = "The default transform of the image"
  default     = "c"
}

variable "log_level" {
  type        = string
  description = "The log level to be used in lambda function. Valid values [DEBUG]"
  default     = "INFO"
}

variable "account_id" {
  type        = string
  description = "AWS account ID"
  nullable    = false
}

variable "alternative_domain_names" {
  type        = list(string)
  description = "Alternative domain names for the CloudFront distribution"
  default     = []
}

variable "custom_ssl_cert_arn" {
  type        = string
  description = "ARN of the custom SSL certificate to use for the CloudFront distribution"
}
