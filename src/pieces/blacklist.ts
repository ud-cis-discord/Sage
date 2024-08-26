import { BLACKLIST } from '@root/config';
import { Client, Message } from 'discord.js';

// I stole these from https://github.com/powercord-org/powercord-backend/blob/my-awesome-branch/packages/boat/src/modules/mod/automod.ts#L52
const CLEANER = /[\u200B-\u200F\u2060-\u2063\uFEFF\u00AD\u180E]|[\u0300-\u036f]|[\u202A-\u202E]|[/\\]/g;
const NORMALIZE: [RegExp, string][] = [
	[/Α|А|₳|Ꭿ|Ꭺ|Λ|@|🅰|🅐|\uD83C\uDDE6/g, 'A'],
	[/Β|В|в|฿|₿|Ᏸ|Ᏼ|🅱|🅑|\uD83C\uDDE7/g, 'B'],
	[/С|Ⅽ|₡|₵|Ꮳ|Ꮯ|Ꮸ|ᑕ|🅲|🅒|\uD83C\uDDE8/g, 'C'],
	[/Ⅾ|ↁ|ↇ|Ꭰ|🅳|🅓|\uD83C\uDDE9/g, 'D'],
	[/Ε|Ξ|ξ|Е|Ꭼ|Ꮛ|℮|🅴|🅔|\uD83C\uDDEA/g, 'E'],
	[/Ғ|ғ|₣|🅵|🅕|\uD83C\uDDEB/g, 'F'],
	[/₲|Ꮆ|Ᏻ|Ᏽ|🅶|🅖|\uD83C\uDDEC/g, 'G'],
	[/Η|Н|н|Ӊ|ӊ|Ң|ң|Ӈ|ӈ|Ҥ|ҥ|Ꮋ|🅷|🅗|\uD83C\uDDED/g, 'H'],
	[/Ι|І|Ӏ|ӏ|Ⅰ|Ꮖ|Ꮠ|🅸|🅘|\uD83C\uDDEE/g, 'I'],
	[/Ј|Ꭻ|🅹|🅙|\uD83C\uDDEF/g, 'J'],
	[/Κ|κ|К|к|Қ|қ|Ҟ|ҟ|Ҡ|ҡ|Ӄ|ӄ|Ҝ|ҝ|₭|Ꮶ|🅺|🅚|\uD83C\uDDF0/g, 'K'],
	[/Ⅼ|£|Ł|Ꮮ|🅻|🅛|\uD83C\uDDF1/g, 'L'],
	[/Μ|М|м|Ӎ|ӎ|Ⅿ|Ꮇ|🅼|🅜|\uD83C\uDDF2/g, 'M'],
	[/Ν|И|и|Ҋ|ҋ|₦|🅽|🅝|\uD83C\uDDF3/g, 'N'],
	[/Θ|θ|Ο|О|Ө|Ø|Ꮎ|Ꮻ|Ꭴ|Ꮕ|🅾|🅞|\uD83C\uDDF4/g, 'O'],
	[/Ρ|Р|Ҏ|₽|₱|Ꭾ|Ꮅ|Ꮲ|🅿|🆊|🅟|\uD83C\uDDF5/g, 'P'],
	[/🆀|🅠|\uD83C\uDDF6/g, 'Q'],
	[/Я|я|Ꭱ|Ꮢ|🆁|🅡|\uD83C\uDDF7/g, 'R'],
	[/Ѕ|\$|Ꭶ|Ꮥ|Ꮪ|🆂|🅢|\uD83C\uDDF8/g, 'S'],
	[/Τ|Т|т|Ҭ|ҭ|₮|₸|Ꭲ|🆃|🅣|\uD83C\uDDF9/g, 'T'],
	[/🆄|🅤|\uD83C\uDDFA/g, 'U'],
	[/Ⅴ|Ꮴ|Ꮙ|Ꮩ|🆅|🅥|\uD83C\uDDFB/g, 'V'],
	[/₩|Ꮃ|Ꮤ|🆆|🅦|\uD83C\uDDFC/g, 'W'],
	[/Χ|χ|Х|Ҳ|🆇|🅧|\uD83C\uDDFD/g, 'X'],
	[/Υ|У|Ү|Ұ|¥|🆈|🅨|\uD83C\uDDFE/g, 'Y'],
	[/Ζ|Ꮓ|🆉|🅩|\uD83C\uDDFF/g, 'Z'],
	[/α|а/g, 'a'],
	[/β|Ꮟ/g, 'b'],
	[/ϲ|с|ⅽ|↻|¢|©️/g, 'c'],
	[/đ|ⅾ|₫|Ꮷ|ժ|🆥/g, 'd'],
	[/ε|е|Ҽ|ҽ|Ҿ|ҿ|Є|є|€/g, 'e'],
	[/ƒ/g, 'f'],
	[/Ћ|ћ|Һ|һ|Ꮒ|Ꮵ/g, 'h'],
	[/ι|і|ⅰ|Ꭵ|¡/g, 'i'],
	[/ј/g, 'j'],
	[/ⅼ|£|₤/g, 'l'],
	[/ⅿ|₥/g, 'm'],
	[/ο|о|օ|ө|ø|¤|๏/g, 'o'],
	[/ρ|р|ҏ|Ꮘ|φ|ק/g, 'p'],
	[/ɾ/g, 'r'],
	[/ѕ/g, 's'],
	[/τ/g, 't'],
	[/μ|υ/g, 'u'],
	[/ν|ⅴ/g, 'v'],
	[/ω|ա|山/g, 'w'],
	[/х|ҳ|ⅹ/g, 'x'],
	[/γ|у|ү|ұ|Ꭹ|Ꮍ/g, 'y'],
	[/⓿/g, '0'],
	[/⓵/g, '1'],
	[/⓶/g, '2'],
	[/⓷/g, '3'],
	[/Ꮞ|⓸/g, '4'],
	[/⓹/g, '5'],
	[/⓺/g, '6'],
	[/⓻/g, '7'],
	[/⓼/g, '8'],
	[/⓽/g, '9'],
	[/⓾/g, '10'],
	[/⓫/g, '11'],
	[/⓬/g, '12'],
	[/⓭/g, '13'],
	[/⓮/g, '14'],
	[/⓯/g, '15'],
	[/⓰/g, '16'],
	[/⓱/g, '17'],
	[/⓲/g, '18'],
	[/⓳/g, '19'],
	[/⓴/g, '20'],
	[/1/g, 'i'],
	[/3/g, 'e'],
	[/4/g, 'a'],
	[/9/g, 'g'],
	[/0/g, 'o']
];

