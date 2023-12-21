terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 4.48.0"
      configuration_aliases = [aws.image_origin_region, aws.image_distribution_region]

    }
  }
}

module "image_origin" {
  source = "./modules/image_origin"
  providers = {
    aws = aws.image_origin_region
  }

  image_bucket_name   = var.image_bucket_name
  image_bucket_region = var.image_bucket_region
}

module "image_distribution" {
  source = "./modules/image_distribution"
  providers = {
    aws = aws.image_distribution_region
  }

  origin_access_control_id = module.image_origin.origin_access_control_id
  origin_id                = module.image_origin.image_bucket_id
  image_bucket_domain_name = module.image_origin.bucket_domain_name

  image_bucket_name   = var.image_bucket_name
  image_bucket_region = var.image_bucket_region

  depends_on = [
    module.image_origin
  ]
}
