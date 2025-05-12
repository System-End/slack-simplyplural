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

* A Slack user token (not a bot token) with users.profile\:write and users.setPhoto scopes
* Your SimplyPlural system ID and API token
* Node.js or Bun (recommended if you’re on Windows)
* Some way to run TypeScript (ts-node, bun, or compile with tsc)

## 1. Install dependencies

If you’re using Bun (recommended on Windows):

```bash
bun install
```

If you're using npm:

```bash
npm install
```

If canvas fails to build on npm, use Bun or prebuilt binaries.

## 2. Configure users.toml

Rename users.toml.example to users.toml, make a slack app, go to OAUTH, make sure it has profile write in the **USER** scopes, then install to your space. Go to SimplyPlural, settings, account, tokens, select read and then copy it to the users.toml file

Notes:

* Excluded group names are case-insensitive
* Replacements are optional — fallback is used if none is defined
* Replacement members do not need to be fronting

## 3. Run it

If you’re using Bun:

```bash
bun index.ts
```

With ts-node:

```bash
npx ts-node index.ts
```

Or compile TypeScript first:

```bash
npx tsc && node index.js
```

## What shows up in Slack

* Your profile photo becomes a 1×N or 2×2 grid of fronting members (excluding any filtered out)
* Your display name includes all current names (pronouns removed from {brackets})
* Your pronouns field lists all unique pronoun sets and which members use them

## Troubleshooting

* If SimplyPlural returns 401 or 403, make sure your token is correct
* Slack tokens must be user tokens — bot tokens won’t work for profile updates
* If canvas won’t build on npm, try Bun or install native dependencies for node-canvas
* Make sure that all profile pictures are the same size!
