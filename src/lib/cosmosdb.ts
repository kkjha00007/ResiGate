// IMPORTANT: Ensure you have @azure/cosmos package installed: npm install @azure/cosmos

import { CosmosClient, ConsistencyLevel } from "@azure/cosmos";
import type { User, VisitorEntry } from './types'; // Assuming your types are here

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: Cosmos DB Endpoint or Key not configured in environment variables for production.");
    // In a real app, you might want to throw an error or have a more graceful shutdown.
    // For now, we'll let it attempt to connect which will fail.
  } else {
     console.warn("Cosmos DB Endpoint or Key not found in .env file. Database operations will fail. Please create a .env file with COSMOS_ENDPOINT and COSMOS_KEY.");
  }
}

// Use default values or environment variables for database and container IDs
export const databaseId = process.env.COSMOS_DATABASE_ID || "ResiGateDB";
export const usersContainerId = process.env.COSMOS_USERS_CONTAINER_ID || "Users";
export const visitorEntriesContainerId = process.env.COSMOS_VISITORS_CONTAINER_ID || "VisitorEntries";


// Initialize CosmosClient with a placeholder if credentials are not set for local dev,
// but this will cause errors if actual DB operations are attempted.
// In production, this should ideally throw or be handled if credentials aren't there.
export const client = new CosmosClient({
  endpoint: endpoint || "https://placeholder.documents.azure.com", // Placeholder
  key: key || "placeholderkey", // Placeholder
  consistencyLevel: ConsistencyLevel.Session, // Session consistency is a good default
});

export const database = client.database(databaseId);
export const usersContainer = database.container(usersContainerId);
export const visitorEntriesContainer = database.container(visitorEntriesContainerId);

/**
 * Ensures the database and containers exist, creating them if necessary.
 * Call this function once during application startup (e.g., in a global setup or before first DB call).
 */
export async function initializeCosmosDB() {
  if (!endpoint || !key) {
    console.warn("Skipping Cosmos DB initialization as endpoint or key is not configured.");
    return;
  }
  try {
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database '${db.id}' ensured.`);

    const { container: usersCont } = await db.containers.createIfNotExists({
      id: usersContainerId,
      partitionKey: { paths: ["/role"] }, // Example: Partition users by role, or /id if unique users are few
                                          // Consider /email if that's a common query filter.
                                          // For small scale, /id or a static value like /pk is fine.
    });
    console.log(`Container '${usersCont.id}' ensured.`);

    const { container: visitorsCont } = await db.containers.createIfNotExists({
      id: visitorEntriesContainerId,
      partitionKey: { paths: ["/flatNumber"] }, // Partitioning by flatNumber is good for querying visits to a specific flat.
                                                // Or /id for individual entries.
    });
    console.log(`Container '${visitorsCont.id}' ensured.`);
  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
    // Handle initialization error appropriately
  }
}

// Example: Call initializeCosmosDB when this module is first imported in a server context,
// or call it explicitly from your main server setup file.
// For Next.js API routes, this might be called at the start of relevant route handlers if not globally.
// Avoid calling it on every request.
// A simple way for now is to call it and let it run once.
if (process.env.NODE_ENV !== 'test') { // Avoid running during tests if not needed
    initializeCosmosDB().catch(console.error);
}

// Re-export types if they are used by API consumers directly from here (optional)
export type { User, VisitorEntry };
