output "image_bucket_id" {
  value = aws_s3_bucket.image_bucket.id
}

output "origin_access_control_id" {
  value = aws_cloudfront_origin_access_control.this.id
}

output "bucket_domain_name" {
  value = aws_s3_bucket.image_bucket.bucket_domain_name
}