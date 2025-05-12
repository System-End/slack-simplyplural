import { WebClient } from "@slack/web-api";
import { createCanvas, loadImage, Image } from "canvas";
import * as fs from "fs";
import * as toml from "toml";
import type { FrontStatus, Member, UserConfig } from "./types.js";

function stripPronouns(name: string): string {
  return name.replace(/\{[^}]+\}/g, "").trim();
}

const parsedToml = toml.parse(fs.readFileSync("./users.toml", "utf-8"));
const users = parsedToml.users as UserConfig[];

const client = new WebClient();

async function getAllMembers(systemId: string, token: string): Promise<Member[]> {
  const res = await fetch(`https://api.apparyllis.com/v1/members/${systemId}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getAllGroups(systemId: string, token: string): Promise<{ id: string; content: { name: string, members: string[] } }[]> {
  const res = await fetch(`https://api.apparyllis.com/v1/groups/${systemId}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getCurrentFronters(systemId: string, token: string): Promise<{
  member: Member["content"];
  front_status: FrontStatus["content"];
}[]> {
  const all_members = await getAllMembers(systemId, token);
  const res = await fetch("https://api.apparyllis.com/v1/fronters", {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return (data as FrontStatus[])
    .filter((fr) => !fr.content.custom)
    .map((fr) => {
      const member = all_members.find((m) => m.id === fr.content.member);
      return { member: member!.content, front_status: fr.content };
    });
}

(async () => {
  for (const user of users) {
    console.log(`\n🔄 Processing system: ${user["System Name"]}`);
    try {
      const systemId = user["Simply Plural ID"];
      const token = user["Simply Plural Token"];

      const allMembers = await getAllMembers(systemId, token);
      const allGroups = await getAllGroups(systemId, token);
      const fronters = await getCurrentFronters(systemId, token);

      const excludedGroupNames = (user["Exclude Groups"] ?? []).map((g) => g.toLowerCase());
      const groupReplacements = user["Group Replacements"] ?? {};
      const fallbackReplacement = user["Excluded Replacement"] ?? null;

      const excludedMemberIds = new Set<string>();
      const triggeredGroups = new Set<string>();

      for (const group of allGroups) {
        const name = group.content.name.toLowerCase();
        if (excludedGroupNames.includes(name)) {
          for (const memberId of group.content.members) {
            excludedMemberIds.add(memberId);
          }
          console.log(`📛 Excluding group "${group.content.name}" with members: ${group.content.members.join(", ")}`);
        }
      }

      const visibleMembers: typeof fronters = [];
      const seenMemberIds = new Set<string>();
      const frontingIds = new Set<string>(fronters.map(f => f.front_status.member));

      // Process each fronter
      for (const fr of fronters) {
        const id = fr.front_status.member;
        console.log(`🔍 Checking fronter ${fr.member.name} (ID: ${id})`);

        if (excludedMemberIds.has(id)) {
          for (const group of allGroups) {
            const name = group.content.name.toLowerCase();
            if (excludedGroupNames.includes(name) && group.content.members.includes(id)) {
              triggeredGroups.add(name);
            }
          }
          console.log(`🚫 Excluding fronter: ${fr.member.name}`);
          continue;
        }

        visibleMembers.push(fr);
        seenMemberIds.add(id);
        console.log(`✅ Including fronter: ${fr.member.name}`);
      }

      for (const group of triggeredGroups) {
        const replacementId = groupReplacements[group];

        if (replacementId && frontingIds.has(replacementId)) {
          console.log(`⚠️ Replacement for group "${group}" is already fronting. Skipping.`);
          continue;
        }

        let replacement = null;
        if (replacementId) {
          replacement = allMembers.find(m => m.id === replacementId);
        }

        if (replacement) {
          if (seenMemberIds.has(replacement.id)) {
            console.log(`⚠️ Replacement ${replacement.content.name} already added. Skipping duplicate.`);
            continue;
          }
          console.log(`➕ Using replacement: ${replacement.content.name} (ID: ${replacement.id})`);
          visibleMembers.push({
            member: replacement.content,
            front_status: {
              member: replacement.id,
              custom: false,
              timestamp: "",
            },
          });
          seenMemberIds.add(replacement.id);
        } else if (fallbackReplacement) {
          console.log(`⚠️ Using fallback for group "${group}": ${fallbackReplacement.Name}`);
          visibleMembers.push({
            member: {
              name: fallbackReplacement.Name,
              pronouns: fallbackReplacement.Pronouns,
              avatarUrl: fallbackReplacement.Avatar,
              description: "",
              custom: "",
              groups: [],
            },
            front_status: {
              member: "",
              custom: false,
              timestamp: "",
            },
          });
        } else {
          console.warn(`❌ No replacement found for group "${group}"`);
        }
      }

      if (visibleMembers.length === 0) {
        console.log("ℹ️ No members to show after filtering.");
        continue;
      }

      const images: Image[] = await Promise.all(
        visibleMembers.map((fr) =>
          loadImage(fr.member.avatarUrl || user["Default Avatar"])
        )
      );

      const n = images.length;
      const columns = n <= 3 ? n : 2;
      const rows = Math.ceil(n / columns);
      const chunkWidth = Math.floor(Math.min(...images.map((img) => img.width)) / columns);
      const chunkHeight = Math.floor(Math.min(...images.map((img) => img.height)));

      const canvas = createCanvas(chunkWidth * columns, chunkHeight * rows);
      const ctx = canvas.getContext("2d");

      images.forEach((img, i) => {
        const cropX = Math.floor(img.width / 2 - chunkWidth / 2);
        const col = i % columns;
        const row = Math.floor(i / columns);
        ctx.drawImage(
          img,
          cropX,
          0,
          chunkWidth,
          chunkHeight,
          col * chunkWidth,
          row * chunkHeight,
          chunkWidth,
          chunkHeight
        );
      });

      await client.users.setPhoto({
        image: canvas.toBuffer("image/png"),
        token: user["Slack User Token"],
      });

      const pronouns: Record<string, typeof visibleMembers> = {};
      for (const fr of visibleMembers) {
        const key = fr.member.pronouns.toLowerCase() || "unspecified";
        pronouns[key] ??= [];
        pronouns[key].push(fr);
      }

      await client.users.profile.set({
        profile: {
          real_name: `${visibleMembers
            .map((x) => stripPronouns(x.member.name))
            .join(", ")} (${user["System Name"]})`,
          pronouns: Object.entries(pronouns)
            .map(
              ([key, members]) =>
                `${key} (${members
                  .map((x) => stripPronouns(x.member.name))
                  .join(", ")})`
            )
            .join(", "),
        },
        token: user["Slack User Token"],
      });

      console.log("✅ Slack profile and photo updated.");
    } catch (err) {
      console.error(`💥 Error processing system "${user["System Name"]}":`, err);
    }
  }
})();
