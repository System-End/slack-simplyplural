export interface Member {
  id: string;
  content: {
    name: string;
    pronouns: string;
    avatarUrl?: string;
    description?: string;
    custom?: string;
    groups?: string[];
  };
}

export interface FrontStatus {
  id: string;
  content: {
    member: string;
    custom: boolean;
    timestamp: string;
  };
}

export interface UserConfig {
  "System Name": string;
  "Simply Plural Token": string;
  "Simply Plural ID": string;
  "Slack User Token": string;
  "Default Avatar": string;
  "Exclude Groups"?: string[];
  "Group Replacements"?: Record<string, string>; // group name → replacement member ID
  "Excluded Replacement"?: {
    Name: string;
    Pronouns: string;
    Avatar: string;
  };
}
