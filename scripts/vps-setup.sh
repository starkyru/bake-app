#!/bin/bash
set -euo pipefail

echo "=== Bake App VPS Setup ==="

# 1. Install dependencies
echo "[1/6] Installing system packages..."
apt update && apt upgrade -y
apt install -y postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx ufw

# 2. Enable services
systemctl enable --now postgresql redis-server

# 3. Create app user (adjust if user already exists)
echo "[2/6] Checking deploy user..."
DEPLOY_USER="${DEPLOY_USER:-ilia}"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo ">>> Created user $DEPLOY_USER. Add SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
fi

# 4. Create directories
echo "[3/6] Creating directories..."
mkdir -p /opt/bake-app
mkdir -p /var/www/bake-app/{pos-app,admin-dashboard,kitchen-screen,manager-dashboard,hub-app}
chown -R "$DEPLOY_USER":"$DEPLOY_USER" /opt/bake-app /var/www/bake-app

# 5. Configure firewall
echo "[4/6] Configuring UFW..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 6. Copy nginx configs
echo "[5/6] Setting up Nginx..."
if [ -d "/opt/bake-app/nginx" ]; then
  cp /opt/bake-app/nginx/bake-*.conf /etc/nginx/sites-available/
  for conf in /opt/bake-app/nginx/bake-*.conf; do
    name=$(basename "$conf")
    ln -sf /etc/nginx/sites-available/"$name" /etc/nginx/sites-enabled/"$name"
  done
  nginx -t && systemctl reload nginx
fi

echo "[6/6] Setup complete!"
echo ""
echo "=== Next steps ==="
echo "1. Clone repo:  su - $DEPLOY_USER -c 'git clone <repo-url> /opt/bake-app'"
echo "2. Create /opt/bake-app/ecosystem.config.js (see repo for template)"
echo "3. Install & build:"
echo "   cd /opt/bake-app && npm ci && npx nest build apps/api"
echo "4. Start API:  pm2 start ecosystem.config.js && pm2 save"
echo "5. Run certbot for SSL:"
echo "   certbot --nginx -d bake.ilia.to -d api.bake.ilia.to -d pos.bake.ilia.to -d admin.bake.ilia.to -d kitchen.bake.ilia.to -d manager.bake.ilia.to"
