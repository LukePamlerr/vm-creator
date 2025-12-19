import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildKey, updateInstanceStatus } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('vm-pause')
  .setDescription('Pause (halt) a tracked virtual machine (Admin only)')
  .addStringOption(o => o.setName('id').setDescription('Instance ID').setRequired(true))
  .setDMPermission(false);

export async function execute(interaction, { vultr }){
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)){
    return interaction.reply({ content: 'Only server administrators can run this.', ephemeral: true });
  }
  await interaction.deferReply({ ephemeral: true });
  const apiKey = getGuildKey(interaction.guildId);
  if (!apiKey) return interaction.editReply({ content: 'No Vultr API key configured for this server. Use /setup set-key (Admin).' });
  const id = interaction.options.getString('id', true);
  try{
    await vultr.pauseInstance(apiKey, id);
    updateInstanceStatus(id, 'pending-pause');
    return interaction.editReply({ content: `Pause/halt command sent for instance ${id}.` });
  }catch(err){
    return interaction.editReply({ content: `Failed to pause instance: ${err.message}` });
  }
}
