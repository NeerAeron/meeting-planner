import { StringSelectMenuInteraction, MessageFlags } from 'discord.js';
import { parseCustomId } from '../utils/customId';
import { sessions } from '../store/sessions';
import { buildSetupScreen } from '../ui/setupScreen';
import { buildProposalMessage } from '../ui/proposalMessage';

export async function handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    const { action, args } = parseCustomId(interaction.customId);
    if (action !== 'select') return;

    const [kind, sessionId] = args;
    const session = sessions.get(sessionId);
    if (!session) {
        await interaction.reply({
            content: 'This meeting setup has expired.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // date/times are sender-only (during setup). tz is target-only (during proposal).
    const isSender = session.senderId === interaction.user.id;
    const isTarget = session.targetUserId === interaction.user.id;
    const allowed = (kind === 'tz' && isTarget) || (kind !== 'tz' && isSender);
    if (!allowed) {
        await interaction.reply({
            content: "This isn't for you.",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (kind === 'date') {
        sessions.update(sessionId, { anchorDate: interaction.values[0] });
        await redrawSetup(interaction, sessionId);
    } else if (kind === 'times') {
        // The hour dropdown is authoritative for the anchor day: re-selecting
        // rewrites that day's slots (including custom times on this day).
        // Slots on other days are always preserved. The time picker's
        // maxValues already prevents exceeding the 3-slot cap.
        const { anchorDate } = session;
        if (!anchorDate) return;
        const otherDays = session.proposals.filter(s => s.date !== anchorDate);
        const newOnAnchor = interaction.values.map(time => ({ date: anchorDate, time }));
        sessions.update(sessionId, { proposals: [...otherDays, ...newOnAnchor] });
        await redrawSetup(interaction, sessionId);
    } else if (kind === 'tz') {
        sessions.update(sessionId, { receiverTz: interaction.values[0], status: 'sent' });
        await redrawProposal(interaction, sessionId);
    }
}

async function redrawSetup(interaction: StringSelectMenuInteraction, sessionId: string): Promise<void> {
    const fresh = sessions.get(sessionId)!;
    const screen = buildSetupScreen(fresh, `<@${fresh.targetUserId}>`);
    await interaction.update({ content: screen.content, components: screen.components });
}

async function redrawProposal(interaction: StringSelectMenuInteraction, sessionId: string): Promise<void> {
    const fresh = sessions.get(sessionId)!;
    const screen = buildProposalMessage(fresh, `<@${fresh.senderId}>`);
    await interaction.update({ content: screen.content, components: screen.components });
}