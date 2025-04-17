terraform {
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
}

locals {
  project_name = "feature-request-system"
}

module "vpc" {
  source = "../../modules/vpc"

  project_name = local.project_name
}

module "rds" {
  source = "../../modules/rds"

  project_name           = local.project_name
  public_subnet_ids     = module.vpc.public_subnet_ids
  rds_security_group_id = module.vpc.rds_security_group_id
  db_password           = var.db_password
}

module "ecr" {
  source = "../../modules/ecr"

  repository_name = local.project_name
}

module "ecs" {
  source = "../../modules/ecs"

  project_name         = local.project_name
  aws_region          = var.aws_region
  public_subnet_ids   = module.vpc.public_subnet_ids
  ecs_security_group_id = module.vpc.ecs_security_group_id
  target_group_arn    = module.alb.target_group_arn
  database_url        = "mysql://${module.rds.db_instance_username}:${var.db_password}@${module.rds.db_instance_endpoint}/${module.rds.db_instance_name}"
  nextauth_secret     = var.nextauth_secret
  nextauth_url        = "https://${var.domain_name}"
  google_client_id    = var.google_client_id
  google_client_secret = var.google_client_secret
  container_image     = "${module.ecr.repository_url}:latest"
  app_name           = local.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnets    = module.vpc.private_subnet_ids
  alb_security_group_id = module.alb.security_group_id
}

module "route53" {
  source = "../../modules/route53"

  project_name  = local.project_name
  domain_name   = var.domain_name
  alb_dns_name  = module.alb.alb_dns_name
  alb_zone_id   = module.alb.alb_zone_id
}

module "alb" {
  source = "../../modules/alb"

  project_name         = local.project_name
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  certificate_arn     = module.route53.certificate_arn
  ecs_security_group_id = module.vpc.ecs_security_group_id
} 