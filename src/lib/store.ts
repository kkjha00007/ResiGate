import type { User, VisitorEntry } from './types';
import { LOCAL_STORAGE_KEYS } from './constants';
import { MOCK_USERS, MOCK_VISITOR_ENTRIES } from './mock-data';

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

// Initialize with mock data if localStorage is empty
export function initializeStores(): void {
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.USERS)) {
      setItem<User[]>(LOCAL_STORAGE_KEYS.USERS, MOCK_USERS);
    }
    if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.VISITORS)) {
      setItem<VisitorEntry[]>(LOCAL_STORAGE_KEYS.VISITORS, MOCK_VISITOR_ENTRIES);
    }
  }
}

// User functions
export const getUsers = (): User[] => getItem<User[]>(LOCAL_STORAGE_KEYS.USERS, []);
export const setUsers = (users: User[]): void => setItem<User[]>(LOCAL_STORAGE_KEYS.USERS, users);
export const addUser = (user: User): void => {
  const users = getUsers();
  setUsers([...users, user]);
};
export const updateUser = (updatedUser: User): void => {
  const users = getUsers();
  setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
};

// Visitor functions
export const getVisitorEntries = (): VisitorEntry[] => getItem<VisitorEntry[]>(LOCAL_STORAGE_KEYS.VISITORS, []);
export const setVisitorEntries = (entries: VisitorEntry[]): void => setItem<VisitorEntry[]>(LOCAL_STORAGE_KEYS.VISITORS, entries);
export const addVisitorEntry = (entry: VisitorEntry): void => {
  const entries = getVisitorEntries();
  setVisitorEntries([entry, ...entries]); // Add new entries to the top
};

// Logged-in user
export const getLoggedInUser = (): User | null => getItem<User | null>(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, null);
export const setLoggedInUser = (user: User | null): void => setItem<User | null>(LOCAL_STORAGE_KEYS.LOGGED_IN_USER, user);

// Call initialize on load (e.g., in AuthProvider)
// initializeStores(); // This should be called client-side, e.g. in a useEffect in AuthProvider
