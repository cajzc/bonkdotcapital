# BonkDotCapital AWS Deployment Guide

This guide will help you deploy your BonkDotCapital backend and database to AWS.

## 🏗️ Architecture Overview

- **Backend**: Go application running in Docker container
- **Database**: MongoDB (using AWS DocumentDB or EC2 with MongoDB)
- **Hosting**: AWS EC2 or AWS ECS with Application Load Balancer

## 📋 Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed locally
4. Git repository for your code

## 🚀 Deployment Options

### Option 1: Simple EC2 Deployment (Recommended for beginners)

#### Step 1: Create EC2 Instance

1. **Launch EC2 Instance**:
   - AMI: Amazon Linux 2023
   - Instance Type: t3.medium (or t3.small for testing)
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 8080 (Backend)
   - Key Pair: Create/select for SSH access

2. **Connect to your instance**:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-public-ip
   ```

#### Step 2: Install Dependencies on EC2

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git

# Logout and login again for docker group changes
exit
```

#### Step 3: Deploy Your Application

```bash
# Clone your repository
git clone https://github.com/yourusername/bonkdotcapital.git
cd bonkdotcapital

# Create environment file
cp .env.example .env

# Edit environment variables for production
nano .env
# Update MONGO_URI and any other production settings

# Start services with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### Step 4: Configure Security Group

Add these rules to your EC2 Security Group:
- **Port 8080**: Your backend API (0.0.0.0/0 or specific IPs)
- **Port 27017**: MongoDB (only from backend security group)
- **Port 22**: SSH access (your IP only)

### Option 2: AWS ECS with DocumentDB (Production-ready)

#### Step 1: Create DocumentDB Cluster

1. Go to AWS DocumentDB console
2. Create cluster:
   - Engine: MongoDB 4.0+
   - Instance class: db.t3.medium
   - Number of instances: 1 (or 3 for HA)
   - Username: `admin`
   - Password: Generate secure password
   - VPC: Default or custom VPC

3. **Note the cluster endpoint** (e.g., `docdb-cluster.xxxxx.us-east-1.docdb.amazonaws.com`)

#### Step 2: Create ECS Cluster

1. Go to AWS ECS console
2. Create cluster:
   - Launch type: Fargate
   - Name: `bonkcapital-cluster`
   - VPC: Same as DocumentDB

#### Step 3: Create Task Definition

```json
{
  "family": "bonkcapital-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "bonkcapital-backend",
      "image": "YOUR_ECR_URI/bonkcapital-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "8080"
        },
        {
          "name": "MONGO_URI",
          "value": "mongodb://admin:YOUR_PASSWORD@YOUR_DOCDB_ENDPOINT:27017/lending_platform?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bonkcapital-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 📱 Frontend Configuration

You'll need to update your frontend to point to your production backend:

### Update API URLs

In `/frontend/lib/apiClient.ts` and `/frontend/lib/websocketClient.ts`:

```typescript
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-backend-domain.com/api/v1'; // Your production URL
  }
  
  if (Platform.OS === 'android') {
    return 'http://192.168.1.111:8080/api/v1'; // Your local development
  } else {
    return 'http://localhost:8080/api/v1';
  }
};
```

## 🔒 Security Considerations

### Production Environment Variables

Create a `.env` file for production with secure values:

```bash
# Strong MongoDB credentials
MONGO_URI=mongodb://admin:VERY_SECURE_PASSWORD_HERE@your-production-host:27017/lending_platform?authSource=admin

# Production port
PORT=8080

# Add any other production-specific variables
```

### AWS Security Best Practices

1. **Use AWS Secrets Manager** for database passwords
2. **Enable VPC** for network isolation
3. **Use Security Groups** to restrict access
4. **Enable CloudWatch** for monitoring
5. **Use HTTPS** with SSL certificates (AWS Certificate Manager)

## 🚀 Quick Deploy Commands

### Local Development with Docker
```bash
# Start everything locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### Production Deploy to EC2
```bash
# On your local machine - build and push to ECR
docker build -t bonkcapital-backend ./backend
docker tag bonkcapital-backend:latest YOUR_ECR_URI/bonkcapital-backend:latest
docker push YOUR_ECR_URI/bonkcapital-backend:latest

# On EC2 instance
docker pull YOUR_ECR_URI/bonkcapital-backend:latest
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Monitoring and Logs

### Check Application Status
```bash
# Check if containers are running
docker ps

# View backend logs
docker-compose logs -f backend

# View database logs
docker-compose logs -f mongodb

# Check resource usage
docker stats
```

### AWS CloudWatch (for ECS deployment)
- Set up log groups for your ECS tasks
- Monitor CPU and memory usage
- Set up alarms for high error rates

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check MongoDB URI format
   - Verify security group allows port 27017
   - Ensure MongoDB is running

2. **Backend Not Accessible**:
   - Check security group allows port 8080
   - Verify backend is listening on correct port
   - Check EC2 instance status

3. **Frontend Can't Connect**:
   - Update API URLs to production endpoint
   - Check CORS settings in backend
   - Verify backend is accessible from internet

### Debug Commands
```bash
# Test backend health
curl http://your-ec2-ip:8080/api/v1/stats

# Check MongoDB connection
docker exec -it mongodb_container mongo --eval "db.stats()"

# View all running containers
docker ps -a
```

## 💰 Cost Estimation

### Basic Setup (Monthly)
- **EC2 t3.medium**: ~$30-40
- **EBS Storage (20GB)**: ~$2
- **Data Transfer**: ~$5-10
- **Total**: ~$40-55/month

### Production Setup (Monthly)
- **DocumentDB (1 instance)**: ~$60-80
- **ECS Fargate**: ~$15-25
- **Application Load Balancer**: ~$18
- **Total**: ~$95-125/month

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify security group configurations
4. Test database connectivity separately

---

**Next Steps**: Once deployed, test your endpoints and update the frontend configuration to use your production backend URL.