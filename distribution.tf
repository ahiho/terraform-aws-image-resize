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
          "height",
          "original",
          "quality",
          "transform",
          "width",
          "blur",
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

    viewer_protocol_policy = "allow-all"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "blacklist"
      locations        = ["CN"]
    }
  }

  aliases = var.alternative_domain_names

  viewer_certificate {
    cloudfront_default_certificate = var.custom_ssl_cert_arn ? false : true
    acm_certificate_arn            = var.custom_ssl_cert_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

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
