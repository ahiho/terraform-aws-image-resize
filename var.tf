variable "origin_region" {
  type        = string
  description = "the region of s3 bucket"
}

variable "image_bucket_name" {
  type        = string
  description = "Your image bucket name"
}

variable "create_new_bucket" {
  type        = bool
  description = "decide to create new s3 bucket to store image or use existing bucket"
}

variable "image_bucket_id" {
  type        = string
  description = "id of existing s3 bucket when create_new_bucket=false"
  nullable    = true
}

variable "routing_value" {
  type        = number
  description = "The rounding value to be used during image resizing"
  nullable    = true
}
