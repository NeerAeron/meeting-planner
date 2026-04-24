// Discord caps customIds at 100 chars. ':' is the delimiter because UUIDs use
// hyphens, so session IDs parse cleanly no matter what.
const DELIM = ':';
const MAX_LEN = 100;

export function makeCustomId(...parts: string[]): string {
    const id = parts.join(DELIM);
    if (id.length > MAX_LEN) {
        throw new Error(`customId exceeds Discord's ${MAX_LEN} char limit: ${id}`);
    }
    return id;
}

export function parseCustomId(customId: string): { action: string; args: string[] } {
    const [action, ...args] = customId.split(DELIM);
    return { action, args };
}