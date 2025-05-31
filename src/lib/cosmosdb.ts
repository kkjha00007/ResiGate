import { CosmosClient, ConsistencyLevel } from "@azure/cosmos";
import type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, ParkingSpot, SocietyInfoSettings, Facility, Society } from './types';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: Cosmos DB Endpoint or Key not configured in environment variables for production.");
    // Potentially throw an error here to halt server startup in production
    // throw new Error("Cosmos DB Endpoint or Key not configured.");
  } else {
     console.warn("Cosmos DB Endpoint or Key not found in .env file. Database operations will fail. Please create a .env file with COSMOS_ENDPOINT and COSMOS_KEY.");
  }
}

export const databaseId = process.env.COSMOS_DATABASE_ID || "ResiGateDB";

// Existing Container IDs
export const usersContainerId = process.env.COSMOS_USERS_CONTAINER_ID || "Users";
export const visitorEntriesContainerId = process.env.COSMOS_VISITORS_CONTAINER_ID || "VisitorEntries";
export const loginAuditsContainerId = process.env.COSMOS_LOGIN_AUDITS_CONTAINER_ID || "LoginAudits";
export const gatePassesContainerId = process.env.COSMOS_GATE_PASSES_CONTAINER_ID || "GatePasses";
export const complaintsContainerId = process.env.COSMOS_COMPLAINTS_CONTAINER_ID || "Complaints";
export const noticesContainerId = process.env.COSMOS_NOTICES_CONTAINER_ID || "Notices";
export const meetingsContainerId = process.env.COSMOS_MEETINGS_CONTAINER_ID || "Meetings";
export const vendorsContainerId = process.env.COSMOS_VENDORS_CONTAINER_ID || "Vendors";
export const committeeMembersContainerId = process.env.COSMOS_COMMITTEE_MEMBERS_CONTAINER_ID || "CommitteeMembers";
export const societySettingsContainerId = process.env.COSMOS_SOCIETY_SETTINGS_CONTAINER_ID || "SocietySettings";
export const parkingSpotsContainerId = process.env.COSMOS_PARKING_SPOTS_CONTAINER_ID || "ParkingSpots";
export const facilitiesContainerId = process.env.COSMOS_FACILITIES_CONTAINER_ID || "Facilities";

// New Container ID for Societies
export const societiesContainerId = process.env.COSMOS_SOCIETIES_CONTAINER_ID || "Societies";
export const personasContainerId = process.env.COSMOS_PERSONAS_CONTAINER_ID || "Personas";

// --- Audit Logs Container Setup ---
const auditLogsContainerId = process.env.COSMOS_AUDIT_LOGS_CONTAINER_ID || "AuditLogs";


export const client = new CosmosClient({
  endpoint: endpoint || "https://placeholder.documents.azure.com", // Fallback for environments where vars might not be loaded (e.g. client-side, though this module is server-side)
  key: key || "placeholderkey", // Fallback
  consistencyLevel: ConsistencyLevel.Session, // Default consistency level
});

export const database = client.database(databaseId);

// --- Users Container: Ensure it exists and is ready before export ---
let usersContainerInstance: ReturnType<typeof database.container> | undefined;
export let usersContainerReady: Promise<void>;

// Refactored: All container creation is handled by initializeCosmosDB
// usersContainerReady now depends on initializeCosmosDB
usersContainerReady = (async () => {
  await initializeCosmosDB();
  usersContainerInstance = database.container(usersContainerId);
})();

export const getUsersContainer = async () => {
  try {
    await usersContainerReady;
    if (!usersContainerInstance) throw new Error('Users container not initialized');
    return usersContainerInstance;
  } catch (err) {
    console.error('[CosmosDB] getUsersContainer error:', err);
    throw err;
  }
};

