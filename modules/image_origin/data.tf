data "archive_file" "image_resizing_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/code/image-resizing/"
  output_path = "${path.module}/ir.zip"
}

data "aws_iam_policy_document" "image_resizing_lambda_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "allow_cloufront_access_s3_origin" {

  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.this.id}"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.image_bucket.arn,
      "${aws_s3_bucket.image_bucket.arn}/*"
    ]
  }
}
