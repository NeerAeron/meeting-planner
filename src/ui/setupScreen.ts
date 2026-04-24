import {
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { addDays, format, parseISO } from 'date-fns';
import { makeCustomId } from '../utils/customId';
import {
    convertHour, workOverlap, overlapEmoji, formatHour12, formatHM12, formatInZone,
} from '../services/timezone';
import { MeetingSession, MAX_TIMES, compareSlot } from '../types';

const DAYS_AHEAD = 14;

export interface Screen {
    content: string;
    components: ActionRowBuilder<any>[];
}

export function buildSetupScreen(session: MeetingSession, targetMention: string): Screen {
    const { id, senderTz, receiverTz, anchorDate, proposals } = session;
    const sameTz = senderTz === receiverTz;
    const today = new Date();
    const rows: ActionRowBuilder<any>[] = [];

    // Row 1 — day picker. This is the *anchor*: it scopes the hour picker below
    // and is where picked/custom times land. Days already carrying proposals
    // get a "· N proposed" suffix so the state is visible at a glance.
    const dateSelect = new StringSelectMenuBuilder()
        .setCustomId(makeCustomId('select', 'date', id))
        .setPlaceholder('1. Pick a day')
        .setMinValues(1)
        .setMaxValues(1);

    for (let i = 0; i < DAYS_AHEAD; i++) {
        const d = addDays(today, i);
        const name = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEEE');
        const value = format(d, 'yyyy-MM-dd');
        const count = proposals.filter(s => s.date === value).length;
        dateSelect.addOptions({
            label: `${name}, ${format(d, 'MMM do')}${count ? `  · ${count} proposed` : ''}`,
            value,
            default: value === anchorDate,
        });
    }
    rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dateSelect));

    // Row 2 — hour picker scoped to the anchor day. The dropdown is authoritative
    // for the anchor day (re-selecting replaces that day's hour slots, including
    // custom times added on this day — same trade-off as before, now scoped).
    // Slots on other days are never touched. Hidden when at cap and all slots
    // are elsewhere, since there's nothing to add or toggle here.
    const otherDaySlots = proposals.filter(s => s.date !== anchorDate);
    const roomOnAnchor = MAX_TIMES - otherDaySlots.length;

    if (anchorDate && roomOnAnchor > 0) {
        const anchorTimes = proposals.filter(s => s.date === anchorDate).map(s => s.time);
        const timeSelect = new StringSelectMenuBuilder()
            .setCustomId(makeCustomId('select', 'times', id))
            .setPlaceholder(`2. Propose times on ${format(parseISO(anchorDate), 'EEE, MMM d')}`)
            .setMinValues(0)
            .setMaxValues(roomOnAnchor);

        for (let h = 0; h < 24; h++) {
            const value = `${String(h).padStart(2, '0')}:00`;
            const rH = convertHour(anchorDate, h, senderTz, receiverTz);
            const emoji = overlapEmoji(workOverlap(h, rH));
            timeSelect.addOptions({
                label: `${emoji}  ${formatHour12(h)}`,
                description: sameTz
                    ? undefined
                    : `Their time: ${formatInZone(anchorDate, value, senderTz, receiverTz, 'EEE h a')}`,
                value,
                default: anchorTimes.includes(value),
            });
        }
        rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(timeSelect));
    }

    // Row 3 — actions
    const atCap = proposals.length >= MAX_TIMES;
    const hasProposals = proposals.length > 0;

    const customBtn = new ButtonBuilder()
        .setCustomId(makeCustomId('custom_time', id))
        .setLabel('+ Custom time')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(atCap || !anchorDate);

    const clearBtn = new ButtonBuilder()
        .setCustomId(makeCustomId('clear_times', id))
        .setLabel('Clear times')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasProposals);

    const sendBtn = new ButtonBuilder()
        .setCustomId(makeCustomId('send', id))
        .setLabel('Send to chat')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasProposals);

    const cancelBtn = new ButtonBuilder()
        .setCustomId(makeCustomId('cancel', id))
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(customBtn, clearBtn, sendBtn, cancelBtn));

    const header = `Proposing a meeting with ${targetMention}`;
    const tzLine = `-# You: **${senderTz}** · Them: **${receiverTz}** _(they can correct this)_`;
    const legend = sameTz
        ? '-# (same timezone — no conversion needed)'
        : '-# ☀️ both in working hours · 🌤️ one in working hours · 🌙 off hours';
    const capHint = atCap ? '-# _At the 3-time cap. Clear one to add more._' : '';

    return {
        content: [header, tzLine, legend, capHint, currentlyProposing(session)].filter(Boolean).join('\n'),
        components: rows,
    };
}

function currentlyProposing(session: MeetingSession): string {
    const { senderTz, receiverTz, proposals } = session;
    if (!proposals.length) return '';
    const sameTz = senderTz === receiverTz;
    const sorted = [...proposals].sort(compareSlot);
    const lines = sorted.map(({ date, time }) => {
        const h = Number(time.split(':')[0]);
        const rH = convertHour(date, h, senderTz, receiverTz);
        const emoji = overlapEmoji(workOverlap(h, rH));
        const day = format(parseISO(date), 'EEE, MMM d');
        const local = formatHM12(time);
        if (sameTz) return `${emoji} ${day} · ${local}`;
        // formatInZone preserves the real instant — gives both the receiver's
        // weekday (which may differ when conversion crosses midnight) and
        // sub-hour minutes from custom times like 14:37.
        const theirs = formatInZone(date, time, senderTz, receiverTz, 'EEE h:mm a');
        return `${emoji} ${day} · ${local}  ·  their ${theirs}`;
    });
    return `\n**Currently proposing:**\n${lines.join('\n')}`;
}