import { Interaction, MessageFlags } from 'discord.js';
import { commands } from '../commands';
import { handleSelectMenu } from './selectMenuHandler';
import { handleButton } from './buttonHandler';
import { handleModal } from './modalHandler';

export async function routeInteraction(interaction: Interaction): Promise<void> {
    try {
        if (interaction.isChatInputCommand()) {
            await commands[interaction.commandName]?.execute(interaction);
        } else if (interaction.isAutocomplete()) {
            await commands[interaction.commandName]?.autocomplete?.(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        } else if (interaction.isButton()) {
            await handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModal(interaction);
        }
    } catch (err) {
        console.error('[interaction error]', err);
        await bestEffortReply(interaction);
    }
}

async function bestEffortReply(interaction: Interaction): Promise<void> {
    if (!interaction.isRepliable()) return;
    const content = 'Something went wrong. Please try again.';
    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content, flags: MessageFlags.Ephemeral });
        }
    } catch {
        /* interaction token expired — nothing to do */
    }
}