import fs from "fs";

const CACHE_FILE = ".lastFronters.json";

export function loadCachedFronters(): string[] {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveFronters(ids: string[]) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(ids));
}
