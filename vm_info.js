import { SlashCommandBuilder } from 'discord.js';
import { getGuildKey, getInstance } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('vm-info')
  .setDescription('Get information about a specific VM')
  .addStringOption(o => o.setName('id').setDescription('Instance ID').setRequired(true))
  .setDMPermission(false);

export async function execute(interaction, { vultr }){
  await interaction.deferReply({ ephemeral: true });
  const apiKey = getGuildKey(interaction.guildId);
  if (!apiKey) return interaction.editReply({ content: 'No Vultr API key configured for this server. Use /setup set-key (Admin).' });
  const id = interaction.options.getString('id', true);
  try{
    const res = await vultr.getInstance(apiKey, id);
    const inst = res.instance || res;
    const pretty = Object.entries(inst).slice(0,20).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
    return interaction.editReply({ content: `Instance info:\n${pretty}` });
  }catch(err){
    // fallback to local DB
    const local = getInstance(id);
    if (!local) return interaction.editReply({ content: `Failed to fetch instance: ${err.message}` });
    return interaction.editReply({ content: `Local instance record:\nLabel: ${local.label}\nStatus: ${local.status}\nRegion: ${local.region}\nPlan: ${local.plan}\nID: ${local.instance_id}` });
  }
}
