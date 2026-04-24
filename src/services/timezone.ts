import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export interface City {
    city: string;
    tz: string;
}

// One canonical entry per major timezone, ordered so the first 25 cover every
// inhabited region — lets us reuse this list for the in-message timezone picker
// (Discord's select menus cap at 25 options).
export const CITIES: City[] = [
    { city: 'Los Angeles, USA', tz: 'America/Los_Angeles' },
    { city: 'Denver, USA', tz: 'America/Denver' },
    { city: 'Chicago, USA', tz: 'America/Chicago' },
    { city: 'New York, USA', tz: 'America/New_York' },
    { city: 'Halifax, Canada', tz: 'America/Halifax' },
    { city: 'Mexico City, Mexico', tz: 'America/Mexico_City' },
    { city: 'São Paulo, Brazil', tz: 'America/Sao_Paulo' },
    { city: 'Buenos Aires, Argentina', tz: 'America/Argentina/Buenos_Aires' },
    { city: 'London, UK', tz: 'Europe/London' },
    { city: 'Paris, France', tz: 'Europe/Paris' },
    { city: 'Johannesburg, South Africa', tz: 'Africa/Johannesburg' },
    { city: 'Athens, Greece', tz: 'Europe/Athens' },
    { city: 'Moscow, Russia', tz: 'Europe/Moscow' },
    { city: 'Dubai, UAE', tz: 'Asia/Dubai' },
    { city: 'Karachi, Pakistan', tz: 'Asia/Karachi' },
    { city: 'Mumbai, India', tz: 'Asia/Kolkata' },
    { city: 'Dhaka, Bangladesh', tz: 'Asia/Dhaka' },
    { city: 'Bangkok, Thailand', tz: 'Asia/Bangkok' },
    { city: 'Singapore', tz: 'Asia/Singapore' },
    { city: 'Tokyo, Japan', tz: 'Asia/Tokyo' },
    { city: 'Adelaide, Australia', tz: 'Australia/Adelaide' },
    { city: 'Sydney, Australia', tz: 'Australia/Sydney' },
    { city: 'Auckland, New Zealand', tz: 'Pacific/Auckland' },
    { city: 'Honolulu, USA', tz: 'Pacific/Honolulu' },
    { city: 'Anchorage, USA', tz: 'America/Anchorage' },
    
    // Aliases past the 25 cap — reachable via autocomplete substring match only.
    // --- North America ---
    { city: 'San Francisco, USA', tz: 'America/Los_Angeles' },
    { city: 'Seattle, USA', tz: 'America/Los_Angeles' },
    { city: 'Portland, USA', tz: 'America/Los_Angeles' },
    { city: 'Las Vegas, USA', tz: 'America/Los_Angeles' },
    { city: 'San Diego, USA', tz: 'America/Los_Angeles' },
    { city: 'Phoenix, USA', tz: 'America/Phoenix' },
    { city: 'Salt Lake City, USA', tz: 'America/Denver' },
    { city: 'Austin, USA', tz: 'America/Chicago' },
    { city: 'Dallas, USA', tz: 'America/Chicago' },
    { city: 'Houston, USA', tz: 'America/Chicago' },
    { city: 'Atlanta, USA', tz: 'America/New_York' },
    { city: 'Miami, USA', tz: 'America/New_York' },
    { city: 'Boston, USA', tz: 'America/New_York' },
    { city: 'Washington, D.C., USA', tz: 'America/New_York' },
    { city: 'Philadelphia, USA', tz: 'America/New_York' },
    { city: 'Detroit, USA', tz: 'America/Detroit' },
    { city: 'Vancouver, Canada', tz: 'America/Vancouver' },
    { city: 'Calgary, Canada', tz: 'America/Edmonton' },
    { city: 'Edmonton, Canada', tz: 'America/Edmonton' },
    { city: 'Winnipeg, Canada', tz: 'America/Winnipeg' },
    { city: 'Toronto, Canada', tz: 'America/Toronto' },
    { city: 'Montreal, Canada', tz: 'America/Toronto' },
    { city: 'Ottawa, Canada', tz: 'America/Toronto' },
    { city: 'St. John\'s, Canada', tz: 'America/St_Johns' },
    { city: 'Monterrey, Mexico', tz: 'America/Monterrey' },
    { city: 'Guadalajara, Mexico', tz: 'America/Mexico_City' },
    { city: 'Cancun, Mexico', tz: 'America/Cancun' },
    { city: 'Tijuana, Mexico', tz: 'America/Tijuana' },
    { city: 'San Juan, Puerto Rico', tz: 'America/Puerto_Rico' },

    // --- United States: Extras ---

    // --- South & Central America ---
    { city: 'Bogota, Colombia', tz: 'America/Bogota' },
    { city: 'Lima, Peru', tz: 'America/Lima' },
    { city: 'Quito, Ecuador', tz: 'America/Guayaquil' },
    { city: 'Caracas, Venezuela', tz: 'America/Caracas' },
    { city: 'Santiago, Chile', tz: 'America/Santiago' },
    { city: 'La Paz, Bolivia', tz: 'America/La_Paz' },
    { city: 'Asuncion, Paraguay', tz: 'America/Asuncion' },
    { city: 'Montevideo, Uruguay', tz: 'America/Montevideo' },
    { city: 'Rio de Janeiro, Brazil', tz: 'America/Sao_Paulo' },
    { city: 'Brasilia, Brazil', tz: 'America/Sao_Paulo' },
    { city: 'Manaus, Brazil', tz: 'America/Manaus' },
    { city: 'Guatemala City, Guatemala', tz: 'America/Guatemala' },
    { city: 'San Jose, Costa Rica', tz: 'America/Costa_Rica' },
    { city: 'Panama City, Panama', tz: 'America/Panama' },
    { city: 'Havana, Cuba', tz: 'America/Havana' },
    { city: 'Santo Domingo, Dominican Republic', tz: 'America/Santo_Domingo' },

    // --- Europe ---
    { city: 'Berlin, Germany', tz: 'Europe/Berlin' },
    { city: 'Munich, Germany', tz: 'Europe/Berlin' },
    { city: 'Frankfurt, Germany', tz: 'Europe/Berlin' },
    { city: 'Rome, Italy', tz: 'Europe/Rome' },
    { city: 'Milan, Italy', tz: 'Europe/Rome' },
    { city: 'Madrid, Spain', tz: 'Europe/Madrid' },
    { city: 'Barcelona, Spain', tz: 'Europe/Madrid' },
    { city: 'Amsterdam, Netherlands', tz: 'Europe/Amsterdam' },
    { city: 'Brussels, Belgium', tz: 'Europe/Brussels' },
    { city: 'Vienna, Austria', tz: 'Europe/Vienna' },
    { city: 'Zurich, Switzerland', tz: 'Europe/Zurich' },
    { city: 'Geneva, Switzerland', tz: 'Europe/Zurich' },
    { city: 'Stockholm, Sweden', tz: 'Europe/Stockholm' },
    { city: 'Oslo, Norway', tz: 'Europe/Oslo' },
    { city: 'Copenhagen, Denmark', tz: 'Europe/Copenhagen' },
    { city: 'Helsinki, Finland', tz: 'Europe/Helsinki' },
    { city: 'Dublin, Ireland', tz: 'Europe/Dublin' },
    { city: 'Edinburgh, UK', tz: 'Europe/London' },
    { city: 'Lisbon, Portugal', tz: 'Europe/Lisbon' },
    { city: 'Warsaw, Poland', tz: 'Europe/Warsaw' },
    { city: 'Prague, Czechia', tz: 'Europe/Prague' },
    { city: 'Budapest, Hungary', tz: 'Europe/Budapest' },
    { city: 'Bucharest, Romania', tz: 'Europe/Bucharest' },
    { city: 'Kyiv, Ukraine', tz: 'Europe/Kyiv' },
    { city: 'Istanbul, Turkey', tz: 'Europe/Istanbul' },

    // --- Middle East & Africa ---
    { city: 'Riyadh, Saudi Arabia', tz: 'Asia/Riyadh' },
    { city: 'Jeddah, Saudi Arabia', tz: 'Asia/Riyadh' },
    { city: 'Abu Dhabi, UAE', tz: 'Asia/Dubai' },
    { city: 'Doha, Qatar', tz: 'Asia/Qatar' },
    { city: 'Kuwait City, Kuwait', tz: 'Asia/Kuwait' },
    { city: 'Jerusalem, Israel', tz: 'Asia/Jerusalem' },
    { city: 'Tel Aviv, Israel', tz: 'Asia/Jerusalem' },
    { city: 'Amman, Jordan', tz: 'Asia/Amman' },
    { city: 'Beirut, Lebanon', tz: 'Asia/Beirut' },
    { city: 'Cairo, Egypt', tz: 'Africa/Cairo' },
    { city: 'Lagos, Nigeria', tz: 'Africa/Lagos' },
    { city: 'Nairobi, Kenya', tz: 'Africa/Nairobi' },
    { city: 'Casablanca, Morocco', tz: 'Africa/Casablanca' },
    { city: 'Accra, Ghana', tz: 'Africa/Accra' },
    { city: 'Addis Ababa, Ethiopia', tz: 'Africa/Addis_Ababa' },
    { city: 'Cape Town, South Africa', tz: 'Africa/Johannesburg' },

    // --- Asia ---
    { city: 'Beijing, China', tz: 'Asia/Shanghai' },
    { city: 'Shanghai, China', tz: 'Asia/Shanghai' },
    { city: 'Hong Kong', tz: 'Asia/Hong_Kong' },
    { city: 'Taipei, Taiwan', tz: 'Asia/Taipei' },
    { city: 'Seoul, South Korea', tz: 'Asia/Seoul' },
    { city: 'Osaka, Japan', tz: 'Asia/Tokyo' },
    { city: 'Kyoto, Japan', tz: 'Asia/Tokyo' },
    { city: 'Manila, Philippines', tz: 'Asia/Manila' },
    { city: 'Jakarta, Indonesia', tz: 'Asia/Jakarta' },
    { city: 'Bali, Indonesia', tz: 'Asia/Makassar' },
    { city: 'Kuala Lumpur, Malaysia', tz: 'Asia/Kuala_Lumpur' },
    { city: 'Ho Chi Minh City, Vietnam', tz: 'Asia/Ho_Chi_Minh' },
    { city: 'Hanoi, Vietnam', tz: 'Asia/Bangkok' },
    { city: 'New Delhi, India', tz: 'Asia/Kolkata' },
    { city: 'Bangalore, India', tz: 'Asia/Kolkata' },
    { city: 'Hyderabad, India', tz: 'Asia/Kolkata' },
    { city: 'Chennai, India', tz: 'Asia/Kolkata' },
    { city: 'Colombo, Sri Lanka', tz: 'Asia/Colombo' },
    { city: 'Kathmandu, Nepal', tz: 'Asia/Kathmandu' },
    { city: 'Yangon, Myanmar', tz: 'Asia/Yangon' },
    { city: 'Almaty, Kazakhstan', tz: 'Asia/Almaty' },
    { city: 'Tashkent, Uzbekistan', tz: 'Asia/Tashkent' },
    { city: 'Lahore, Pakistan', tz: 'Asia/Karachi' },
    { city: 'Islamabad, Pakistan', tz: 'Asia/Karachi' },

    // --- Oceania & Islands ---
    { city: 'Melbourne, Australia', tz: 'Australia/Melbourne' },
    { city: 'Brisbane, Australia', tz: 'Australia/Brisbane' },
    { city: 'Perth, Australia', tz: 'Australia/Perth' },
    { city: 'Hobart, Australia', tz: 'Australia/Hobart' },
    { city: 'Darwin, Australia', tz: 'Australia/Darwin' },
    { city: 'Wellington, New Zealand', tz: 'Pacific/Auckland' },
    { city: 'Christchurch, New Zealand', tz: 'Pacific/Auckland' },
    { city: 'Suva, Fiji', tz: 'Pacific/Fiji' },
    { city: 'Port Moresby, Papua New Guinea', tz: 'Pacific/Port_Moresby' },
    { city: 'Noumea, New Caledonia', tz: 'Pacific/Noumea' },
    { city: 'Apia, Samoa', tz: 'Pacific/Apia' },
    { city: 'Pago Pago, American Samoa', tz: 'Pacific/Pago_Pago' },
    { city: 'Midway Atoll', tz: 'Pacific/Midway' },
    { city: 'Guam', tz: 'Pacific/Guam' },
    { city: 'Reykjavik, Iceland', tz: 'Atlantic/Reykjavik' },
];

