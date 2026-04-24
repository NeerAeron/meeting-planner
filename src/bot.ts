import { Client, GatewayIntentBits, Events } from 'discord.js';
import { routeInteraction } from './handlers/interactionRouter';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error('DISCORD_TOKEN is not set');

// Guilds is the only intent we need: we don't receive DMs or read messages,
// we only respond to interactions (which arrive on a separate channel).
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => console.log(`✅ Logged in as ${c.user.tag}`));
client.on(Events.InteractionCreate, routeInteraction);
client.on(Events.Error, (err) => console.error('[client error]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

client.login(token);