# Image Origin
data "archive_file" "image_resizing_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/code/image-resizing/"
  output_path = "${path.module}/code/ir.zip"
}

data "aws_iam_policy_document" "s3_bucket" {

  # delegate the access point the permission to control the access
  statement {
    sid    = "AccessPoint"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = "*"
    }
    actions = ["*"]
    resources = [
      aws_s3_bucket.image_bucket.arn,
      "${aws_s3_bucket.image_bucket.arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:DataAccessPointAccount"
      values   = ["633674601707"]
    }
  }
}

data "aws_iam_policy_document" "s3_access_point" {

  # allow the cloudfront to access s3 access point via s3 object lambda
  statement {
    sid    = "CloufrontViaS3ObjectLambda"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = "cloudfront.amazonaws.com"
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.image_bucket.arn,
      "${aws_s3_bucket.image_bucket.arn}/*"
    ]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "aws:CalledVia"
      values   = ["s3-object-lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "s3_object_lambda" {

  # allow cloudfront to call s3 object lambda
  statement {
    sid    = "Cloufront"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = "cloudfront.amazonaws.com"
    }
    actions = ["s3-object-lambda:Get*"]
    resources = [
      aws_s3_bucket.image_bucket.arn,
      "${aws_s3_bucket.image_bucket.arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      # todo: need to specify the distribution id
      values = [aws_cloudfront_distribution.image_distribution.arn]
    }
  }

  depends_on = []
}

# Image Distribution
data "aws_iam_policy_document" "viewer_request_lambda_policy" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "archive_file" "viewer_request_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/code/viewer-request/dist/"
  output_path = "${path.module}/code/vr.zip"
}

data "archive_file" "origin_response_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/code/origin-response/"
  output_path = "${path.module}/or.zip"
}
