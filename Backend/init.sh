#!/bin/bash

echo "Starting backend services..."

echo "Running Docker Compose..."
docker compose up -d

echo "Launching services..."
npm run start:dev