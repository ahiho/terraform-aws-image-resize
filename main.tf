terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 4.48.0"
      configuration_aliases = [aws.origin_region, aws.distribution_region]

    }
  }
}
