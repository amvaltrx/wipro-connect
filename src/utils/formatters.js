/**
 * Helper utilities for formatting phone numbers, JIDs, and timestamps
 */

export function cleanPhoneNumber(raw) {
  if (!raw) return '';
  // strip spaces, dashes, parentheses and leading plus
  return raw.replace(/[\s\-\(\)\+]/g, '');
}

export function toWhatsAppJid(target) {
  if (!target) return null;
  const trimmed = target.trim();

  // Already a full WhatsApp JID (e.g. 12345@s.whatsapp.net or group @g.us)
  if (trimmed.endsWith('@s.whatsapp.net') || trimmed.endsWith('@g.us')) {
    return trimmed;
  }

  const clean = cleanPhoneNumber(trimmed);
  return `${clean}@s.whatsapp.net`;
}

export function formatUptime(startTime) {
  if (!startTime) return '0m';
  const diffSec = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function maskPhoneNumber(phone) {
  if (!phone) return 'Unknown';
  const clean = cleanPhoneNumber(phone);
  if (clean.length < 6) return clean;
  // Show first 2 digits and last 4 digits
  return `+${clean.slice(0, 2)} •••••• ${clean.slice(-4)}`;
}
