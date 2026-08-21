#!/usr/bin/env node
const path = require("path");
const { seedDemo, waitForGateway, DEMO_ACCOUNTS } = require("./seed");

const ROOT = path.resolve(__dirname, "../..");

try {
  require(path.join(ROOT, "services", "auth-service", "node_modules", "dotenv")).config({
    path: path.join(ROOT, ".env"),
  });
} catch {
  // dotenv is optional when GATEWAY_URL and MONGODB_URI are already set.
}

async function main() {
  const gatewayUrl = (process.env.GATEWAY_URL || "http://localhost:8080").replace(/\/$/, "");
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/foodloop";

  process.stdout.write(`Waiting for API gateway at ${gatewayUrl}/health …\n`);
  await waitForGateway(gatewayUrl);
  process.stdout.write("Seeding deterministic hackathon demo data…\n");

  const result = await seedDemo({ gatewayUrl, mongoUri, resetListings: true, createListing: true });

  process.stdout.write(`
FoodLoop demo seed complete. Gateway: ${gatewayUrl}

Provider     ${DEMO_ACCOUNTS.provider.email}  /  ${DEMO_ACCOUNTS.provider.password}
Organization ${DEMO_ACCOUNTS.organization.email}     /  ${DEMO_ACCOUNTS.organization.password}
Admin        ${DEMO_ACCOUNTS.admin.email}           /  ${DEMO_ACCOUNTS.admin.password}

Claim this listing: ${result.listing.foodName} (${result.listing.status})
  id=${result.listing.id}
Matching agent listing: ${result.agentListing.foodName} (${result.agentListing.status})
  id=${result.agentListing.id}

Walk the steps in docs/DEMO.md. Re-run this script to reset listings and re-seed.
`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
