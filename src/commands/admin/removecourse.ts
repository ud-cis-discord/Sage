import { ADMIN_PERMS } from '@lib/permissions';
import { CHANNELS, DB, SEMESTER_ID } from '@root/config';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ButtonInteraction, CategoryChannel, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder,
	ApplicationCommandOptionType, InteractionResponse, ButtonStyle } from 'discord.js';
import { updateDropdowns } from '@root/src/lib/utils/generalUtils';

const DECISION_TIMEOUT = 30;

export default class extends Command {

	description = 'Remove a course';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: 'The course ID of the course to be removed (ex: 108).',
		type: ApplicationCommandOptionType.Channel,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		let timeout = DECISION_TIMEOUT;
		const course = interaction.options.getChannel('course') as CategoryChannel;
		console.log(course.id);

		//	 grabbing course data
		let channelCount;
		try {
			channelCount = course.children.cache.size;
		} catch (error) {
			return interaction.reply('You have to tag a valid course category.');
		}
		const courseId = course.name.substring(5);
		const userCount = await interaction.client.mongo.collection(DB.USERS).countDocuments({ courses: courseId });
		const reason = `Removing course \`${course}\` as requested by ` +
		`${interaction.user.tag}\` \`(${interaction.user.id})\``;

		const confirmBtns = [
			new ButtonBuilder({ label: 'Yes', customId: 'y', style: ButtonStyle.Secondary }),
			new ButtonBuilder({ label: 'No', customId: 'n', style: ButtonStyle.Danger })
		];

		//	a warning gets issued for this command
		const baseText = `Are you sure you want to delete ${course}? ` +
		`This action will archive ${channelCount} channels and unenroll ${userCount} users. `;
		await interaction.reply({ content: `${baseText} Press 'yes' in the next 30 seconds to confirm.`, components: [new ActionRowBuilder<ButtonBuilder>({ components: confirmBtns })] });

		let replyId;
		interaction.fetchReply().then(reply => { replyId = reply.id; });

		const collector = interaction.channel.createMessageComponentCollector({
			time: DECISION_TIMEOUT * 1000,
			filter: i => i.message.id === replyId
		});

		const countdown = setInterval(() => this.countdown(interaction, --timeout, confirmBtns, baseText), 1000);

		collector.on('collect', async (i: ButtonInteraction) => {
			if (interaction.user.id !== i.user.id) {
				await i.reply({
					content: 'You cannot respond to a command you did not execute',
					ephemeral: true
				});
				return;
			}

			if (i.customId === 'y') {
				try {
					await interaction.editReply('<a:loading:755121200929439745> working...');

					//	fetching course roles
					await interaction.guild.members.fetch();
					const staffRole = await interaction.guild.roles.cache.find(role => role.name === `${courseId} Staff`);
					const studentRole = await interaction.guild.roles.cache.find(role => role.name === `CISC ${courseId}`);
					const allStaffRole = await interaction.guild.roles.cache.find(role => role.name === 'Staff');
					const profRole = await interaction.guild.roles.cache.find(role => role.name === 'Prof');
					const TARole = await interaction.guild.roles.cache.find(role => role.name === 'TA');
					const LARole = await interaction.guild.roles.cache.find(role => role.name === 'LA');
					//	archving the course channels
					for (const channel of [...course.children.cache.values()]) {
						await channel.setParent(CHANNELS.ARCHIVE, { reason });
						await channel.lockPermissions();
						await channel.setName(`${SEMESTER_ID}_${channel.name}`, reason);
					}
					await course.delete();

					for (const [, member] of staffRole.members) {
						// removing COURSE SPECIFIC staff role
						if (member.roles.cache.has(staffRole.id)) await member.roles.remove(staffRole.id, reason);
						// check if member is an LA and remove LA role if so
						if (member.roles.cache.has(LARole.id)) {
							await member.roles.remove(LARole.id, reason);
						}
						// check if member is a TA and remove TA role if so
						if (member.roles.cache.has(TARole.id)) {
							await member.roles.remove(TARole.id, reason);
						}
						// check if member is a prof, if not, remove Staff role
						if (member.roles.cache.has(allStaffRole.id) && !member.roles.cache.has(profRole.id)) {
							await member.roles.remove(allStaffRole.id, reason);
						}
					}
					for (const [, member] of studentRole.members) {
						if (member.roles.cache.has(studentRole.id)) await member.roles.remove(studentRole.id, reason);
					}

					// update and remove from database
					await interaction.client.mongo.collection(DB.USERS).updateMany({}, { $pull: { courses: courseId } });
					await interaction.client.mongo.collection(DB.COURSES).findOneAndDelete({ name: courseId });

					await updateDropdowns(interaction);

					staffRole.delete(reason);
					studentRole.delete(reason);

					await interaction.editReply(`${channelCount} channels archived and ${userCount} users unenrolled from CISC ${courseId}`);
				} catch (error) {
					interaction.client.emit('error', error);
					interaction.channel.send(`An error occured: ${error.message}`);
				}
			} else {
				await interaction.editReply({
					components: [],
					content: 'Course removal canceled. Nothing has been modified.'
				});
				return;
			}

			await interaction.editReply({
				components: []
			});
		}).on('end', async collected => {
			const validCollected = collected.filter(i => i.isButton()
			&& i.message.id === interaction.id
			&& i.user.id === interaction.user.id);

			clearInterval(countdown);

			if (timeout === 1 && validCollected.size === 0) { // when clearInterval is used, timeout sticks to 1 second
				await interaction.editReply({
					components: [],
					content: 'Command timed out.'
				});
				return;
			}
		});
		return;
	}

	countdown(interaction: ChatInputCommandInteraction, timeout: number, btns: ButtonBuilder[], baseText: string): void {
		const extraText = timeout > 1
			? `Press 'yes' in the next ${timeout} seconds to confirm.`
			: `Press 'yes' in the next ${timeout} seconds to confirm.`;
		interaction.editReply({ content: baseText +
		extraText, components: [new ActionRowBuilder<ButtonBuilder>({ components: btns })] });
	}


}