async function register(bot: Client): Promise<void> {
	bot.on('messageCreate', async (msg) => {
		filterMessages(msg).catch(async error => bot.emit('error', error));
	});
	bot.on('messageUpdate', async (_, msg) => {
		// Handel partials
		if (msg.partial) {
			msg = await msg.fetch();
		}
		msg = msg as Message;

		filterMessages(msg).catch(async error => bot.emit('error', error));
	});
}

async function filterMessages(msg: Message): Promise<Message | void> {
	let normalizedMessage = msg.content.normalize('NFKD');
	let selfNormalizedMessage = normalizedMessage; // Thanks, Rowan :D
	// Distinguish between NFKD normalisation and self-normalisation to allow the original message to be
	// normalized and sent to the offending user, without removing the spaces.

	for (const [re, rep] of NORMALIZE) {
		selfNormalizedMessage = selfNormalizedMessage.replace(re, rep);
	}

	const cleanSelfNormalizedMessage = selfNormalizedMessage.replace(CLEANER, '');
	const cleanMessage = msg.content.replace(CLEANER, '');

	const lowercaseMessage = msg.content.toLowerCase();
	const cleanLowercaseMessage = cleanMessage.toLowerCase();
	const cleanSelfNormalizedLowercaseMessage = cleanSelfNormalizedMessage.toLowerCase();

  // strip of any special characters and spaces
	const finalMessage = cleanSelfNormalizedLowercaseMessage.replace(/[^a-zA-Z0-9 ]/g, '');
	const finalMessagenoSpaces = finalMessage.replace(/\s/g, '');

	for (const word of BLACKLIST) {
		const simpleContains = lowercaseMessage.includes(word);
		if (simpleContains || cleanLowercaseMessage.includes(word) || cleanSelfNormalizedLowercaseMessage.includes(word)
    || finalMessage.includes(word) || finalMessagenoSpaces.includes(word)) {
			msg.delete();

			return msg.author.send(`Your message contains the restricted word "${word}". Please refrain from using restricted words again.

Original message:
${normalizedMessage}`)
			.catch(() => {
				msg.channel.send(`${msg.member}, you used a restricted word. Please refrain from doing so again.`);
			});
		}
	}
}


export default register;
