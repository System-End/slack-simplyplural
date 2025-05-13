import { WebClient } from "@slack/web-api";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import toml from "toml";
import { loadCachedFronters, saveFronters } from "./frontierCache.js";
import type { FrontStatus, Member, UserConfig } from "./types.js";

function stripPronouns(name: string): string {
  return name.replace(/\{[^}]+\}/g, "").trim();
}

const users = (toml.parse(fs.readFileSync("users.toml", "utf-8")) as { users: UserConfig[] }).users;
const client = new WebClient();

async function getAllMembers(systemId: string, token: string): Promise<Member[]> {
  const res = await fetch(`https://api.apparyllis.com/v1/members/${systemId}`, {
    headers: { Authorization: token },
  });
  return res.json();
}

async function getAllGroups(systemId: string, token: string) {
  const res = await fetch(`https://api.apparyllis.com/v1/groups/${systemId}`, {
    headers: { Authorization: token },
  });
  return res.json() as Promise<
    { id: string; content: { name: string; members: string[] } }[]
  >;
}

async function getCurrentFronters(systemId: string, token: string, members: Member[]) {
  const res = await fetch("https://api.apparyllis.com/v1/fronters", {
    headers: { Authorization: token },
  });
  const fronters = (await res.json()) as FrontStatus[];
  return fronters
    .filter((f) => !f.content.custom)
    .map((f) => ({
      member: members.find((m) => m.id === f.content.member)!.content,
      front_status: f.content,
    }));
}

for (const user of users) {
  try {
    console.log(`Processing system: ${user["System Name"]}`);
    const token = user["Simply Plural Token"];
    const systemId = user["Simply Plural ID"];
    const allMembers = await getAllMembers(systemId, token);
    const allGroups = await getAllGroups(systemId, token);
    const fronters = await getCurrentFronters(systemId, token, allMembers);

    const currentIds = fronters.map((f) => f.front_status.member).sort();
    const cached = loadCachedFronters().sort();
    if (JSON.stringify(currentIds) === JSON.stringify(cached)) {
      console.log("No change in fronters.");
      continue;
    }
    saveFronters(currentIds);

    const excludedGroups = new Set(
      (user["Exclude Groups"] ?? []).map((g) => g.toLowerCase())
    );
    const groupMap = Object.fromEntries(
      allGroups.map((g) => [g.content.name.toLowerCase(), g.content.members])
    );
    const excludedMemberIds = new Set<string>();
    for (const [name, members] of Object.entries(groupMap)) {
      if (excludedGroups.has(name)) {
        members.forEach((id) => excludedMemberIds.add(id));
      }
    }

    const groupReplacements = user["Group Replacements"] ?? {};
    const fallback = user["Excluded Replacement"];

    const final: typeof fronters = [];
    const seen = new Set<string>();
    const frontingIds = new Set(fronters.map((f) => f.front_status.member));
    const triggeredGroups = new Set<string>();

    for (const f of fronters) {
      if (excludedMemberIds.has(f.front_status.member)) {
        for (const [group, ids] of Object.entries(groupMap)) {
          if (excludedGroups.has(group) && ids.includes(f.front_status.member)) {
            triggeredGroups.add(group);
          }
        }
        console.log(`Excluding member ${f.member.name}`);
        continue;
      }
      final.push(f);
      seen.add(f.front_status.member);
    }

    for (const group of triggeredGroups) {
      const replacementId = groupReplacements[group.toLowerCase()];
      if (replacementId) {
        const repl = allMembers.find((m) => m.id === replacementId);
        if (repl && !frontingIds.has(replacementId) && !seen.has(replacementId)) {
          final.push({
            member: repl.content,
            front_status: {
              custom: false,
              member: repl.id,
              timestamp: "",
            },
          });
          seen.add(repl.id);
          console.log(`Replaced group \"${group}\" with ${repl.content.name}`);
        }
      } else if (!replacementId && fallback && !final.some((f) => f.member.name === fallback.Name)) {
        final.push({
          member: {
            name: fallback.Name,
            pronouns: fallback.Pronouns,
            avatarUrl: fallback.Avatar,
            groups: [],
          },
          front_status: {
            custom: false,
            member: "",
            timestamp: "",
          },
        });
        console.log(`Used fallback replacement for group \"${group}\"`);
      }
    }

    if (final.length === 0) {
      console.log("No visible members to display.");
      continue;
    }

    const images = await Promise.all(
      final.map((f) => loadImage(f.member.avatarUrl || user["Default Avatar"]))
    );

    const cols = final.length > 3 ? 2 : final.length;
    const rows = Math.ceil(final.length / cols);
    const size = 128;
    const canvas = createCanvas(cols * size, rows * size);
    const ctx = canvas.getContext("2d");

    images.forEach((img, i) => {
      const x = (i % cols) * size;
      const y = Math.floor(i / cols) * size;

      const cropSize = Math.min(img.width, img.height);
      const cropX = Math.floor((img.width - cropSize) / 2);
      const cropY = Math.floor((img.height - cropSize) / 2);

      ctx.drawImage(
        img,
        cropX, cropY, cropSize, cropSize, // source crop
        x, y, size, size                 // destination
      );
    });

    await client.users.setPhoto({
      image: canvas.toBuffer("image/png"),
      token: user["Slack User Token"],
    });

    const pronounMap = new Map<string, string[]>();
    final.forEach((f) => {
      const p = f.member.pronouns || "unspecified";
      const name = stripPronouns(f.member.name);
      if (!pronounMap.has(p)) pronounMap.set(p, []);
      pronounMap.get(p)!.push(name);
    });

    await client.users.profile.set({
      token: user["Slack User Token"],
      profile: {
        real_name: `${final.map((f) => stripPronouns(f.member.name)).join(", ")} (${user["System Name"]})`,
        pronouns: [...pronounMap.entries()]
          .map(([p, names]) => `${p} (${names.join(", ")})`)
          .join(", "),
      },
    });

    console.log("Slack profile updated.");
  } catch (err) {
    console.error(`Failed for system \"${user["System Name"]}\":`, err);
  }
}
