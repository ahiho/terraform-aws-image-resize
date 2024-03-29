# Image Origin
data "archive_file" "image_resizing_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/build/ImageResize"
  output_path = "${path.module}/build/ImageResize.zip"
}

data "aws_iam_policy_document" "s3_bucket" {
  count = var.create_new_bucket ? 1 : 0

  # delegate the access point the permission to control the access
  statement {
    sid    = "AccessPoint"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = ["*"]
    resources = [
      aws_s3_bucket.image_bucket[0].arn,
      "${aws_s3_bucket.image_bucket[0].arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:DataAccessPointAccount"
      values   = [var.account_id]
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
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = [
      "${aws_s3_access_point.image_bucket.arn}/object/*"
    ]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "aws:CalledVia"
      values   = ["s3-object-lambda.amazonaws.com"]
    }
  }

  statement {
    sid     = "ImageResizeLambda"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = [
      "${aws_s3_access_point.image_bucket.arn}/object/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "image_resizing_lambda" {
  # allow cloudfront to call s3 object lambda
  statement {
    sid     = "S3AccessPoint"
    effect  = "Allow"
    actions = ["s3:GetObject", "s3:PutObject"]
    resources = [
      "${aws_s3_access_point.image_bucket.arn}/object/*"
    ]
  }
}

data "aws_iam_policy_document" "assume_image_resizing_lambda" {

  # allow cloudfront to call s3 object lambda
  statement {
    sid    = "Lambda"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }

}

data "aws_iam_policy_document" "s3_object_lambda" {

  # allow cloudfront to call s3 object lambda
  statement {
    sid    = "Cloufront"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3-object-lambda:Get*"]
    resources = [
      aws_s3control_object_lambda_access_point.image_bucket.arn
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [aws_cloudfront_distribution.image_distribution.arn]
    }
  }

}

