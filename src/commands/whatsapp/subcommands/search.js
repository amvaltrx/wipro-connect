import { handleContacts } from './contacts.js';

export async function handleSearch(interaction) {
  // Alias query into contacts lookup
  return handleContacts(interaction);
}
