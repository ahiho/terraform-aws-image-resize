terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 4.48.0"
      configuration_aliases = [aws]
    }
  }
}



resource "aws_s3_bucket" "image_bucket" {
  bucket = var.image_bucket_name
  tags = {
    Module = "Image Resizing"
  }
}


resource "aws_s3_bucket_acl" "image_bucket" {
  bucket = aws_s3_bucket.image_bucket.id
  acl    = "private"

  depends_on = [
    aws_s3_bucket.image_bucket
  ]
}

resource "aws_s3_access_point" "image_bucket" {
  bucket = aws_s3_bucket.image_bucket.id
  name   = var.image_bucket_name
  depends_on = [
    aws_s3_bucket.image_bucket
  ]
}

resource "aws_iam_role" "image_resizing_lambda" {
  name               = "ImageResizingLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.image_resizing_lambda_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "image_resizing_lambda" {
  filename         = data.archive_file.image_resizing_lambda_code.output_path
  function_name    = "ImageResizingLambda"
  role             = aws_iam_role.image_resizing_lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_resizing_lambda_code.output_base64sha256
  runtime          = "nodejs14.x"
  timeout          = 60
  environment {
    variables = {
      REGION            = var.image_bucket_region
      IMAGE_BUCKET_NAME = var.image_bucket_name
    }
  }

  depends_on = [
    aws_iam_role.image_resizing_lambda
  ]
}


resource "aws_s3control_object_lambda_access_point" "image_bucket" {
  name = var.image_bucket_name
  configuration {
    supporting_access_point = aws_s3_access_point.image_bucket.arn

    transformation_configuration {
      actions = ["GetObject"]

      content_transformation {
        aws_lambda {
          function_arn = aws_lambda_function.image_resizing_lambda.arn
        }
      }
    }
  }

  depends_on = [
    aws_s3_access_point.image_bucket,
    aws_lambda_function.image_resizing_lambda
  ]

}

resource "aws_cloudfront_origin_access_identity" "this" {
  comment = "This is cloudfront id to access to S3"
}

resource "aws_s3_bucket_policy" "name" {
  bucket = aws_s3_bucket.image_bucket.id
  policy = data.aws_iam_policy_document.allow_cloufront_access_s3_origin.json
}
