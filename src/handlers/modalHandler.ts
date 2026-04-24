import { ModalSubmitInteraction, MessageFlags } from 'discord.js';
import { parseCustomId } from '../utils/customId';
import { sessions } from '../store/sessions';
import { buildSetupScreen } from '../ui/setupScreen';
import { MAX_TIMES } from '../types';

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const { action, args } = parseCustomId(interaction.customId);
    if (action !== 'custom_time_modal') return;

    const [sessionId] = args;
    const session = sessions.get(sessionId);
    if (!session || session.senderId !== interaction.user.id) {
        await replyEphemeral(interaction, 'This setup has expired or is not yours.');
        return;
    }
    // Button is disabled without an anchor, but the interaction can race.
    if (!session.anchorDate) {
        await replyEphemeral(interaction, 'Pick a day first, then add a custom time.');
        return;
    }

    const raw = interaction.fields.getTextInputValue('time_value').trim();
    if (!TIME_RE.test(raw)) {
        await replyEphemeral(interaction, `"${raw}" isn't a valid time. Use 24-hour \`HH:MM\` (e.g. \`09:30\`, \`14:37\`).`);
        return;
    }

    const [h, m] = raw.split(':');
    const time = `${h.padStart(2, '0')}:${m}`;
    const { anchorDate } = session;

    if (session.proposals.some(s => s.date === anchorDate && s.time === time)) {
        await replyEphemeral(interaction, `${time} is already proposed for that day.`);
        return;
    }
    if (session.proposals.length >= MAX_TIMES) {
        await replyEphemeral(interaction, `You can propose at most ${MAX_TIMES} times. Clear one first.`);
        return;
    }

    sessions.update(sessionId, { proposals: [...session.proposals, { date: anchorDate, time }] });
    const fresh = sessions.get(sessionId)!;
    const screen = buildSetupScreen(fresh, `<@${fresh.targetUserId}>`);

    // The modal is always opened from a component, so isFromMessage() is true
    // in practice — but TS only exposes `update` after the narrowing.
    if (interaction.isFromMessage()) {
        await interaction.update({ content: screen.content, components: screen.components });
    } else {
        await interaction.reply({ content: screen.content, components: screen.components, flags: MessageFlags.Ephemeral });
    }
}

async function replyEphemeral(interaction: ModalSubmitInteraction, content: string): Promise<void> {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}