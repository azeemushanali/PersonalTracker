#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ActionFlow ECS Deployment Script ===${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Get AWS region (default to us-east-1)
AWS_REGION=${AWS_REGION:-us-east-1}
echo -e "${YELLOW}Using AWS Region: $AWS_REGION${NC}\n"

# Navigate to project root
cd "$(dirname "$0")/../.."

# Step 1: Initialize and apply Terraform
echo -e "${GREEN}Step 1: Deploying infrastructure with Terraform...${NC}"
cd infra/terraform
terraform init
terraform apply -auto-approve

# Get ECR URL
ECR_URL=$(terraform output -raw ecr_repository_url)
echo -e "${GREEN}ECR Repository: $ECR_URL${NC}\n"

# Step 2: Build and push Docker image
echo -e "${GREEN}Step 2: Building and pushing Docker image...${NC}"
cd ../..

# Login to ECR
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

# Build image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t actionflow -f backend/Dockerfile .

# Tag image
echo -e "${YELLOW}Tagging image...${NC}"
docker tag actionflow:latest $ECR_URL:latest

# Push to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push $ECR_URL:latest

# Step 3: Update ECS service
echo -e "${GREEN}Step 3: Updating ECS service...${NC}"
aws ecs update-service \
  --cluster actionflow-cluster \
  --service actionflow-service \
  --force-new-deployment \
  --region $AWS_REGION \
  --no-cli-pager

# Get application URL
cd infra/terraform
APP_URL=$(terraform output -raw app_url)

echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Application URL: $APP_URL${NC}"
echo -e "${YELLOW}Note: It may take 2-3 minutes for the service to be available.${NC}\n"
echo -e "To monitor deployment:"
echo -e "  aws ecs describe-services --cluster actionflow-cluster --services actionflow-service --region $AWS_REGION"
echo -e "\nTo view logs:"
echo -e "  aws logs tail /ecs/actionflow --follow --region $AWS_REGION"
