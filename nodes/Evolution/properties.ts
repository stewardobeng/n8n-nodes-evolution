import { INodeProperties } from 'n8n-workflow';

const show = (resource: string | string[], operation?: string | string[]) => ({
	resource: Array.isArray(resource) ? resource : [resource],
	...(operation ? { operation: Array.isArray(operation) ? operation : [operation] } : {}),
});

/** field helper: every node property in this node is declared through it */
function f(
	name: string,
	displayName: string,
	type: INodeProperties['type'],
	visible: ReturnType<typeof show>,
	extra: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName,
		name,
		type,
		default: type === 'number' ? 0 : type === 'boolean' ? false : '',
		displayOptions: { show: visible },
		...extra,
	} as INodeProperties;
}

const INSTANCE = f('instanceName', 'Instance Name', 'string', show(['instance', 'message', 'chat', 'group', 'profile', 'webhook']), {
	required: false,
	default: '',
	description: 'Leave empty to use the Default Instance Name from the credential',
});

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Chat', value: 'chat' },
		{ name: 'Diagnostics', value: 'diagnostics' },
		{ name: 'Group', value: 'group' },
		{ name: 'Instance', value: 'instance' },
		{ name: 'Message', value: 'message' },
		{ name: 'Profile', value: 'profile' },
		{ name: 'Webhook', value: 'webhook' },
	],
	default: 'message',
};

const op = (
	name: string,
	value: string,
	action: string,
	description: string,
	resource: string,
): INodeProperties => ({
	displayName: name,
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: [resource] } },
	options: [{ name, value, action, description }],
	default: value,
});

