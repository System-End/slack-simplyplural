# slack-simplyplural

Keep your Slack profile synced with SimplyPlural fronters. Built for systems who want to reflect who's fronting in real time — with the ability to exclude groups and set visual replacements.

GitHub: https://github.com/System-End/slack-simplyplural

## Features

- Syncs Slack name, pronouns, and profile picture from SimplyPlural
- Exclude fronters from certain groups
- Replace excluded members with designated alternates or a fallback identity
- Auto-detects and merges multiple avatars into a neat layout
- Crops avatars cleanly and formats a grid for Slack
- Detects changes and only sends updates when needed
- Runs on both Node.js (Linux/macOS/Raspberry Pi) and Bun (Windows)

## Install Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/System-End/slack-simplyplural.git
cd slack-simplyplural
```

### 2. Run Guided Installer

For Linux/macOS/Raspberry Pi or Windows (Git Bash or WSL):
```bash
bash install.sh
```

The installer will:
- Install all dependencies using Bun or Node/npm
- Prompt you to enter tokens and group names
- Create users.toml with your config
- Offer to install a cron job (Linux/macOS)
- Run a one-time sync to test it all

### 3. Configuration

During the installer, you’ll be asked for:
- Your SimplyPlural ID and Token (start token with Bearer)
- Slack user token with users.profile:write and users.setPhoto scopes
- Default avatar URL for fallback
- Comma-separated list of excluded groups (e.g., Littles,Bots)
- Optional: specific group→member replacements
- Optional: fallback member identity (name, pronouns, avatar)

This info is saved in a file called users.toml.

### 4. Automation (Linux/macOS)

The installer will ask to install this cron job:
```bash
*/5 * * * * cd /path/to/project && npx ts-node --loader ts-node/esm index.ts >> log.txt 2>&1
```

If you skip it, you can always add it manually with:
```bash
crontab -e
```

On Windows, use Task Scheduler to run:
```powershell
bun index.ts
```
or:
```powershell
npx ts-node --loader ts-node/esm index.ts
```
every 5 minutes.

### 5. Test

To manually sync anytime:
```bash
bun index.ts
# or:
npx ts-node --loader ts-node/esm index.ts
```

## Uninstall

```bash
bash uninstall-slack-simplyplural.sh
```

Removes the cron job, dependencies, and offers to clean up config files.

## Build Modes

- Bun: easiest and fastest for Windows (recommended)
- Node.js + ts-node: required for Linux, macOS, and Raspberry Pi

Install Bun: https://bun.sh  
Install Node.js: https://nodejs.org

## Need Help?

Open an issue on GitHub or contact @System-End.

---

Built for systems who want control over what shows in Slack — respectful, private, and customizable.
