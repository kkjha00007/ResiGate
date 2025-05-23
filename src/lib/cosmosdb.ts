
// IMPORTANT: Ensure you have @azure/cosmos package installed: npm install @azure/cosmos

import { CosmosClient, ConsistencyLevel } from "@azure/cosmos";
import type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor } from './types'; // Added Meeting, Vendor

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: Cosmos DB Endpoint or Key not configured in environment variables for production.");
    // In a real app, you might want to throw an error or have a more graceful shutdown.
  } else {
     console.warn("Cosmos DB Endpoint or Key not found in .env file. Database operations will fail. Please create a .env file with COSMOS_ENDPOINT and COSMOS_KEY.");
  }
}

// Use default values or environment variables for database and container IDs
export const databaseId = process.env.COSMOS_DATABASE_ID || "ResiGateDB";
export const usersContainerId = process.env.COSMOS_USERS_CONTAINER_ID || "Users";
export const visitorEntriesContainerId = process.env.COSMOS_VISITORS_CONTAINER_ID || "VisitorEntries";
export const loginAuditsContainerId = process.env.COSMOS_LOGIN_AUDITS_CONTAINER_ID || "LoginAudits";
export const gatePassesContainerId = process.env.COSMOS_GATE_PASSES_CONTAINER_ID || "GatePasses";
export const complaintsContainerId = process.env.COSMOS_COMPLAINTS_CONTAINER_ID || "Complaints";
export const noticesContainerId = process.env.COSMOS_NOTICES_CONTAINER_ID || "Notices";
export const meetingsContainerId = process.env.COSMOS_MEETINGS_CONTAINER_ID || "Meetings";
export const vendorsContainerId = process.env.COSMOS_VENDORS_CONTAINER_ID || "Vendors"; // New container ID


// Initialize CosmosClient with a placeholder if credentials are not set for local dev,
// but this will cause errors if actual DB operations are attempted.
export const client = new CosmosClient({
  endpoint: endpoint || "https://placeholder.documents.azure.com", // Placeholder
  key: key || "placeholderkey", // Placeholder
  consistencyLevel: ConsistencyLevel.Session, 
});

export const database = client.database(databaseId);
export const usersContainer = database.container(usersContainerId);
export const visitorEntriesContainer = database.container(visitorEntriesContainerId);
export const loginAuditsContainer = database.container(loginAuditsContainerId);
export const gatePassesContainer = database.container(gatePassesContainerId);
export const complaintsContainer = database.container(complaintsContainerId);
export const noticesContainer = database.container(noticesContainerId);
export const meetingsContainer = database.container(meetingsContainerId);
export const vendorsContainer = database.container(vendorsContainerId); // New container instance

/**
 * Ensures the database and containers exist, creating them if necessary.
 * Call this function once during application startup.
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
      partitionKey: { paths: ["/role"] }, 
    });
    console.log(`Container '${usersCont.id}' ensured.`);

    const { container: visitorsCont } = await db.containers.createIfNotExists({
      id: visitorEntriesContainerId,
      partitionKey: { paths: ["/flatNumber"] }, 
    });
    console.log(`Container '${visitorsCont.id}' ensured.`);

    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const { container: auditsCont } = await db.containers.createIfNotExists({
      id: loginAuditsContainerId,
      partitionKey: { paths: ["/userId"] }, 
      defaultTtl: thirtyDaysInSeconds, 
    });
    console.log(`Container '${auditsCont.id}' ensured with default TTL of ${thirtyDaysInSeconds} seconds.`);

    const { container: gatePassesCont } = await db.containers.createIfNotExists({
      id: gatePassesContainerId,
      partitionKey: { paths: ["/residentUserId"] },
    });
    console.log(`Container '${gatePassesCont.id}' ensured.`);

    const { container: complaintsCont } = await db.containers.createIfNotExists({
      id: complaintsContainerId,
      partitionKey: { paths: ["/userId"] }, 
    });
    console.log(`Container '${complaintsCont.id}' ensured.`);

    const { container: noticesCont } = await db.containers.createIfNotExists({
      id: noticesContainerId,
      partitionKey: { paths: ["/monthYear"] }, 
    });
    console.log(`Container '${noticesCont.id}' ensured.`);

    const { container: meetingsCont } = await db.containers.createIfNotExists({
      id: meetingsContainerId,
      partitionKey: { paths: ["/monthYear"] }, // Partition by month/year of meeting
    });
    console.log(`Container '${meetingsCont.id}' ensured.`);

    const { container: vendorsCont } = await db.containers.createIfNotExists({
      id: vendorsContainerId,
      partitionKey: { paths: ["/category"] }, // Partition by vendor category
    });
    console.log(`Container '${vendorsCont.id}' ensured.`);


  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
  }
}

if (process.env.NODE_ENV !== 'test') { 
    initializeCosmosDB().catch(console.error);
}

export type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor };
