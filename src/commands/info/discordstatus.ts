/* eslint-disable camelcase */
import { EmbedBuilder, EmbedField, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import fetch from 'node-fetch';
import moment from 'moment';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Check Discord\'s current status.';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		await interaction.deferReply();
		const url = 'https://srhpyqt94yxb.statuspage.io/api/v2/summary.json';
		const currentStatus = await fetch(url, { method: 'Get' }).then(r => r.json()) as DiscordStatus;

		const fields: Array<EmbedField> = [];

		if (currentStatus.components.every(component => component.status === 'operational')) {
			fields.push({
				name: 'All components operational',
				value: 'No errors to report',
				inline: false
			});
		} else {
			currentStatus.components.forEach(component => {
				if (component.status !== 'operational') {
					fields.push({
						name: component.name,
						value: component.status,
						inline: true
					});
				}
			});
		}

		if (currentStatus.scheduled_maintenances.length > 0) {
			fields.push({
				name: 'Scheduled Maintenance',
				value: currentStatus.scheduled_maintenances.map(maintenance => `${maintenance.name} | Impact: ${maintenance.impact}`).join('\n'),
				inline: false
			});
		}

		const embed = new EmbedBuilder()
			.setTitle(currentStatus.status.description)
			.setDescription(`[Discord Status](${currentStatus.page.url})\n\n${currentStatus.incidents[0]
				? `Current incidents:\n${currentStatus.incidents.map(i => i.name).join('\n')}`
				: 'There are no active incidents.'}`)
			.addFields(fields)
			.setThumbnail('https://discord.com/assets/2c21aeda16de354ba5334551a883b481.png')
			.setTimestamp()
			.setFooter({ text: `Last changed ${moment(currentStatus.page.updated_at).format('YYYY MMM Do')}` })
			.setColor('Blurple');

		interaction.editReply({ embeds: [embed] });
	}

}

interface DiscordStatus {
	page: Page;
	status: Status;
	components?: (ComponentsEntity)[] | null;
	incidents?: (IncidentsEntity)[] | null;
	scheduled_maintenances?: (ScheduledMaintenancesEntity)[] | null;
}
interface Page {
	id: string;
	name: string;
	url: string;
	updated_at: string;
}
interface Status {
	description: string;
	indicator: string;
}
interface ComponentsEntity {
	created_at: string;
	description?: string|null;
	id: string;
	name: string;
	page_id: string;
	position: number;
	status: string;
	updated_at: string;
	only_show_if_degraded: boolean;
}
interface IncidentsEntity {
	created_at: string;
	id: string;
	impact: string;
	incident_updates?: (IncidentUpdatesEntity)[] | null;
	monitoring_at?: null;
	name: string;
	page_id: string;
	resolved_at?: null;
	shortlink: string;
	status: string;
	updated_at: string;
}
interface IncidentUpdatesEntity {
	body: string;
	created_at: string;
	display_at: string;
	id: string;
	incident_id: string;
	status: string;
	updated_at: string;
}
interface ScheduledMaintenancesEntity {
	created_at: string;
	id: string;
	impact: string;
	incident_updates?: (IncidentUpdatesEntity)[] | null;
	monitoring_at?: null;
	name: string;
	page_id: string;
	resolved_at?: null;
	scheduled_for: string;
	scheduled_until: string;
	shortlink: string;
	status: string;
	updated_at: string;
}
