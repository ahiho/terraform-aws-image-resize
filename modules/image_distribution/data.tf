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

data "aws_iam_policy_document" "origin_response_lambda_policy" {
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
  output_path = "${path.module}/vr.zip"
}

data "archive_file" "origin_response_lambda_code" {
  type        = "zip"
  source_dir  = "${path.module}/code/origin-response/"
  output_path = "${path.module}/or.zip"
}
