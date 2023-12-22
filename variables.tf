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
  validation {
    condition     = var.create_new_bucket == true ? false : true
    error_message = "can not use existing bucket when set image_bucket_id=true"
  }
  nullable = true
}
