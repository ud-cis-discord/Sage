import { Message } from 'discord.js';
import { BOT, MAINTAINERS } from '@root/config';

export const description = `Provides information about ${BOT.NAME}.`;

export async function run(msg: Message): Promise<Message> {
	const info
= `Welcome to ${BOT.NAME}! A wonderful, magical bot that has been custom-coded to assist you while you use this discord server.
	 
Some features of ${BOT.NAME} include: 
	• :man_mage:  Self-assignable roles
	• :eyes:  A word restriced list to catch a limited amount of rule-breaking terms
	• :alarm_clock:  Reminders in case — OH MY GOD IT'S BURNING
	• :fire:  And many more! (use s;help for the full list of commands)

Our friend ${BOT.NAME} was origionaly created by Ben Segal, Josh Lyon, and Ren Ross and is is actively maintained by ${MAINTAINERS}. 
Please let any of us know if you have any issues! We try to fix bugs as soon as possible and are still adding new features.

If you're interested in how ${BOT.NAME} works, you can check the code out at <https://github.com/ud-cis-discord/SageV2>.`;
	return msg.channel.send(info);
}
