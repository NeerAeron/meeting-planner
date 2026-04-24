import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { meetCommand } from './meetCommand';

export interface SlashCommand {
    data: { name: string; toJSON: () => unknown };
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

export const commands: Record<string, SlashCommand> = {
    [meetCommand.data.name]: meetCommand,
};