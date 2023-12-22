locals {
  object_lambda_access_point_domain_name = "${aws_s3control_object_lambda_access_point.image_bucket.alias}.s3.${var.origin_region}.amazonaws.com"
}

resource "aws_cloudfront_cache_policy" "image_distribution" {
  name        = "image-distribution"
  default_ttl = 50
  max_ttl     = 100
  min_ttl     = 1
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = [
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
      }
    }
  }
}

resource "aws_cloudfront_distribution" "image_distribution" {
  provider = aws.distribution_region

  origin {
    domain_name              = local.object_lambda_access_point_domain_name
    origin_id                = local.object_lambda_access_point_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.image_distribution.id
  }

  enabled = true
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.object_lambda_access_point_domain_name

    cache_policy_id = aws_cloudfront_cache_policy.image_distribution.id
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.viewer_request.qualified_arn
      include_body = true

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
    aws_lambda_function.viewer_request,
    aws_cloudfront_origin_access_control.image_distribution
  ]

  tags = {
    Stack = "Image resizing"
  }
}

resource "aws_cloudfront_origin_access_control" "image_distribution" {
  provider = aws.distribution_region

  name                              = "Image Resize"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_lambda_function" "viewer_request" {
  provider = aws.distribution_region

  filename         = data.archive_file.viewer_request_lambda_code.output_path
  function_name    = "ViewerRequestLambda"
  role             = aws_iam_role.viewer_request.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.viewer_request_lambda_code.output_base64sha256
  runtime          = "nodejs20.x"
  publish          = true
  timeout          = 5

  tags = {
    Stack = "Image resizing"
  }

  depends_on = [
    aws_iam_role.viewer_request
  ]
}

resource "aws_iam_role" "viewer_request" {
  provider = aws.distribution_region

  name               = "ViewerRequestLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.viewer_request_lambda_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]

  tags = {
    Stack = "Image resizing"
  }
}
