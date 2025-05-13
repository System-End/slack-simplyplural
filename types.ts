export interface Member {
  id: string;
  content: {
    name: string;
    pronouns: string;
    avatarUrl: string;
    groups: string[];
  };
}

export interface FrontStatus {
  content: {
    member: string;
    timestamp: string;
    custom: boolean;
  };
}

export interface UserConfig {
  "System Name": string;
  "Simply Plural Token": string;
  "Simply Plural ID": string;
  "Slack User Token": string;
  "Default Avatar": string;
  "Exclude Groups"?: string[];
  "Group Replacements"?: Record<string, string>;
  "Excluded Replacement"?: {
    Name: string;
    Pronouns: string;
    Avatar: string;
  };
}