/** every operation of the node, grouped by resource */
export const operationProperties: INodeProperties[] = [
	// ---------------------------------------------------------------- instance
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['instance'] } },
		options: [
			{ name: 'Connection State', value: 'connectionState', action: 'Get connection state', description: 'open, connecting or close for one instance' },
			{ name: 'Create', value: 'create', action: 'Create an instance', description: 'Create a new WhatsApp instance' },
			{ name: 'Connect (QR / Pairing Code)', value: 'connect', action: 'Connect an instance', description: 'Returns the QR code, or a pairing code when a number is given' },
			{ name: 'Delete', value: 'delete', action: 'Delete an instance', description: 'Permanently delete the instance' },
			{ name: 'Fetch All', value: 'fetchAll', action: 'Fetch all instances', description: 'List every instance with its owner and state' },
			{ name: 'Logout', value: 'logout', action: 'Log out an instance', description: 'Detach the WhatsApp session, credentials are cleared' },
			{ name: 'Restart', value: 'restart', action: 'Restart an instance', description: 'Reconnect the instance socket' },
		],
		default: 'fetchAll',
	},
	// ---------------------------------------------------------------- message
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['message'] } },
		options: [
			{ name: 'Send Audio', value: 'sendAudio', action: 'Send an audio message', description: 'Send a voice note' },
			{ name: 'Send Buttons', value: 'sendButtons', action: 'Send interactive buttons', description: 'Raw Evolution buttons payload' },
			{ name: 'Send Contact', value: 'sendContact', action: 'Send a contact card', description: 'Send one or more vCards' },
			{ name: 'Send List', value: 'sendList', action: 'Send a list message', description: 'Raw Evolution list payload' },
			{ name: 'Send Location', value: 'sendLocation', action: 'Send a location', description: 'Send a pinned location' },
			{ name: 'Send Media', value: 'sendMedia', action: 'Send media', description: 'Image, video or document from URL or base64' },
			{ name: 'Send Poll', value: 'sendPoll', action: 'Send a poll', description: 'Send a poll with options' },
			{ name: 'Send Reaction', value: 'sendReaction', action: 'Send a reaction', description: 'React to an existing message' },
			{ name: 'Send Status', value: 'sendStatus', action: 'Send a status', description: 'Post to status@broadcast' },
			{ name: 'Send Text', value: 'sendText', action: 'Send a text message', description: 'Plain text to a number or chat id' },
			{ name: 'Send Video Note (PTV)', value: 'sendPtv', action: 'Send a video note', description: 'Round video note' },
		],
		default: 'sendText',
	},
	// ---------------------------------------------------------------- chat
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chat'] } },
		options: [
			{ name: 'Archive Chat', value: 'archiveChat', action: 'Archive a chat', description: 'Archive or unarchive a chat' },
			{ name: 'Delete Message For Everyone', value: 'deleteMessage', action: 'Delete a message for everyone', description: 'Delete one sent message' },
			{ name: 'Fetch Chats', value: 'fetchChats', action: 'Fetch chats', description: 'List chats known to the instance' },
			{ name: 'Fetch Messages', value: 'fetchMessages', action: 'Fetch messages', description: 'Read stored messages for a chat' },
			{ name: 'Mark Read', value: 'markRead', action: 'Mark messages as read', description: 'Send read receipts for given message ids' },
			{ name: 'Mark Unread', value: 'markUnread', action: 'Mark a chat as unread', description: 'Set the unread flag on a chat' },
			{ name: 'Send Presence', value: 'sendPresence', action: 'Send a presence update', description: 'Typing, recording or paused indicator' },
		],
		default: 'sendPresence',
	},
	// ---------------------------------------------------------------- group
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['group'] } },
		options: [
			{ name: 'Add or Update Participants', value: 'updateParticipant', action: 'Change participants', description: 'Add, remove, promote or demote members' },
			{ name: 'Create', value: 'create', action: 'Create a group', description: 'Create a group with participants' },
			{ name: 'Fetch All', value: 'fetchAll', action: 'Fetch all groups', description: 'List groups the instance belongs to' },
			{ name: 'Find Group Info', value: 'findGroup', action: 'Find group info', description: 'Details of one group' },
			{ name: 'Get Invite Code', value: 'inviteCode', action: 'Get an invite code', description: 'Invite link code for a group' },
			{ name: 'Invite Info', value: 'inviteInfo', action: 'Read invite info', description: 'Resolve an invite code to its group' },
			{ name: 'Leave Group', value: 'leaveGroup', action: 'Leave a group', description: 'Remove the instance from a group' },
			{ name: 'Update Description', value: 'updateDescription', action: 'Update the group description', description: 'Change the group description' },
			{ name: 'Update Subject', value: 'updateSubject', action: 'Update the group subject', description: 'Rename the group' },
		],
		default: 'fetchAll',
	},
	// ---------------------------------------------------------------- profile
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['profile'] } },
		options: [
			{ name: 'Fetch Business Profile', value: 'fetchBusiness', action: 'Fetch the business profile', description: 'Business profile of the instance number' },
			{ name: 'Fetch Profile', value: 'fetch', action: 'Fetch a profile', description: 'Profile of the instance or of a number' },
			{ name: 'Remove Picture', value: 'removePicture', action: 'Remove the profile picture', description: 'Clear the instance profile picture' },
			{ name: 'Update Name', value: 'updateName', action: 'Update the profile name', description: 'Change the instance display name' },
			{ name: 'Update Picture', value: 'updatePicture', action: 'Update the profile picture', description: 'Set the picture from a URL' },
			{ name: 'Update Status', value: 'updateStatus', action: 'Update the profile status', description: 'Change the about text' },
		],
		default: 'fetch',
	},
	// ---------------------------------------------------------------- webhook
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhook'] } },
		options: [
			{ name: 'Find', value: 'find', action: 'Find the webhook', description: 'Read the webhook configured on the instance' },
			{ name: 'Set', value: 'set', action: 'Set the webhook', description: 'Configure where Evolution posts events' },
			{ name: 'Unset', value: 'unset', action: 'Unset the webhook', description: 'Disable the webhook without losing the URL' },
		],
		default: 'find',
	},
	// ---------------------------------------------------------------- diagnostics
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['diagnostics'] } },
		options: [
			{ name: 'Health', value: 'health', action: 'Check server health', description: 'Version and welcome payload of the server' },
		],
		default: 'health',
	},
];

