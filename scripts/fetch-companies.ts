/**
 * Script to fetch all inactive YC companies from Algolia API
 * Run with: pnpm tsx scripts/fetch-companies.ts
 */

interface Company {
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

interface AlgoliaResponse {
  results: Array<{
    hits: Company[];
    nbHits: number;
  }>;
}

const ALGOLIA_ENDPOINT =
  "https://45bwzj1sgc-dsn.algolia.net/1/indexes/*/queries";
const ALGOLIA_HEADERS = {
  "x-algolia-agent":
    "Algolia for JavaScript (3.35.1); Browser; JS Helper (3.16.1)",
  "x-algolia-application-id": "45BWZJ1SGC",
  "x-algolia-api-key":
    "MjBjYjRiMzY0NzdhZWY0NjExY2NhZjYxMGIxYjc2MTAwNWFkNTkwNTc4NjgxYjU0YzFhYTY2ZGQ5OGY5NDMxZnJlc3RyaWN0SW5kaWNlcz0lNUIlMjJZQ0NvbXBhbnlfcHJvZHVjdGlvbiUyMiUyQyUyMllDQ29tcGFueV9CeV9MYXVuY2hfRGF0ZV9wcm9kdWN0aW9uJTIyJTVEJnRhZ0ZpbHRlcnM9JTVCJTIyeWNkY19wdWJsaWMlMjIlNUQmYW5hbHl0aWNzVGFncz0lNUIlMjJ5Y2RjJTIyJTVE",
  "Content-Type": "application/json",
};

// All YC batches with their expected company counts
function generateBatches(): string[] {
  return [
    "Fall 2025",
    "Summer 2025",
    "Spring 2025",
    "Winter 2025",
    "Fall 2024",
    "Summer 2024",
    "Winter 2024",
    "Summer 2023",
    "Winter 2023",
    "Summer 2022",
    "Winter 2022",
    "Summer 2021",
    "Winter 2021",
    "Summer 2020",
    "Winter 2020",
    "Summer 2019",
    "Winter 2019",
    "Summer 2018",
    "Winter 2018",
    "Summer 2017",
    "Winter 2017",
    "Summer 2016",
    "Winter 2016",
    "Summer 2015",
    "Winter 2015",
    "Summer 2014",
    "Winter 2014",
    "Summer 2013",
    "Winter 2013",
    "Summer 2012",
    "Winter 2012",
    "Summer 2011",
    "Winter 2011",
    "Summer 2010",
    "Winter 2010",
    "Summer 2009",
    "Winter 2009",
    "Summer 2008",
    "Winter 2008",
    "Summer 2007",
    "Winter 2007",
    "Summer 2006",
    "Winter 2006",
    "Summer 2005",
  ];
}

async function fetchBatch(batch: string): Promise<Company[]> {
  const payload = {
    requests: [
      {
        indexName: "YCCompany_production",
        params: `facetFilters=%5B%5B%22batch%3A${batch}%22%5D%5D&facets=%5B%22batch%22%2C%22industries%22%2C%22status%22%5D&hitsPerPage=1000&page=0&query=&tagFilters=`,
      },
    ],
  };

  try {
    const response = await fetch(ALGOLIA_ENDPOINT, {
      method: "POST",
      headers: ALGOLIA_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to fetch batch ${batch}: ${response.status}`);
      return [];
    }

    const data: AlgoliaResponse = await response.json();
    const companies = data.results[0]?.hits || [];

    console.log(`✓ Fetched batch ${batch}: ${companies.length} companies`);
    return companies;
  } catch (error) {
    console.error(`Error fetching batch ${batch}:`, error);
    return [];
  }
}

async function fetchAllCompanies() {
  console.log("🚀 Starting YC Graveyard data collection...\n");

  const batches = generateBatches();
  const allCompanies: Company[] = [];

  // Fetch batches in parallel but with some rate limiting
  const batchSize = 5;
  for (let i = 0; i < batches.length; i += batchSize) {
    const batchGroup = batches.slice(i, i + batchSize);
    const results = await Promise.all(batchGroup.map(fetchBatch));
    allCompanies.push(...results.flat());

    // Small delay to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Total companies fetched: ${allCompanies.length}`);

  // Filter for inactive companies
  const inactiveCompanies = allCompanies.filter(
    (company) => company.status && company.status === "Inactive",
  );

  console.log(`💀 Inactive companies: ${inactiveCompanies.length}`);

  // Calculate stats
  const batches_count = new Set(inactiveCompanies.map((c) => c.batch)).size;
  const industries_count = new Set(
    inactiveCompanies.flatMap((c) => c.industries || []),
  ).size;

  const stats = {
    total_inactive: inactiveCompanies.length,
    total_fetched: allCompanies.length,
    batches_count,
    industries_count,
    last_updated: new Date().toISOString(),
  };

  console.log(`📈 Batches represented: ${batches_count}`);
  console.log(`🏢 Industries represented: ${industries_count}`);

  // Save data
  const fs = await import("fs/promises");
  const path = await import("path");

  const dataDir = path.join(process.cwd(), "src", "data");
  await fs.mkdir(dataDir, { recursive: true });

  const companiesPath = path.join(dataDir, "companies.json");
  const statsPath = path.join(dataDir, "stats.json");

  await fs.writeFile(companiesPath, JSON.stringify(inactiveCompanies, null, 2));

  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));

  console.log(`\n✅ Data saved to:`);
  console.log(`   - ${companiesPath}`);
  console.log(`   - ${statsPath}`);
  console.log(`\n💀 The graveyard is ready.`);
}

// Run the script
fetchAllCompanies().catch(console.error);
