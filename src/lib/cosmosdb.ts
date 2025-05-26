
import { CosmosClient, ConsistencyLevel } from "@azure/cosmos";
import type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, ParkingSpot, SocietyInfoSettings, Facility } from './types';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  if (process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: Cosmos DB Endpoint or Key not configured in environment variables for production.");
  } else {
     console.warn("Cosmos DB Endpoint or Key not found in .env file. Database operations will fail. Please create a .env file with COSMOS_ENDPOINT and COSMOS_KEY.");
  }
}

export const databaseId = process.env.COSMOS_DATABASE_ID || "ResiGateDB";
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


export const client = new CosmosClient({
  endpoint: endpoint || "https://placeholder.documents.azure.com",
  key: key || "placeholderkey",
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
export const vendorsContainer = database.container(vendorsContainerId);
export const committeeMembersContainer = database.container(committeeMembersContainerId);
export const societySettingsContainer = database.container(societySettingsContainerId);
export const parkingSpotsContainer = database.container(parkingSpotsContainerId);
export const facilitiesContainer = database.container(facilitiesContainerId);


export async function initializeCosmosDB() {
  if (!endpoint || !key) {
    console.warn("Skipping Cosmos DB initialization as endpoint or key is not configured.");
    return;
  }
  try {
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database '${db.id}' ensured.`);

    const containerDefinitions = [
      { id: usersContainerId, partitionKey: { paths: ["/role"] } },
      { id: visitorEntriesContainerId, partitionKey: { paths: ["/flatNumber"] } },
      { id: loginAuditsContainerId, partitionKey: { paths: ["/userId"] }, defaultTtl: 30 * 24 * 60 * 60 }, // 30 days TTL
      { id: gatePassesContainerId, partitionKey: { paths: ["/residentUserId"] } },
      { id: complaintsContainerId, partitionKey: { paths: ["/userId"] } },
      { id: noticesContainerId, partitionKey: { paths: ["/monthYear"] } },
      { id: meetingsContainerId, partitionKey: { paths: ["/monthYear"] } },
      { id: vendorsContainerId, partitionKey: { paths: ["/category"] } },
      { id: committeeMembersContainerId, partitionKey: { paths: ["/id"] } }, 
      { id: societySettingsContainerId, partitionKey: { paths: ["/id"] } },
      { id: parkingSpotsContainerId, partitionKey: { paths: ["/id"] } },
      { id: facilitiesContainerId, partitionKey: { paths: ["/id"] } },
    ];

    for (const containerDef of containerDefinitions) {
      const { container } = await db.containers.createIfNotExists(containerDef);
      console.log(`Container '${container.id}' ensured.${containerDef.defaultTtl ? ` TTL: ${containerDef.defaultTtl}s` : ''}`);
    }

  } catch (error) {
    console.error("Error initializing Cosmos DB:", error);
  }
}

if (process.env.NODE_ENV !== 'test') {
    initializeCosmosDB().catch(console.error);
}

export type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, SocietyInfoSettings, ParkingSpot, Facility };
