import {
    SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction,
    MessageFlags, InteractionContextType, ApplicationIntegrationType,
} from 'discord.js';
import { searchCities, isValidIana } from '../services/timezone';
import { buildSetupScreen } from '../ui/setupScreen';
import { sessions } from '../store/sessions';

export const meetCommand = {
    data: new SlashCommandBuilder()
        .setName('meet')
        .setDescription('Propose meeting times right here in the chat.')
        .setContexts([
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
        ])
        .setIntegrationTypes([
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall,
        ])
        .addUserOption(o =>
            o.setName('user')
                .setDescription('Who are you meeting with?')
                .setRequired(true),
        )
        .addStringOption(o =>
            o.setName('your_city')
                .setDescription('Your city')
                .setAutocomplete(true)
                .setRequired(true),
        )
        .addStringOption(o =>
            o.setName('their_city')
                .setDescription("Their city (they can correct this after you send)")
                .setAutocomplete(true)
                .setRequired(true),
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused();
        await interaction.respond(searchCities(focused).map(c => ({ name: c.city, value: c.tz })));
    },

    async execute(interaction: ChatInputCommandInteraction) {
        const target = interaction.options.getUser('user', true);
        const senderTz = interaction.options.getString('your_city', true);
        const receiverTz = interaction.options.getString('their_city', true);

        if (target.id === interaction.user.id) {
            await refuse(interaction, "You can't schedule a meeting with yourself.");
            return;
        }
        if (target.bot) {
            await refuse(interaction, "You can't schedule a meeting with a bot.");
            return;
        }
        if (!isValidIana(senderTz) || !isValidIana(receiverTz)) {
            await refuse(interaction, 'Pick timezones from the autocomplete — typed values must be IANA IDs like `Europe/Warsaw`.');
            return;
        }

        const session = sessions.create({
            senderId: interaction.user.id,
            targetUserId: target.id,
            senderTz,
            receiverTz,
        });

        const screen = buildSetupScreen(session, `<@${target.id}>`);
        await interaction.reply({
            content: screen.content,
            components: screen.components,
            flags: MessageFlags.Ephemeral,
        });
    },
};

async function refuse(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}