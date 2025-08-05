#!/bin/bash

# BonkDotCapital Deployment Script
set -e

echo "🚀 Starting BonkDotCapital deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your production values before deploying!"
    echo "   Especially update the MongoDB password for production."
fi

# Ask user which environment to deploy
echo "🤔 Which environment do you want to deploy?"
echo "1) Development (local with Docker)"
echo "2) Production (for AWS deployment)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Deploying for development..."
        docker-compose down
        docker-compose up --build -d
        ;;
    2)
        echo "🚀 Deploying for production..."
        echo "⚠️  Make sure you've updated the .env file with production values!"
        read -p "Continue? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up --build -d
        else
            echo "Deployment cancelled."
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🔗 Your backend should be available at:"
    echo "   http://localhost:8080/api/v1/stats"
    echo ""
    echo "📱 Don't forget to update your frontend URLs to point to your production backend!"
else
    echo "❌ Some services failed to start. Check logs:"
    docker-compose logs
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Check status: docker-compose ps"