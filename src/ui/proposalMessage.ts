import {
    ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} from 'discord.js';
import { makeCustomId } from '../utils/customId';
import {
    CITIES, convertHour, workOverlap, overlapEmoji, formatInZone,
} from '../services/timezone';
import { MeetingSession, compareSlot } from '../types';
import { Screen } from './setupScreen';

/**
 * Posted in the channel. Times are primary in the RECEIVER's timezone.
 * Accepting a time implicitly confirms the displayed zone; the "Wrong
 * timezone?" button corrects in-place without re-sending.
 */
export function buildProposalMessage(session: MeetingSession, senderMention: string): Screen {
    const { id, senderTz, receiverTz, proposals, targetUserId } = session;
    if (!proposals.length) throw new Error('proposal requires at least one slot');

    const sorted = [...proposals].sort(compareSlot);
    const sameTz = senderTz === receiverTz;

    const lines = sorted.map(({ date, time }) => {
        const h = Number(time.split(':')[0]);
        const rH = convertHour(date, h, senderTz, receiverTz);
        const emoji = overlapEmoji(workOverlap(h, rH));
        const receiverStr = formatInZone(date, time, senderTz, receiverTz);
        if (sameTz) return `${emoji}  **${receiverStr}**`;
        const senderStr = formatInZone(date, time, senderTz, senderTz);
        return `${emoji}  **${receiverStr}**\t(_their ${senderStr}_)`;
    });

    const tzHint = sameTz
        ? ''
        : `\n-# Shown in **${receiverTz}** — tap *Wrong timezone?* if that's not you.`;

    const content =
        `<@${targetUserId}> — ${senderMention} is proposing a meeting:\n\n` +
        lines.join('\n') +
        tzHint;

    // Labels are in the RECEIVER's zone — including the day, since crossing
    // midnight during conversion can shift it. `compareSlot` order must match
    // the accept-button idx on the other side (buttonHandler.ts).
    const timeButtons = sorted.map((slot, idx) => {
        const label = formatInZone(slot.date, slot.time, senderTz, receiverTz, 'EEE h:mm a');
        return new ButtonBuilder()
            .setCustomId(makeCustomId('accept', id, String(idx)))
            .setLabel(label)
            .setStyle(ButtonStyle.Success);
    });

    const changeTz = new ButtonBuilder()
        .setCustomId(makeCustomId('change_tz', id))
        .setLabel('🌍 Wrong timezone?')
        .setStyle(ButtonStyle.Secondary);

    const decline = new ButtonBuilder()
        .setCustomId(makeCustomId('decline', id))
        .setLabel('None work')
        .setStyle(ButtonStyle.Secondary);

    // 5-button row: up to 3 times + change_tz + decline.
    return {
        content,
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(...timeButtons, changeTz, decline),
        ],
    };
}

/** Target swapped the proposal message into a TZ picker. Back restores it. */
export function buildTzPickerScreen(session: MeetingSession, senderMention: string): Screen {
    const select = new StringSelectMenuBuilder()
        .setCustomId(makeCustomId('select', 'tz', session.id))
        .setPlaceholder('Pick your timezone')
        .setMinValues(1)
        .setMaxValues(1);

    for (const c of CITIES.slice(0, 25)) {
        select.addOptions({ label: c.city, value: c.tz, default: c.tz === session.receiverTz });
    }

    const back = new ButtonBuilder()
        .setCustomId(makeCustomId('back_to_proposal', session.id))
        .setLabel('← Back')
        .setStyle(ButtonStyle.Secondary);

    return {
        content:
            `<@${session.targetUserId}> — what's your timezone? ` +
            `${senderMention}'s proposal will update to your local time.`,
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
            new ActionRowBuilder<ButtonBuilder>().addComponents(back),
        ],
    };
}