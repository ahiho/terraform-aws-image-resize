resource "aws_s3_bucket" "image_bucket" {
  count    = var.create_new_bucket ? 1 : 0
  provider = aws.origin_region

  bucket = var.image_bucket_name
  tags = {
    Module = "Image Resize"
  }
}

resource "aws_s3_bucket_acl" "image_bucket" {
  provider = aws.origin_region
  count    = var.create_new_bucket ? 1 : 0

  bucket = aws_s3_bucket.image_bucket.id
  acl    = "private"

  depends_on = [
    aws_s3_bucket.image_bucket
  ]
}

resource "aws_s3_bucket_policy" "image_bucket" {
  count    = var.create_new_bucket ? 1 : 0
  provider = aws.origin_region

  bucket = aws_s3_bucket.image_bucket.id
  policy = data.aws_iam_policy_document.allow_cloufront_access_s3_origin.json
}

resource "aws_s3_access_point" "image_bucket" {
  bucket   = var.create_new_bucket ? aws_s3_bucket.image_bucket.id : var.image_bucket_id
  provider = aws.origin_region

  name = var.image_bucket_name
  depends_on = [
    aws_s3_bucket.image_bucket
  ]

}

resource "aws_s3control_access_point_policy" "example" {
  access_point_arn = aws_s3_access_point.image_bucket.arn
  policy           = data.aws_iam_policy_document.s3_access_point.json
}

resource "aws_iam_role" "image_resizing_lambda" {
  provider = aws.origin_region

  name               = "ImageResizingLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.image_resizing_lambda_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

resource "aws_lambda_function" "image_resizing_lambda" {
  provider = aws.origin_region

  filename         = data.archive_file.image_resizing_lambda_code.output_path
  function_name    = "ImageResizingLambda"
  role             = aws_iam_role.image_resizing_lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.image_resizing_lambda_code.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 60
  environment {
    variables = {
      REGION            = var.origin_region
      IMAGE_BUCKET_NAME = var.image_bucket_name
    }
  }

  depends_on = [
    aws_iam_role.image_resizing_lambda
  ]
}

resource "aws_s3control_object_lambda_access_point" "image_bucket" {
  provider = aws.origin_region

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

resource "aws_s3control_object_lambda_access_point_policy" "example" {
  name   = aws_s3control_object_lambda_access_point.image_bucket.name
  policy = data.aws_iam_policy_document.s3_object_lambda.json
}


