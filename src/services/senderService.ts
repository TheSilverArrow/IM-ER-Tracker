const BLOCKED_SENDERS_KEY = 'blocked_clinical_senders_v1';

const defaultBlockedSenders = ['Intern', 'Dr. Intern', 'Medical Student'];

export function getBlockedSenders(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_SENDERS_KEY);
    if (!raw) {
      localStorage.setItem(BLOCKED_SENDERS_KEY, JSON.stringify(defaultBlockedSenders));
      return defaultBlockedSenders;
    }
    return JSON.parse(raw);
  } catch {
    return defaultBlockedSenders;
  }
}

export function saveBlockedSenders(senders: string[]): void {
  try {
    // Unique & clean values
    const clean = Array.from(new Set(senders.map((s) => s.trim()).filter((s) => s.length > 0)));
    localStorage.setItem(BLOCKED_SENDERS_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error saving blocked senders:', e);
  }
}

export function isSenderBlocked(senderName: string, blockedList?: string[]): boolean {
  if (!senderName) return false;
  const list = blockedList || getBlockedSenders();
  const lowerSender = senderName.toLowerCase().trim();

  return list.some((blocked) => {
    const lowerBlocked = blocked.toLowerCase().trim();
    if (!lowerBlocked) return false;
    return lowerSender.includes(lowerBlocked) || lowerBlocked.includes(lowerSender);
  });
}
