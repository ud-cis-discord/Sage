// import { Command } from '@root/src/lib/types/Command';
// import { Message, ThreadChannel } from 'discord.js';

// export default class extends Command {

// 	description = `Archive a private question thread.`;
// 	extendedHelp = `This command only works in private question threads.`;
// 	aliases = ['close'];

// 	run(msg: Message): Promise<ThreadChannel> {
// 		if (!msg.channel.isThread()) {
// 			msg.channel.send(this.extendedHelp);
// 			return;
// 		}

// 		return msg.channel.setArchived(true, `${msg.author.username} archived the question.`);
// 	}

// }
