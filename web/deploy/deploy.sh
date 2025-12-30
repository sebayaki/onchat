# sudo certbot certonly --email seb@hunt.town --agree-tos -d onchat.sebayaki.com

#!/bin/bash
set -e # script will exit if any command fails

# Configuration
DEPLOY_DIR_BASE="/srv/onchat"
HOST="pumpsea"
RELEASE_DIR="$DEPLOY_DIR_BASE/releases"
CURRENT_LINK="$DEPLOY_DIR_BASE/current"
RETENTION_DAYS=3 # Number of old releases to keep

TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)

# Enable SSH connection multiplexing for faster repeated connections
export SSH_CONTROL_PATH="/tmp/ssh-deploy-$TIMESTAMP"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=$SSH_CONTROL_PATH -o ControlPersist=10m"

# Trap to cleanup SSH control socket on exit
cleanup_ssh() {
  ssh -O exit $SSH_OPTS $HOST 2>/dev/null || true
  rm -f $SSH_CONTROL_PATH
}
trap cleanup_ssh EXIT

echo "Pushing latest changes and tagging..."
git pull && npm version patch --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "v$VERSION"
git tag "v$VERSION"
git push && git push --tags

echo "Building OnChat..."
echo "Installing dependencies..." && npm install
echo "Building widget (outputs to public/widget.js)..." && npm run build:widget
echo "Building static export..." && rm -rf dist && npm run build

# Create directories only if they don't exist
ssh $SSH_OPTS $HOST "
  umask 022
  [ ! -d '$DEPLOY_DIR_BASE' ] && mkdir -p '$DEPLOY_DIR_BASE'
  [ ! -d '$RELEASE_DIR' ] && mkdir -p '$RELEASE_DIR'
  mkdir -p '$RELEASE_DIR/$TIMESTAMP'
"

# MARK: - Deploy Static Files
echo "Deploying static files..."
archive_name="client_build_$TIMESTAMP"

# Use pigz (parallel gzip) if available for faster compression
if command -v pigz &> /dev/null; then
  tar -C dist/ -cf - . | pigz > $archive_name.tar.gz
else
  tar -C dist/ -zcf $archive_name.tar.gz .
fi

scp $SSH_OPTS -C $archive_name.tar.gz $HOST:$RELEASE_DIR/$TIMESTAMP/ && \
ssh $SSH_OPTS $HOST "cd $RELEASE_DIR/$TIMESTAMP && tar -zxf $archive_name.tar.gz && rm $archive_name.tar.gz" && \
rm $archive_name.tar.gz

# Update symlink
echo "Updating symlink..."
ssh $SSH_OPTS $HOST "rm -f $CURRENT_LINK && ln -s $RELEASE_DIR/$TIMESTAMP $CURRENT_LINK"

# --- Cleanup ---
echo "Cleaning up old releases..."
ssh $SSH_OPTS $HOST "find $RELEASE_DIR -maxdepth 1 -type d -name '20*' -mtime +$RETENTION_DAYS -exec rm -rf {} \;"
ssh $SSH_OPTS $HOST "df -h | grep root"

# Fix permissions
echo "Ensuring correct permissions..."
ssh $SSH_OPTS $HOST "chmod 755 '$DEPLOY_DIR_BASE' '$RELEASE_DIR' 2>/dev/null || true"

echo "_________"
echo "Deployment to $HOST completed successfully at $TIMESTAMP"
echo "Deployed to: $CURRENT_LINK -> $RELEASE_DIR/$TIMESTAMP"
