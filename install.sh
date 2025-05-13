#!/usr/bin/env bash

set -e

echo "Slack-SimplyPlural Installer"
echo "-----------------------------"
echo "This script sets up dependencies, asks for configuration, and optionally installs a cron job."
echo

if [ ! -f index.ts ]; then
  echo "index.ts not found. Run this in the root of your project (e.g., after git clone)."
  exit 1
fi

if command -v bun &>/dev/null; then
  echo "Bun detected. Installing dependencies..."
  bun install
  if [[ $(uname -s) == "Linux" ]]; then
    echo "Note: Bun does not currently support node-canvas on Linux due to unsupported libuv functions."
    echo "Falling back to Node.js runtime (ts-node) for compatibility."
    RUNTIME="node index.js"
    npx tsc
  else
    RUNTIME="bun index.ts"
  fi
elif command -v npm &>/dev/null; then
  echo "npm detected. Installing dependencies..."
  if [[ $(uname -s) == "Linux" ]]; then
    sudo apt update
    sudo apt install -y nodejs npm build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
  elif [[ $(uname) == "Darwin" ]]; then
    brew install cairo pango libpng jpeg giflib librsvg
  fi
  npm install
  npm install -g typescript
  RUNTIME="node index.js"
  npx tsc
else
  echo "Bun or npm not found. Install Node.js (https://nodejs.org) or Bun (https://bun.sh)"
  exit 1
fi

[ ! -f tsconfig.json ] && echo '{"compilerOptions":{"target":"es2020","module":"es2022","moduleResolution":"node","esModuleInterop":true,"strict":true,"skipLibCheck":true}}' > tsconfig.json
[ ! -f package.json ] && echo '{"type": "module"}' > package.json

if [ ! -f users.toml ]; then
  echo "Setting up users.toml..."
  read -p "System Name: " SYS_NAME
  read -p "SimplyPlural Token (start with 'Bearer '): " SP_TOKEN
  read -p "SimplyPlural ID: " SP_ID
  read -p "Slack User Token: " SLACK_TOKEN
  read -p "Default Avatar URL: " DEFAULT_AVATAR
  read -p "Exclude Groups (comma-separated): " RAW_EXCLUDE
  EXCL_GROUPS=$(echo $RAW_EXCLUDE | awk '{gsub(",", "\", \""); print "[\"" $0 "\"]"}')

  echo "Optional replacement for excluded group:"
  read -p "Group name to replace: " REPL_GROUP
  read -p "Replacement member ID: " REPL_MEMBER

  echo "Fallback replacement (used if no one fronting):"
  read -p "Fallback Name: " FALLBACK_NAME
  read -p "Fallback Pronouns: " FALLBACK_PRONOUNS
  read -p "Fallback Avatar URL: " FALLBACK_AVATAR

  echo "Creating users.toml"
  cat <<EOT > users.toml
[[users]]
"System Name" = "$SYS_NAME"
"Simply Plural Token" = "$SP_TOKEN"
"Simply Plural ID" = "$SP_ID"
"Slack User Token" = "$SLACK_TOKEN"
"Default Avatar" = "$DEFAULT_AVATAR"
"Exclude Groups" = $EXCL_GROUPS

[users."Group Replacements"]
$( [ -n "$REPL_GROUP" ] && echo "$REPL_GROUP = \"$REPL_MEMBER\"" )

[users."Excluded Replacement"]
Name = "$FALLBACK_NAME"
Pronouns = "$FALLBACK_PRONOUNS"
Avatar = "$FALLBACK_AVATAR"
EOT
fi

read -p "Install cron job to sync every 5 minutes? [y/N] " CONFIRM_CRON
if [[ $CONFIRM_CRON =~ ^[Yy]$ && ( $(uname) == "Linux" || $(uname) == "Darwin" ) ]]; then
  CRON_LINE="*/5 * * * * cd $(pwd) && $RUNTIME >> log.txt 2>&1"
  (crontab -l 2>/dev/null | grep -v 'index.ts'; echo "$CRON_LINE") | crontab -
  echo "Cron job installed."
fi

echo "Running initial sync..."
$RUNTIME

echo
cat <<FINAL
Setup complete.

Edit users.toml to change configuration.
Run manually with: $RUNTIME
Remove with: bash uninstall-slack-simplyplural.sh

GitHub: https://github.com/System-End/slack-simplyplural
FINAL