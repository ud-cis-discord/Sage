export const BOT = {
	TOKEN: '',					// Bot token here
	CLIENT_ID: '',				// Client ID here
	NAME: 'Sage'				// Bot Name
};

export const DB = {
	CONNECTION: '', 			// Mongo connection string here
	USERS: 'users',
	PVQ: 'pvQuestions',
	QTAGS: 'questionTags',
	ASSIGNABLE: 'assignable',
	COURSES: 'courses',
	REMINDERS: 'reminders',
	CLIENT_DATA: 'clientData'
};

export const GUILDS = {			// Guild IDs for each guild
	MAIN: '',
	GATEWAY: '',
	GATEWAY_INVITE: ''
};

export const ROLES = {			// Role IDS for each role
	ADMIN: '',
	STUDENT_ADMIN: '',
	STAFF: '',
	VERIFIED: '',
	MUTED: '',
	LEVEL_ONE: ''
};

export const EMAIL = {
	SENDER: '',					// The email address all emails should be sent from
	REPLY_TO: '',				// The replyto address for all emails
	REPORT_ADDRESSES: [			// A list of all the email address to get the weekly report
		''
	]
};

export const CHANNELS = {			// Channel IDs
	ERROR_LOG: '',
	SERVER_LOG: '',
	MEMBER_LOG: '',
	MOD_LOG: '',
	FEEDBACK: '',
	SAGE: '',
	ANNOUNCEMENTS: '',
	ARCHIVE: ''
};

export const LEVEL_TIER_ROLES = [
	'',
	'',
	'',
	'',
	''
];

export const FIRST_LEVEL = 10;
export const GITHUB_TOKEN = '';
export const GITHUB_PROJECT = '';
export const PREFIX = 's;';
export const MAINTAINERS = '';	// The current maintainers of this bot
export const SEMESTER_ID = '';	// The current semester ID. i.e. s21
export const BLACKLIST = [];
