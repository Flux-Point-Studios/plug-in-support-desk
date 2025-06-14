#!/bin/bash

# Quick DigitalOcean Masumi Setup (skip updates)

DROPLET_IP="159.203.90.91"
SSH_KEY="~/.ssh/masumi_do_key"

echo "🚀 Quick Masumi setup on DigitalOcean droplet..."
echo ""

ssh -i $SSH_KEY root@$DROPLET_IP << 'EOF'
# Clean up any locks
rm -f /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock /var/lib/dpkg/lock
dpkg --configure -a

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh

# Install docker-compose
echo "Installing docker-compose..."
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose

# Start Masumi services
echo "Starting Masumi services..."
cd /root/masumi-services
docker-compose up -d

# Wait for services
sleep 20

# Show status
echo ""
echo "=== Docker Status ==="
docker ps

echo ""
echo "=== Testing Services ==="
curl -s http://localhost:3000/api/v1/health | jq '.' || echo "Registry not ready"
curl -s http://localhost:3001/api/v1/health | jq '.' || echo "Payment not ready"
EOF

echo ""
echo "✅ Quick setup complete!"
echo ""
echo "Access your services at:"
echo "  Registry: http://$DROPLET_IP:3000"
echo "  Payment: http://$DROPLET_IP:3001"  
echo "  Admin UI: http://$DROPLET_IP:3001/admin" 