// 9am up to (not including) 6pm counts as "working hours".
const WORK_START = 8;
const WORK_END = 20;

export type WorkOverlap = 'both' | 'one' | 'neither';

export function isValidIana(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/**
 * Substring search over the city DB. If the user typed a valid IANA ID that
 * isn't in the DB (e.g. "Europe/Warsaw"), surface it as an "as-is" choice —
 * the DB stays short while coverage stays infinite.
 */
export function searchCities(query: string): City[] {
    const q = query.trim().toLowerCase();
    const matches = q
        ? CITIES.filter(c => c.city.toLowerCase().includes(q) || c.tz.toLowerCase().includes(q))
        : CITIES.slice();

    const typed = query.trim();
    const typedIsCustom = typed.includes('/') && isValidIana(typed) && !matches.some(c => c.tz === typed);
    if (typedIsCustom) matches.unshift({ city: `${typed} (use as-is)`, tz: typed });

    return matches.slice(0, 25);
}

/** Hour (0–23) in `toTz` when the wall-clock is `hour:00` in `fromTz` on `isoDate`. */
export function convertHour(isoDate: string, hour: number, fromTz: string, toTz: string): number {
    const wall = `${isoDate} ${String(hour).padStart(2, '0')}:00:00`;
    return Number(formatInTimeZone(fromZonedTime(wall, fromTz), toTz, 'H'));
}

export function workOverlap(senderHour: number, receiverHour: number): WorkOverlap {
    const s = senderHour >= WORK_START && senderHour < WORK_END;
    const r = receiverHour >= WORK_START && receiverHour < WORK_END;
    if (s && r) return 'both';
    if (s || r) return 'one';
    return 'neither';
}

export function overlapEmoji(o: WorkOverlap): string {
    return o === 'both' ? '☀️' : o === 'one' ? '🌤️' : '🌙';
}

export function formatHour12(h: number): string {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function formatHM12(hm: string): string {
    const [hStr, mStr = '00'] = hm.split(':');
    const h = Number(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${mStr.padStart(2, '0')} ${ampm}`;
}

/** Full formatted string in a given zone for a given wall-clock in senderTz. */
export function formatInZone(
    isoDate: string,
    time: string,
    sourceTz: string,
    targetTz: string,
    fmt = 'EEE, MMM d · h:mm a zzz',
): string {
    return formatInTimeZone(fromZonedTime(`${isoDate} ${time}:00`, sourceTz), targetTz, fmt);
}