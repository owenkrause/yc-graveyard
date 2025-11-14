export interface Company {
  name: string;
  one_liner: string;
  long_description: string;
  batch: string;
  industries: string[];
  industry: string;
  subindustry: string;
  tags: string[];
  status: string;
  stage: string;
  team_size: number;
  small_logo_thumb_url: string;
  website: string;
  slug: string;
  launched_at: number;
  all_locations: string;
  regions: string[];
  former_names: string[];
  nonprofit: boolean;
  top_company: boolean;
  isHiring: boolean;
}

export interface Stats {
  total_inactive: number;
  total_fetched: number;
  batches_count: number;
  industries_count: number;
  last_updated: string;
}
