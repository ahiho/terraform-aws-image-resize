terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 4.48.0"
      configuration_aliases = [aws]
    }
  }
}


locals {
  origin_access_identity = "origin-access-identity/cloudfront/${var.origin_access_control_id}"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = var.image_bucket_domain_name
    origin_id   = var.origin_id
    s3_origin_config {
      origin_access_identity = local.origin_access_identity
    }
  }


  enabled = true
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = var.origin_id

    forwarded_values {
      query_string = true
      query_string_cache_keys = [
        "h",
        "height",
        "o",
        "original",
        "q",
        "quality",
        "t",
        "transform",
        "w",
        "width",
      ]

      cookies {
        forward = "none"
      }
    }
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.viewer_request.qualified_arn
      include_body = true

    }
    lambda_function_association {
      event_type = "origin-response"
      lambda_arn = aws_lambda_function.origin_response.qualified_arn
    }


    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = ["CN"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  depends_on = [
    aws_lambda_function.origin_response,
    aws_lambda_function.viewer_request
  ]
}


resource "aws_lambda_function" "viewer_request" {
  filename         = data.archive_file.viewer_request_lambda_code.output_path
  function_name    = "ViewerRequestLambda"
  role             = aws_iam_role.viewer_request.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.viewer_request_lambda_code.output_base64sha256
  runtime          = "nodejs14.x"
  publish          = true
  timeout          = 5

  depends_on = [
    aws_iam_role.viewer_request
  ]
}

resource "aws_lambda_function" "origin_response" {
  filename         = data.archive_file.origin_response_lambda_code.output_path
  function_name    = "OriginResponseLambda"
  role             = aws_iam_role.origin_response.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.origin_response_lambda_code.output_base64sha256
  publish          = true
  runtime          = "nodejs14.x"
  timeout          = 30
  depends_on = [
    aws_iam_role.origin_response
  ]
}

resource "aws_iam_role" "viewer_request" {
  name               = "ViewerRequestLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.viewer_request_lambda_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]

  tags = {
    Stack = "Image resizing"
  }
}

resource "aws_iam_role" "origin_response" {
  name               = "OriginResponseLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.origin_response_lambda_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
  tags = {
    Stack = "Image resizing"
  }

  inline_policy {
    name = "AllowInvokeLambda"
    policy = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Action" : "lambda:*",
          "Resource" : "arn:aws:lambda:*:633674601707:function:*"
        }
      ]
    })
  }
}
