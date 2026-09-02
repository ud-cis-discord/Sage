import crypto from 'crypto';
import { Collection } from 'mongodb';
import { Transporter } from 'nodemailer';
import { SageUser } from '@lib/types/SageUser';
import { Course } from '@lib/types/Course';
import { EMAIL, GUILDS, ROLES, FIRST_LEVEL } from '@root/config';

/* eslint-disable max-len */
export const ONBOARD_MESSAGE = `<!DOCTYPE html>
<html>

<head>
	<title>Discord Verification</title>
</head>

<body>

	<h1 style="color:#00539F">Welcome!</h1>
	<p>You're getting this email because you're part of a class in the UD CIS Department that is using <span style="color:#738ADB">Discord</span> as its primary means of communication.</p>
	<p>For further information about the UD CIS <span style="color:#738ADB">Discord</span>, see <a href="https://ud-cis-discord.github.io/">this page.</a></p>
	<p><strong>If you don't have a <span style="color:#738ADB">Discord</span> account already, click <a href="https://discord.com/register">here</a> to sign up for one.</strong></p>
	<p>
		Once you are ready, click <a href="https://discord.gg/$invCode">here</a> to join the server and get yourself verified.
	<p>Once you're on the server, follow the instructions given to you in the channel called "getting-verified". Make sure you have your hash code (given below) ready!
	</p>

	<p>Further, usage of this Discord server means that you agree to <a href="https://docs.google.com/document/d/1ReVBzepnWvrt6bf4aRfaeHIDo4fFfEuNpOsjmGzvRdM/edit?usp=sharing">these rules</a>. Please take a moment to review them.</p>

	<p>Your hash code is: <span style="color:blueviolet">$hash</span></p>
	<p><br>We hope to see you on the server soon!<br>- The <span style="color:#738ADB">Discord</span> Admin Team</p>

</body>

</html>
`;
/* eslint-enable max-len */

// 'created': new user inserted (send them an email)
// 'restaffed': existing unverified user overwritten with staff roles
// 'verifiedStaff': existing verified user flagged as staff (Discord roles must be added manually)
// 'skipped': user already onboarded, nothing changed
export type OnboardResult = 'created' | 'restaffed' | 'verifiedStaff' | 'skipped';

export function hashEmail(email: string): string {
	return crypto.createHash('sha256').update(email).digest('base64').toString();
}

export function buildOnboardUser(email: string, hash: string, isStaff: boolean, course?: Course): SageUser {
	const newUser: SageUser = {
		email: email,
		hash: hash,
		isStaff: isStaff,
		discordId: '',
		count: 0,
		levelExp: FIRST_LEVEL,
		curExp: FIRST_LEVEL,
		level: 1,
		levelPings: true,
		isVerified: false,
		pii: false,
		roles: [],
		courses: []
	};

	if (course) {
		if (isStaff) {
			newUser.roles.push(course.roles.staff);
		} else {
			newUser.roles.push(course.roles.student);
			newUser.courses.push(course.name);
		}
	}

	if (isStaff) {
		newUser.roles.push(ROLES.STAFF);
	}
	newUser.roles.push(ROLES.LEVEL_ONE);

	return newUser;
}

export async function onboardUser(users: Collection, email: string, isStaff: boolean, course?: Course): Promise<{ result: OnboardResult, hash: string, entry?: SageUser }> {
	const hash = hashEmail(email);
	const entry: SageUser = await users.findOne({ email: email, hash: hash });
	const newUser = buildOnboardUser(email, hash, isStaff, course);

	if (entry) {			// User already on-boarded
		if (isStaff && entry.isVerified) {		// Make staff if not already
			await users.updateOne(entry, { $set: { isStaff: true } });
			return { result: 'verifiedStaff', hash, entry };
		} else if (isStaff && !entry.isVerified) {
			await users.updateOne(entry, { $set: { ...newUser } });
			return { result: 'restaffed', hash, entry };
		}
		return { result: 'skipped', hash, entry };
	}

	await users.insertOne(newUser);
	return { result: 'created', hash };
}

export function sendOnboardEmail(mailer: Transporter, email: string, hash: string): Promise<unknown> {
	return mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		to: email,
		subject: 'Welcome to the UD CIS Discord!',
		html: ONBOARD_MESSAGE.replace('$hash', hash).replace('$invCode', GUILDS.GATEWAY_INVITE)
	});
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
