terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 4.48.0"
      configuration_aliases = [aws.origin_region, aws.distribution_region]

    }
  }
}

provider "aws" {
  allowed_account_ids = ["633674601707"]
  region              = var.origin_region
  alias               = "origin_region"

}

provider "aws" {
  allowed_account_ids = ["633674601707"]
  region              = "us-east-1"
  alias               = "distribution_region"
}
