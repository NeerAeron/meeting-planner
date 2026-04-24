import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import 'dotenv/config';

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
    throw new Error('DISCORD_TOKEN and CLIENT_ID must be set');
}

const body = Object.values(commands).map(c => c.data.toJSON());
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        const names = Object.keys(commands).join(', ');
        console.log(`Refreshing ${body.length} global command(s): ${names}`);
        const data = (await rest.put(Routes.applicationCommands(CLIENT_ID), { body })) as unknown[];
        console.log(`✅ Reloaded ${data.length} global commands.`);
        console.log('Note: global commands can take up to 1 hour to propagate.');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();