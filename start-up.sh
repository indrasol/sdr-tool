#!/bin/bash

# Prompt user for mode (backend or frontend)
read -p "Enter development mode (backend or frontend): " MODE
# Validate mode choice
if [[ ! "$MODE" =~ ^(backend|frontend)$ ]]; then
  echo "Invalid mode! Please choose 'backend' or 'frontend'."
  exit 1
fi

# Prompt user for environment (dev, stage, prod)
read -p "Enter environment (dev, stage, prod): " ENVIRONMENT
# Validate environment choice
if [[ ! "$ENVIRONMENT" =~ ^(dev|stage|prod)$ ]]; then
  echo "Invalid environment! Please choose 'dev', 'stage', or 'prod'."
  exit 1
fi

# If backend mode, copy the appropriate .env file
if [[ "$MODE" == "backend" ]]; then
  echo "Setting up backend environment..."

  # Copy the appropriate example .env file to sdr_backend/.env
  cp ".env.$MODE.$ENVIRONMENT.example" "./sdr_backend/.env.$ENVIRONMENT"
  if [[ $? -eq 0 ]]; then
    echo ".env.$ENVIRONMENT file created for the backend."
  else
    echo "Error copying the .env file."
    exit 1
  fi
fi

# # Run docker-compose for the selected environment
# echo "Starting containers in $ENVIRONMENT environment..."

# echo "Running command - 'docker-compose -f "docker-compose.$ENVIRONMENT.yml" up --build'"
# # Run the docker-compose command for the selected environment
# docker-compose -f "docker-compose.$ENVIRONMENT.yml" up --build
