import { randomUUID } from 'node:crypto';
import { MeetingSession } from '../types';

// 24h TTL — covers the setup flow plus a generous window for the target
// to respond. In-memory only: a restart drops pending proposals. For
// multi-process, swap the internals for Redis; the interface stays.
const TTL_MS = 24 * 60 * 60 * 1000;
const SWEEP_MS = 5 * 60 * 1000;

type Init = Pick<MeetingSession, 'senderId' | 'targetUserId' | 'senderTz' | 'receiverTz'>;

class SessionStore {
    private store = new Map<string, MeetingSession>();

    constructor() {
        setInterval(() => this.sweep(), SWEEP_MS).unref();
    }

    create(init: Init): MeetingSession {
        const now = Date.now();
        const session: MeetingSession = {
            ...init,
            id: randomUUID(),
            proposals: [],
            status: 'setup',
            createdAt: now,
            updatedAt: now,
        };
        this.store.set(session.id, session);
        return session;
    }

    get(id: string): MeetingSession | undefined {
        const s = this.store.get(id);
        if (!s) return undefined;
        if (Date.now() - s.createdAt > TTL_MS) {
            this.store.delete(id);
            return undefined;
        }
        return s;
    }

    update(id: string, patch: Partial<MeetingSession>): MeetingSession | undefined {
        const s = this.get(id);
        if (!s) return undefined;
        Object.assign(s, patch, { updatedAt: Date.now() });
        return s;
    }

    delete(id: string): void {
        this.store.delete(id);
    }

    private sweep(): void {
        const cutoff = Date.now() - TTL_MS;
        for (const [id, s] of this.store) {
            if (s.createdAt < cutoff) this.store.delete(id);
        }
    }
}

export const sessions = new SessionStore();