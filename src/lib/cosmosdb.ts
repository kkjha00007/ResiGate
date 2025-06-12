// IMPORTANT: This file must only be imported in API routes or server-side code.
// NEVER import this file in React components or any client-side code!

import { CosmosClient, ConsistencyLevel } from "@azure/cosmos";
import type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, ParkingSpot, SocietyInfoSettings, Facility, Society } from './types';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
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
export const societiesContainerId = process.env.COSMOS_SOCIETIES_CONTAINER_ID || "Societies";
export const personasContainerId = process.env.COSMOS_PERSONAS_CONTAINER_ID || "Personas";
const auditLogsContainerId = process.env.COSMOS_AUDIT_LOGS_CONTAINER_ID || "AuditLogs";
export const notificationsContainerId = process.env.COSMOS_NOTIFICATIONS_CONTAINER_ID || "Notifications";

function getCosmosClient() {
  if (!endpoint || !key) {
    throw new Error("Cosmos DB Endpoint or Key not configured in environment variables.");
  }
  return new CosmosClient({
    endpoint,
    key,
    consistencyLevel: ConsistencyLevel.Session,
  });
}

function getDatabase(client: CosmosClient) {
  return client.database(databaseId);
}

export function getSocietySettingsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(societySettingsContainerId);
}

export function getVisitorEntriesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(visitorEntriesContainerId);
}

export function getSocietiesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(societiesContainerId);
}

export function getSocietyInvitesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container('SocietyInvites');
}

export function getUsersContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(usersContainerId);
}

export function getGatePassesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(gatePassesContainerId);
}

export function getLoginAuditsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(loginAuditsContainerId);
}
export function getComplaintsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(complaintsContainerId);
}
export function getNoticesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(noticesContainerId);
}
export function getMeetingsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(meetingsContainerId);
}
export function getVendorsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(vendorsContainerId);
}
export function getCommitteeMembersContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(committeeMembersContainerId);
}
export function getParkingSpotsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(parkingSpotsContainerId);
}
export function getFacilitiesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(facilitiesContainerId);
}
export function getAuditLogsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(auditLogsContainerId);
}
export function getPersonasContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(personasContainerId);
}
export function getParkingRequestsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container('ParkingRequests');
}
export function getContactMessagesContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container('ContactMessages');
}
export function getNotificationsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container(notificationsContainerId);
}
export function getFeedbackTicketsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container("feedbackTickets");
}
export function getHelpDeskRequestsContainer() {
  const client = getCosmosClient();
  return getDatabase(client).container('HelpDeskRequests');
}

// Defensive getter for complaints container
export function safeGetComplaintsContainer() {
  try {
    return getComplaintsContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Complaints container:', e);
    return undefined;
  }
}
// Defensive getter for notices container
export function safeGetNoticesContainer() {
  try {
    return getNoticesContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Notices container:', e);
    return undefined;
  }
}
// Defensive getter for gate passes container
export function safeGetGatePassesContainer() {
  try {
    return getGatePassesContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get GatePasses container:', e);
    return undefined;
  }
}
// Defensive getter for visitor entries container
export function safeGetVisitorEntriesContainer() {
  try {
    return getVisitorEntriesContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get VisitorEntries container:', e);
    return undefined;
  }
}
// Defensive getter for vendors container
export function safeGetVendorsContainer() {
  try {
    return getVendorsContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Vendors container:', e);
    return undefined;
  }
}
// Defensive getter for committee members container
export function safeGetCommitteeMembersContainer() {
  try {
    return getCommitteeMembersContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get CommitteeMembers container:', e);
    return undefined;
  }
}
// Defensive getter for meetings container
export function safeGetMeetingsContainer() {
  try {
    return getMeetingsContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Meetings container:', e);
    return undefined;
  }
}
// Defensive getter for facilities container
export function safeGetFacilitiesContainer() {
  try {
    return getFacilitiesContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Facilities container:', e);
    return undefined;
  }
}
// Defensive getter for parking spots container
export function safeGetParkingSpotsContainer() {
  try {
    return getParkingSpotsContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get ParkingSpots container:', e);
    return undefined;
  }
}
// Defensive getter for societies container
export function safeGetSocietiesContainer() {
  try {
    return getSocietiesContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get Societies container:', e);
    return undefined;
  }
}
// Defensive getter for society settings container
export function safeGetSocietySettingsContainer() {
  try {
    return getSocietySettingsContainer();
  } catch (e) {
    console.error('CosmosDB: Failed to get SocietySettings container:', e);
    return undefined;
  }
}

// ...existing code for types and other exports...
export type { User, VisitorEntry, LoginAudit, GatePass, Complaint, Notice, Meeting, Vendor, CommitteeMember, SocietyPaymentDetails, SocietyInfoSettings, ParkingSpot, Facility, Society };