export const visitorEntriesContainer = database.container(visitorEntriesContainerId);
export const loginAuditsContainer = database.container(loginAuditsContainerId);
export const gatePassesContainer = database.container(gatePassesContainerId);
export const complaintsContainer = database.container(complaintsContainerId);
export const noticesContainer = database.container(noticesContainerId);
export const meetingsContainer = database.container(meetingsContainerId);
export const vendorsContainer = database.container(vendorsContainerId);
export const committeeMembersContainer = database.container(committeeMembersContainerId);
export const societySettingsContainer = database.container(societySettingsContainerId);
export const parkingSpotsContainer = database.container(parkingSpotsContainerId);
export const facilitiesContainer = database.container(facilitiesContainerId);
export const societiesContainer = database.container(societiesContainerId);
export const personasContainer = database.container(personasContainerId);
export const parkingRequestsContainer = database.container('ParkingRequests');

export const auditLogsContainer = database.container(auditLogsContainerId);

async function ensureAuditLogsContainerExists() {
  const database = client.database(databaseId);
  const { resources: containers } = await database.containers.readAll().fetchAll();
  const exists = containers.some((c: any) => c.id === auditLogsContainerId);
  if (!exists) {
    await database.containers.createIfNotExists({
      id: auditLogsContainerId,
      partitionKey: "/societyId",
    });
  }
}

// Call this on app/server startup or first login
ensureAuditLogsContainerExists().catch(console.error);

export async function initializeCosmosDB() {
  if (!endpoint || !key) {
    console.warn("Skipping Cosmos DB initialization as endpoint or key is not configured.");
    return;
  }
  try {
    console.log(`Ensuring database '${databaseId}' exists...`);
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database '${db.id}' ensured.`);

    // WARNING: Modifying partition keys on existing containers is a destructive operation.
    // The SDK's createIfNotExists might not recreate if only partition key changes.
    // For development, explicitly deleting and recreating might be needed if partition keys change.
    // For production, a proper data migration strategy is required.
    
    // For this iteration, we will only ADD the new 'Societies' container.
    // Existing container definitions are kept for reference but their partition keys
    // will be updated in subsequent batches.
    
    const containerDefinitions = [
      // All containers now use '/societyId' as partition key for strict society isolation
      { id: usersContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: visitorEntriesContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: loginAuditsContainerId, partitionKey: { paths: ['/societyId'] }, defaultTtl: 30 * 24 * 60 * 60 },
      { id: gatePassesContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: complaintsContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: noticesContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: meetingsContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: vendorsContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: committeeMembersContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: societySettingsContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: parkingSpotsContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: facilitiesContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: personasContainerId, partitionKey: { paths: ['/societyId'] } },
      { id: 'ParkingRequests', partitionKey: { paths: ['/societyId'] } },
      // Societies container uses '/id' as partition key (each society is a root doc)
      { id: societiesContainerId, partitionKey: { paths: ['/id'] } },
    ];

    for (const containerDef of containerDefinitions) {
      // Always ensure Personas and Societies containers exist
      if (containerDef.id === societiesContainerId || containerDef.id === personasContainerId) {
        try {
          console.log(`Ensuring container '${containerDef.id}' exists...`);
          const { container } = await db.containers.createIfNotExists(containerDef);
          console.log(`Container '${container.id}' ensured.${containerDef.defaultTtl ? ` TTL: ${containerDef.defaultTtl}s` : ''}`);
        } catch (error: any) {
          console.error(`Failed to ensure container '${containerDef.id}':`, error.message || error);
        }
      }
    }

  } catch (error: any) {
    console.error("Error initializing Cosmos DB:", error.message || error);
  }
}

// Initialize DB on server start (for environments like Next.js server components/API routes)
// Ensure this runs only once, typically at module load for server-side contexts.
if (process.env.NODE_ENV !== 'test') { // Avoid running during test suites if they mock DB
    initializeCosmosDB().catch(console.error);
}

export type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, SocietyInfoSettings, ParkingSpot, Facility, Society };

