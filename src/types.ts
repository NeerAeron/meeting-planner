export const MAX_TIMES = 3;

export type SessionStatus = 'setup' | 'sent' | 'picking_tz' | 'completed';

export interface Slot {
    date: string;  // 'yyyy-MM-dd' in sender's local day
    time: string;  // 'HH:MM' 24h
}

export const compareSlot = (a: Slot, b: Slot): number =>
    a.date.localeCompare(b.date) || a.time.localeCompare(b.time);

export interface MeetingSession {
    id: string;
    senderId: string;
    targetUserId: string;
    senderTz: string;
    receiverTz: string;
    anchorDate?: string;   // the day the hour picker is currently showing
    proposals: Slot[];     // up to MAX_TIMES, any mix of days
    status: SessionStatus;
    createdAt: number;
    updatedAt: number;
}