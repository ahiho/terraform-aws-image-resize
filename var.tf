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

variable "log_level" {
  type        = string
  description = "The rounding value to be used during image resizing"
  default     = "INFO"
}
