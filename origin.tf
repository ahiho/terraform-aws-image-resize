resource "aws_s3_bucket" "image_bucket" {
  count    = var.create_new_bucket ? 1 : 0
  provider = aws.origin_region

  bucket = var.image_bucket_name
  tags = {
    Module = "Image Resize"
  }

  force_destroy = true
}

resource "aws_s3_bucket_policy" "image_bucket" {
  count    = var.create_new_bucket ? 1 : 0
  provider = aws.origin_region

  bucket = aws_s3_bucket.image_bucket[0].id
  policy = data.aws_iam_policy_document.s3_bucket[0].json
}

resource "aws_s3_access_point" "image_bucket" {
  bucket   = var.create_new_bucket ? aws_s3_bucket.image_bucket[0].id : var.image_bucket_name
  provider = aws.origin_region

  name = var.image_bucket_name
}

resource "aws_s3control_access_point_policy" "image_bucket" {
  access_point_arn = aws_s3_access_point.image_bucket.arn
  policy           = data.aws_iam_policy_document.s3_access_point.json
}

resource "aws_iam_role" "image_resizing_lambda" {
  provider = aws.origin_region

  name                = "${var.resource_prefix}ImageResizingLambdaRole${var.resource_suffix}"
  assume_role_policy  = data.aws_iam_policy_document.assume_image_resizing_lambda.json
  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonS3ObjectLambdaExecutionRolePolicy"]

  inline_policy {
    name   = "ImageResize"
    policy = data.aws_iam_policy_document.image_resizing_lambda.json
  }
}

resource "aws_lambda_function" "image_resizing_lambda" {
  provider = aws.origin_region

  architectures    = ["x86_64"]
  filename         = data.archive_file.image_resizing_lambda_code.output_path
  function_name    = "${var.resource_prefix}ImageResizingLambda${var.resource_suffix}"
  role             = aws_iam_role.image_resizing_lambda.arn
  handler          = "index.lambdaHandler"
  source_code_hash = data.archive_file.image_resizing_lambda_code.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 60
  environment {
    variables = {
      BUCKET_REGION       = var.origin_region
      BUCKET_ACCESS_POINT = aws_s3_access_point.image_bucket.alias
      LOG_LEVEL           = var.log_level
      ROUNDING_VALUE      = var.rounding_value
    }
  }
}

resource "aws_lambda_permission" "image_resizing_lambda" {
  statement_id  = "AllowExecutionFromCloudFront"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_resizing_lambda.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.image_distribution.arn
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

}

resource "aws_s3control_object_lambda_access_point_policy" "this" {
  name   = aws_s3control_object_lambda_access_point.image_bucket.name
  policy = data.aws_iam_policy_document.s3_object_lambda.json
}
