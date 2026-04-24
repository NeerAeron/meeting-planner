import {
    ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder,
    TextInputStyle, ActionRowBuilder,
} from 'discord.js';
import { parseCustomId, makeCustomId } from '../utils/customId';
import { sessions } from '../store/sessions';
import { buildSetupScreen } from '../ui/setupScreen';
import { buildProposalMessage, buildTzPickerScreen } from '../ui/proposalMessage';
import { formatInZone } from '../services/timezone';
import { compareSlot } from '../types';

const SENDER_ACTIONS = new Set(['custom_time', 'clear_times', 'send', 'cancel']);
const TARGET_ACTIONS = new Set(['accept', 'decline', 'change_tz', 'back_to_proposal']);

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
    const { action, args } = parseCustomId(interaction.customId);
    const [sessionId, extra] = args;
    const session = sessions.get(sessionId);
    if (!session) {
        await replyEphemeral(interaction, 'This meeting has expired.');
        return;
    }

    if (SENDER_ACTIONS.has(action) && session.senderId !== interaction.user.id) {
        await replyEphemeral(interaction, "This isn't your meeting setup.");
        return;
    }
    if (TARGET_ACTIONS.has(action) && session.targetUserId !== interaction.user.id) {
        await replyEphemeral(interaction, "This proposal isn't for you.");
        return;
    }

    switch (action) {
        case 'custom_time':       return openCustomTimeModal(interaction, sessionId);
        case 'clear_times':       return clearTimes(interaction, sessionId);
        case 'send':              return sendToChannel(interaction, sessionId);
        case 'cancel':            return cancel(interaction, sessionId);
        case 'change_tz':         return showTzPicker(interaction, sessionId);
        case 'back_to_proposal':  return backToProposal(interaction, sessionId);
        case 'accept':            return accept(interaction, sessionId, Number(extra));
        case 'decline':           return decline(interaction, sessionId);
    }
}

// --- Sender actions ---------------------------------------------------------

async function openCustomTimeModal(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    const input = new TextInputBuilder()
        .setCustomId('time_value')
        .setLabel('Time in your timezone (24h, HH:MM)')
        .setPlaceholder('14:37')
        .setStyle(TextInputStyle.Short)
        .setMinLength(4)
        .setMaxLength(5)
        .setRequired(true);

    const modal = new ModalBuilder()
        .setCustomId(makeCustomId('custom_time_modal', sessionId))
        .setTitle('Add a custom time')
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));

    await interaction.showModal(modal);
}

async function sendToChannel(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    const session = sessions.get(sessionId)!;
    sessions.update(sessionId, { status: 'sent' });

    const { content, components } = buildProposalMessage(session, `<@${session.senderId}>`);

    // First: close out the ephemeral setup. Then post the visible proposal via
    // followUp — works even when the app isn't a channel member (user-install
    // in group DMs), because the interaction webhook authorizes the send.
    await interaction.update({ content: '✅  Proposal posted in the chat.', components: [] });
    await interaction.followUp({ content, components });
}

async function cancel(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    sessions.delete(sessionId);
    await interaction.update({ content: 'Meeting setup cancelled.', components: [] });
}

async function clearTimes(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    sessions.update(sessionId, { proposals: [] });
    const fresh = sessions.get(sessionId)!;
    const screen = buildSetupScreen(fresh, `<@${fresh.targetUserId}>`);
    await interaction.update({ content: screen.content, components: screen.components });
}

// --- Target actions ---------------------------------------------------------

async function showTzPicker(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    const session = sessions.get(sessionId)!;
    sessions.update(sessionId, { status: 'picking_tz' });
    const screen = buildTzPickerScreen(session, `<@${session.senderId}>`);
    await interaction.update({ content: screen.content, components: screen.components });
}

async function backToProposal(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    const session = sessions.get(sessionId)!;
    sessions.update(sessionId, { status: 'sent' });
    const screen = buildProposalMessage(session, `<@${session.senderId}>`);
    await interaction.update({ content: screen.content, components: screen.components });
}

async function accept(interaction: ButtonInteraction, sessionId: string, idx: number): Promise<void> {
    const session = sessions.get(sessionId)!;
    // Order must match proposalMessage.ts — both sort with `compareSlot`.
    const slot = [...session.proposals].sort(compareSlot)[idx];
    if (!slot) {
        await replyEphemeral(interaction, 'That time is no longer available.');
        return;
    }

    const senderStr = formatInZone(slot.date, slot.time, session.senderTz, session.senderTz);
    const receiverStr = formatInZone(slot.date, slot.time, session.senderTz, session.receiverTz);
    const sameTz = session.senderTz === session.receiverTz;

    sessions.update(sessionId, { status: 'completed' });
    await interaction.update({
        content:
            `✅  **Meeting confirmed.**\n` +
            `<@${session.senderId}> · <@${session.targetUserId}>\n\n` +
            (sameTz ? receiverStr : `**${receiverStr}**\n-# _${senderStr} for <@${session.senderId}>_`),
        components: [],
    });
    sessions.delete(sessionId);
}

async function decline(interaction: ButtonInteraction, sessionId: string): Promise<void> {
    const session = sessions.get(sessionId)!;
    sessions.update(sessionId, { status: 'completed' });
    await interaction.update({
        content: `<@${session.senderId}> — <@${session.targetUserId}> couldn't make any of those. Try different times?`,
        components: [],
    });
    sessions.delete(sessionId);
}

// --- Helpers ----------------------------------------------------------------

async function replyEphemeral(interaction: ButtonInteraction, content: string): Promise<void> {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}