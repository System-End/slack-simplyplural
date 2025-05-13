# slack-simplyplural

Credit for most of the code goes to https://github.com/dainfloop! I modified it to include exclusions and remove pronouns if you have them in the name.

Keep your Slack profile in sync with your current fronters in SimplyPlural. This script updates your Slack display name, pronouns, and profile picture to reflect who's fronting — while letting you exclude certain groups and optionally use replacement members instead.

## What it does

* Fetches your current fronters from SimplyPlural
* Lets you exclude fronters in specific groups (like "Littles", "Bots", etc.)
* Replaces excluded fronters with a member of your choice or a default fallback
* Merges avatars into a single profile photo grid
* Updates your Slack display name and pronouns accordingly

## Setup

You’ll need:

* A Slack user token (not a bot token) with `users.profile:write` and `users.setPhoto` scopes
* Your SimplyPlural system ID and API token
* Node.js (recommended for Linux/macOS and Raspberry Pi) or Bun (recommended for Windows)
* TypeScript runtime (ts-node for Node.js or Bun for Windows)

## 1. Install dependencies

### On Windows (using Bun):

Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then:

```bash
bun install
```

### On Linux/Raspberry Pi/macOS (using Node.js):

Install system dependencies:

```bash
sudo apt update
sudo apt install -y nodejs npm build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

Then install project dependencies:

```bash
npm install
npm install -g ts-node typescript
```

## 2. Configure users.toml

Rename users.toml.example to users.toml, make a Slack app, go to OAUTH, make sure it has profile write in the **USER** scopes, then install to your space. Go to SimplyPlural, settings → account → tokens, select "read" and copy it into the users.toml file.

Notes:

* Excluded group names are case-insensitive
* Replacements are optional — fallback is used if none is defined
* Replacement members do not need to be fronting

## 3. Run it

### On Windows (with Bun):

```bash
bun index.ts
```

### On Linux/macOS/Raspberry Pi (with Node.js):

Run using ts-node in ESM mode:

```bash
npx ts-node --loader ts-node/esm index.ts
```

Or compile and run:

```bash
npx tsc && node index.js
```

## 4. Run it as a cron job (Linux / Pi)

Edit crontab:

```bash
crontab -e
```

Add a line like this (adjust path as needed):

```bash
*/5 * * * * cd /home/youruser/slack-simplyplural && npx ts-node --loader ts-node/esm index.ts >> log.txt 2>&1
```

## 5. Minimal TypeScript compatibility setup

Ensure your tsconfig.json contains:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

Ensure your package.json contains:

```json
{
  "type": "module"
}
```

Make sure all local imports include ".js" extensions, like:

```ts
import { loadCachedFronters } from "./frontierCache.js";
```

## What shows up in Slack

* Your profile photo becomes a 1×N or 2×2 grid of fronting members (excluding any filtered out)
* Your display name includes all current names (pronouns removed from {brackets})
* Your pronouns field lists all unique pronoun sets and which members use them

## Troubleshooting

* If SimplyPlural returns 401 or 403, make sure your token starts with `Bearer ` and is valid
* Slack tokens must be user tokens — bot tokens won’t work for profile updates
* If canvas fails to build, install native packages (on Linux) or use Bun (on Windows)
* Make sure all profile pictures are square and the same size for best results

## Compatibility Notes

* Bun is great for Windows users but has limited support for native modules like canvas on Linux/ARM.
* Use Node.js + ts-node for Linux, macOS, and Raspberry Pi to avoid native module issues.
* The project is designed to support both platforms with minimal configuration — just choose the right runtime.

---

Let us know if you encounter any issues or want help setting this up for your system!
