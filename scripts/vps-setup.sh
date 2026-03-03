#!/bin/bash
set -euo pipefail

echo "=== Bake App VPS Setup ==="

# 1. Install dependencies
echo "[1/6] Installing system packages..."
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx ufw

# 2. Enable Docker
systemctl enable --now docker

# 3. Create deploy user
echo "[2/6] Creating deploy user..."
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  mkdir -p /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  echo ">>> Add your SSH public key to /home/deploy/.ssh/authorized_keys"
fi

# 4. Create directories
echo "[3/6] Creating directories..."
mkdir -p /opt/bake-app
mkdir -p /var/www/bake-app/{pos-app,admin-dashboard,kitchen-screen,manager-dashboard,hub-app}
chown -R deploy:deploy /opt/bake-app /var/www/bake-app

# 5. Configure firewall
echo "[4/6] Configuring UFW..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 6. Copy nginx configs
echo "[5/6] Setting up Nginx..."
if [ -d "/opt/bake-app/nginx" ]; then
  cp /opt/bake-app/nginx/bake-*.conf /etc/nginx/sites-available/
  for conf in bake-api bake-pos bake-admin bake-kitchen bake-manager bake-hub; do
    ln -sf /etc/nginx/sites-available/${conf}.conf /etc/nginx/sites-enabled/
  done
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
fi

echo "[6/6] Setup complete!"
echo ""
echo "=== Next steps ==="
echo "1. Clone repo:  su - deploy -c 'git clone <repo-url> /opt/bake-app'"
echo "2. Create /opt/bake-app/.env.production with:"
echo "   DB_HOST=postgres"
echo "   DB_PORT=5432"
echo "   DB_NAME=bake_app"
echo "   DB_USER=bake_user"
echo "   DB_PASSWORD=<secure-password>"
echo "   REDIS_HOST=redis"
echo "   REDIS_PORT=6379"
echo "   REDIS_PASSWORD=<secure-password>"
echo "   JWT_SECRET=<secure-secret>"
echo "   CORS_ORIGIN=https://pos.bake.ilia.to,https://admin.bake.ilia.to,https://kitchen.bake.ilia.to,https://manager.bake.ilia.to,https://bake.ilia.to"
echo "   PORT=3000"
echo ""
echo "3. Start services:"
echo "   cd /opt/bake-app && docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. Run certbot for SSL:"
echo "   certbot --nginx -d api.bake.ilia.to -d pos.bake.ilia.to -d admin.bake.ilia.to -d kitchen.bake.ilia.to -d manager.bake.ilia.to -d bake.ilia.to"