/** every field the operations need, generated once */
export const fieldProperties: INodeProperties[] = [
	INSTANCE,

	// instance create / connect / delete
	f('newInstanceName', 'New Instance Name', 'string', show('instance', 'create'), { required: true, default: '' }),
	f('integration', 'Integration', 'options', show('instance', 'create'), {
		default: 'WHATSAPP-BAILEYS',
		options: [
			{ name: 'WhatsApp Baileys (unofficial)', value: 'WHATSAPP-BAILEYS' },
			{ name: 'WhatsApp Business (official)', value: 'WHATSAPP-BUSINESS' },
		],
	}),
	f('qrcode', 'Return QR Code', 'boolean', show('instance', 'create'), { default: true }),
	f('number', 'Number', 'string', show('instance', 'connect'), {
		default: '',
		description: 'Leave empty to get a QR code; fill in an E.164 number (digits only) to get a pairing code',
	}),

	// message: text / media / audio / ptv / location / contact / poll / reaction / status
	f('number', 'To (Number or Chat ID)', 'string', show(['message'], ['sendText', 'sendMedia', 'sendAudio', 'sendPtv', 'sendLocation', 'sendContact', 'sendPoll', 'sendButtons', 'sendList']), {
		required: true,
		default: '',
		description: 'Phone number with country code, or a full chat id such as 123@lid or 456@g.us',
	}),
	f('text', 'Text', 'string', show('message', 'sendText'), { required: true, default: '', typeOptions: { rows: 3 } }),
	f('delay', 'Delay (ms)', 'number', show('message', ['sendText', 'sendMedia', 'sendAudio', 'sendPtv']), {
		default: 0,
		description: 'Show "typing" for this long before sending. 0 sends immediately',
	}),
	f('linkPreview', 'Link Preview', 'boolean', show('message', 'sendText'), { default: true }),
	f('mediatype', 'Media Type', 'options', show('message', 'sendMedia'), {
		default: 'image',
		options: [
			{ name: 'Image', value: 'image' },
			{ name: 'Video', value: 'video' },
			{ name: 'Document', value: 'document' },
		],
	}),
	f('media', 'Media', 'string', show('message', 'sendMedia'), {
		required: true,
		default: '',
		description: 'Public URL or base64 payload. For binary data use an expression producing base64',
	}),
	f('fileName', 'File Name', 'string', show('message', 'sendMedia'), { default: '' }),
	f('caption', 'Caption', 'string', show('message', ['sendMedia', 'sendAudio', 'sendPtv']), { default: '' }),
	f('audio', 'Audio', 'string', show('message', 'sendAudio'), { required: true, default: '', description: 'Public URL or base64' }),
	f('video', 'Video', 'string', show('message', 'sendPtv'), { required: true, default: '', description: 'Public URL or base64' }),
	f('latitude', 'Latitude', 'number', show('message', 'sendLocation'), { required: true, default: 0, typeOptions: { numberPrecision: 8 } }),
	f('longitude', 'Longitude', 'number', show('message', 'sendLocation'), { required: true, default: 0, typeOptions: { numberPrecision: 8 } }),
	f('name', 'Place Name', 'string', show('message', 'sendLocation'), { default: '' }),
	f('address', 'Address', 'string', show('message', 'sendLocation'), { default: '' }),
	f('contact', 'Contacts JSON', 'json', show('message', 'sendContact'), {
		required: true,
		default: '[]',
		description: 'Array of {fullName, wuid, phoneNumber} objects',
	}),
	f('pollName', 'Poll Question', 'string', show('message', 'sendPoll'), { required: true, default: '' }),
	f('selectableCount', 'Selectable Answers', 'number', show('message', 'sendPoll'), { default: 1 }),
	f('pollValues', 'Answers', 'string', show('message', 'sendPoll'), {
		required: true,
		default: '',
		description: 'Comma separated list of answers',
	}),
	f('reactionKeyJson', 'Target Message Key', 'json', show('message', 'sendReaction'), {
		required: true,
		default: '{}',
		description: 'The key object of the message you react to: {remoteJid, fromMe, id, participant?}',
	}),
	f('reaction', 'Reaction', 'string', show('message', 'sendReaction'), { required: true, default: '', description: 'A single emoji' }),
	f('statusType', 'Status Type', 'options', show('message', 'sendStatus'), {
		default: 'text',
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'Image', value: 'image' },
			{ name: 'Video', value: 'video' },
		],
	}),
	f('statusContent', 'Status Content', 'string', show('message', 'sendStatus'), { required: true, default: '', description: 'Text, or a URL for image/video' }),
	f('statusCaption', 'Caption', 'string', show('message', 'sendStatus'), { default: '' }),
	f('rawPayload', 'Payload JSON', 'json', show('message', ['sendButtons', 'sendList']), {
		required: true,
		default: '{}',
		description: 'Sent to Evolution as-is, so a new vendor field needs no node update',
	}),

	// chat
	f('presence', 'Presence', 'options', show('chat', 'sendPresence'), {
		default: 'composing',
		options: [
			{ name: 'Composing (typing)', value: 'composing' },
			{ name: 'Recording (audio)', value: 'recording' },
			{ name: 'Paused', value: 'paused' },
			{ name: 'Available', value: 'available' },
			{ name: 'Unavailable', value: 'unavailable' },
		],
	}),
	f('presenceNumber', 'To (Number or Chat ID)', 'string', show('chat', 'sendPresence'), { required: true, default: '' }),
	f('presenceDelay', 'Delay (ms)', 'number', show('chat', 'sendPresence'), {
		default: 2000,
		description:
			'Evolution holds the request open for this long and then clears the indicator. Keep it short: the call itself lasts this long',
	}),
	f('chatJid', 'Chat ID', 'string', show('chat', ['fetchMessages', 'archiveChat', 'markUnread']), { required: true, default: '', description: 'e.g. 1234@s.whatsapp.net or 123@lid' }),
	f('messageIds', 'Message IDs', 'string', show('chat', 'markRead'), {
		required: true,
		default: '',
		description: 'Comma separated message ids to mark as read',
	}),
	f('fromMe', 'From Me', 'boolean', show('chat', ['markRead', 'archiveChat', 'markUnread', 'deleteMessage']), { default: false }),
	f('messageId', 'Message ID', 'string', show('chat', 'deleteMessage'), { required: true, default: '' }),
	f('archive', 'Archive', 'boolean', show('chat', 'archiveChat'), { default: true }),
	f('unread', 'Unread', 'boolean', show('chat', 'markUnread'), { default: true }),
	f('limit', 'Limit', 'number', show('chat', 'fetchMessages'), { default: 20 }),

	// group
	f('groupJid', 'Group JID', 'string', show('group', ['findGroup', 'inviteCode', 'leaveGroup', 'updateParticipant', 'updateSubject', 'updateDescription']), {
		required: true,
		default: '',
		description: 'Group chat id, e.g. 1203630xxxx@g.us',
	}),
	f('groupSubject', 'Subject', 'string', show('group', ['create', 'updateSubject']), { required: true, default: '' }),
	f('groupDescription', 'Description', 'string', show('group', ['create', 'updateDescription']), { default: '' }),
	f('participants', 'Participants', 'string', show('group', ['create', 'updateParticipant']), {
		required: true,
		default: '',
		description: 'Comma separated phone numbers or JIDs',
	}),
	f('participantAction', 'Action', 'options', show('group', 'updateParticipant'), {
		default: 'add',
		options: [
			{ name: 'Add', value: 'add' },
			{ name: 'Remove', value: 'remove' },
			{ name: 'Promote', value: 'promote' },
			{ name: 'Demote', value: 'demote' },
		],
	}),
	f('getParticipants', 'Include Participants', 'boolean', show('group', 'fetchAll'), { default: false }),
	f('inviteCode', 'Invite Code', 'string', show('group', 'inviteInfo'), { required: true, default: '' }),

	// profile
	f('profileNumber', 'Number', 'string', show('profile', 'fetch'), { default: '', description: 'Leave empty for the instance own profile' }),
	f('profileName', 'Name', 'string', show('profile', 'updateName'), { required: true, default: '' }),
	f('profileStatus', 'Status', 'string', show('profile', 'updateStatus'), { required: true, default: '' }),
	f('profilePicture', 'Picture URL', 'string', show('profile', 'updatePicture'), { required: true, default: '' }),

	// webhook
	f('webhookUrl', 'Webhook URL', 'string', show('webhook', 'set'), { required: true, default: '', placeholder: 'https://n8n.example.com/webhook/...' }),
	f('webhookEvents', 'Events', 'string', show('webhook', ['set', 'unset']), {
		default: 'MESSAGES_UPSERT',
		description: 'Comma separated Evolution event names. All 26 events are accepted',
	}),
	f('webhookByEvents', 'Per-Event URLs', 'boolean', show('webhook', 'set'), {
		default: false,
		description:
			'OFF sends every event to the URL above. ON appends /messages-upsert, /contacts-update and so on, which breaks a single n8n webhook path',
	}),
	f('webhookBase64', 'Include Media As Base64', 'boolean', show('webhook', 'set'), { default: false }),

	// chat archive / unread need the last message of the chat as their anchor
	f('lastMessageId', 'Last Message ID', 'string', show('chat', ['archiveChat', 'markUnread']), {
		default: '',
		description: 'Optional. Evolution anchors the chat on its last message; leave blank to let the node supply a placeholder',
	}),
];
