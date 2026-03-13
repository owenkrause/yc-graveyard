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
    "NzllNTY5MzJiZGM2OTY2ZTQwMDEzOTNhYWZiZGRjODlhYzVkNjBmOGRjNzJiMWM4ZTU0ZDlhYTZjOTJiMjlhMWFuYWx5dGljc1RhZ3M9eWNkYyZyZXN0cmljdEluZGljZXM9WUNDb21wYW55X3Byb2R1Y3Rpb24lMkNZQ0NvbXBhbnlfQnlfTGF1bmNoX0RhdGVfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVE",
  "Content-Type": "application/json",
};

// Auto-generate all YC batches from Summer 2005 to the current year
function generateBatches(): string[] {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];
  const startYear = 2005;
  const currentYear = new Date().getFullYear();
  const batches: string[] = [];

  for (let year = currentYear; year >= startYear; year--) {
    for (let i = seasons.length - 1; i >= 0; i--) {
      batches.push(`${seasons[i]} ${year}`);
    }
  }

  return batches;
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
