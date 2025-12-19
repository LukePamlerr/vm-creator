import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { REST } from 'discord.js';
import { Routes } from 'discord-api-types/v10';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional for guild-scoped registration

if (!token || !clientId) {
	console.error('DISCORD_TOKEN and CLIENT_ID are required in environment');
	process.exit(1);
}

async function loadCommandData(){
	const commandsPath = path.resolve('./src/commands');
	if (!fs.existsSync(commandsPath)) return [];
	const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
	const commands = [];
	for (const file of files){
		const fileUrl = pathToFileURL(path.join(commandsPath, file)).href;
		try{
			const mod = await import(fileUrl);
			if (mod?.data){
				// `data` may be a SlashCommandBuilder or plain object
				commands.push(typeof mod.data.toJSON === 'function' ? mod.data.toJSON() : mod.data);
			}
		}catch(err){
			console.warn('Failed to load command', file, err.message);
		}
	}
	return commands;
}

(async ()=>{
	const commands = await loadCommandData();
	if (!commands.length) console.log('No commands found in src/commands');

	const rest = new REST({ version: '10' }).setToken(token);
	try{
		if (guildId){
			console.log(`Registering ${commands.length} commands to guild ${guildId}`);
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
			console.log('Registered to guild');
		} else {
			console.log(`Registering ${commands.length} global commands`);
			await rest.put(Routes.applicationCommands(clientId), { body: commands });
			console.log('Registered globally (may take up to 1 hour to appear)');
		}
	}catch(err){
		console.error('Failed to register commands', err);
		process.exit(1);
	}
})();
