import { Message } from 'discord.js';
import { BOT, MAINTAINERS, PREFIX } from '@root/config';

export const description = `Provides information about ${BOT.NAME}.`;

export async function run(msg: Message): Promise<Message> {
	const info
= `Welcome to ${BOT.NAME}! A wonderful, magical bot that has been custom-coded to assist you while you use this discord server.
	 
Some features of ${BOT.NAME} include: 
	• :man_mage:  Self-assignable roles
	• :ticket: Question tagging so you can easily find questions others have asked
	• :ninja: Private and anonymous questions
	• :fire:  And many more! (use ${PREFIX}help for the full list of commands)

Our friend ${BOT.NAME} was originally created by Ben Segal, Josh Lyon, and Ren Ross and is is actively maintained by ${MAINTAINERS}. 
Please let any of us know if you have any issues! We try to fix bugs as soon as possible and are still adding new features.

If you're interested in how ${BOT.NAME} works, you can check the code out at <https://github.com/ud-cis-discord/SageV2>.`;
	return msg.channel.send(info);
}
