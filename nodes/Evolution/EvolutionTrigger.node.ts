import {
	IDataObject,
	IHookFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { evolutionApiRequest, joinUrl, resolveInstance } from './GenericFunctions';

/** Evolution's own event names. MESSAGES_UPSERT is the one that carries inbound chat. */
const EVENTS: INodePropertyOptions[] = [
	'MESSAGES_UPSERT',
	'MESSAGES_UPDATE',
	'MESSAGES_SET',
	'SEND_MESSAGE',
	'CONTACTS_UPSERT',
	'CONTACTS_UPDATE',
	'CONNECTION_UPDATE',
	'QRCODE_UPDATED',
	'PRESENCE_UPDATE',
	'CHATS_UPSERT',
	'CHATS_UPDATE',
	'CHATS_DELETE',
	'GROUPS_UPSERT',
	'GROUP_UPDATE',
	'GROUP_PARTICIPANTS_UPDATE',
	'APPLICATION_STARTUP',
	'LOGOUT_INSTANCE',
	'REMOVE_INSTANCE',
	'CALL',
	'LABELS_EDIT',
	'LABELS_ASSOCIATION',
	'TYPEBOT_START',
	'TYPEBOT_CHANGE_STATUS',
].map((value) => ({ name: value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()), value }));

function splitEvents(value: unknown): string[] {
	const list = Array.isArray(value) ? value : String(value ?? '').split(',');
	return list.map((v) => String(v).trim()).filter((v) => v !== '');
}

async function currentWebhook(ctx: IHookFunctions | IWebhookFunctions, instance: string): Promise<IDataObject> {
	try {
		return (await evolutionApiRequest.call(ctx, 'GET', `/webhook/find/${encodeURIComponent(instance)}`)) as IDataObject;
	} catch {
		return {};
	}
}

export class EvolutionTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StePro Evolution Trigger',
		name: 'steProEvolutionTrigger',
		icon: 'file:evolution.svg',
		group: ['trigger'],
		version: 1,
		description: 'Starts a workflow when Evolution API posts an event for an instance',
		defaults: { name: 'Evolution Trigger' },
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'steProEvolutionApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: '',
			},
		],
		properties: [
			{
				displayName:
					'Activating this trigger rewrites the webhook configured on that instance. If a different URL is already set, it refuses unless you allow it below.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Instance Name',
				name: 'instanceName',
				type: 'string',
				default: '',
				required: true,
				description: 'Evolution instance to listen to. Leave empty to use the credential default',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				default: ['MESSAGES_UPSERT'],
				options: EVENTS,
				description: 'Which Evolution events start this workflow',
			},
			{
				displayName: 'Payload',
				name: 'payloadMode',
				type: 'options',
				default: 'normalized',
				options: [
					{
						name: 'Raw (Evolution Envelope)',
						value: 'raw',
						description: 'Exactly what Evolution posted: {event, instance, data, ...}',
					},
					{
						name: 'Normalized (Flat Fields, Data Kept)',
						value: 'normalized',
						description: 'Adds messageId, remoteJid, text and friends on top of the original data',
					},
				],
			},
			{
				displayName: 'Ignore Messages I Sent',
				name: 'ignoreFromMe',
				type: 'boolean',
				default: true,
				description: 'Drop events where fromMe is true, so the bot never answers itself',
			},
			{
				displayName: 'Ignore Groups',
				name: 'ignoreGroups',
				type: 'boolean',
				default: true,
			},
			{
				displayName: 'Ignore Newsletters',
				name: 'ignoreNewsletters',
				type: 'boolean',
				default: true,
			},
			{
				displayName: 'Overwrite An Existing Webhook',
				name: 'forceOverwriteWebhook',
				type: 'boolean',
				default: false,
				description:
					'When OFF (recommended) activation fails if the instance already points at another URL, so a second workflow cannot silently mute the first',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const instance = await resolveInstance(this, this.getNodeParameter('instanceName', ''));
				const own = String(this.getNodeWebhookUrl('default') ?? '');
				const hook = await currentWebhook(this, instance);
				const url = String(hook?.url ?? '');
				return url !== '' && joinUrl('', url) === joinUrl('', own);
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const instance = await resolveInstance(this, this.getNodeParameter('instanceName', ''));
				const own = String(this.getNodeWebhookUrl('default') ?? '');
				const force = this.getNodeParameter('forceOverwriteWebhook', false) as boolean;

				const existing = await currentWebhook(this, instance);
				const existingUrl = String(existing?.url ?? '');
				if (existingUrl !== '' && joinUrl('', existingUrl) !== joinUrl('', own) && !force) {
					throw new Error(
						`Instance "${instance}" already posts its events to ${existingUrl}. ` +
							'Activating this trigger would replace that webhook and silence whatever listens there. ' +
							'Enable "Overwrite An Existing Webhook" only if you mean to take the instance over.',
					);
				}

				await evolutionApiRequest.call(this, 'POST', `/webhook/set/${encodeURIComponent(instance)}`, {
					webhook: {
						enabled: true,
						url: own,
						events: splitEvents(this.getNodeParameter('events', ['MESSAGES_UPSERT'])),
						byEvents: false,
						base64: false,
					},
				});
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const instance = await resolveInstance(this, this.getNodeParameter('instanceName', ''));
				const own = String(this.getNodeWebhookUrl('default') ?? '');
				const existing = await currentWebhook(this, instance);
				const existingUrl = String(existing?.url ?? '');

				// Only clear what belongs to this workflow, and keep the URL so nothing is lost.
				if (existingUrl !== '' && joinUrl('', existingUrl) !== joinUrl('', own)) {
					return true;
				}
				await evolutionApiRequest.call(this, 'POST', `/webhook/set/${encodeURIComponent(instance)}`, {
					webhook: { enabled: false, url: existingUrl || own, events: [], byEvents: false, base64: false },
				});
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as IDataObject;
		const res = this.getResponseObject();

		const event = String(body.event ?? '');
		const selected = splitEvents(this.getNodeParameter('events', ['MESSAGES_UPSERT']));
		if (event !== '' && !selected.includes(event)) {
			res.status(200).json({ ignored: true, reason: 'event not selected' });
			return { noWebhookResponse: true };
		}

		const data = (body.data ?? {}) as IDataObject;
		const key = (data.key ?? {}) as IDataObject;
		const jid = String(key.remoteJid ?? '');
		const fromMe = key.fromMe === true || key.fromMe === 'true';

		if ((this.getNodeParameter('ignoreFromMe', true) as boolean) && fromMe) {
			res.status(200).json({ ignored: true, reason: 'fromMe' });
			return { noWebhookResponse: true };
		}
		if ((this.getNodeParameter('ignoreGroups', true) as boolean) && jid.endsWith('@g.us')) {
			res.status(200).json({ ignored: true, reason: 'group' });
			return { noWebhookResponse: true };
		}
		if ((this.getNodeParameter('ignoreNewsletters', true) as boolean) && jid.endsWith('@newsletter')) {
			res.status(200).json({ ignored: true, reason: 'newsletter' });
			return { noWebhookResponse: true };
		}

		const mode = this.getNodeParameter('payloadMode', 'normalized') as string;
		const message = (data.message ?? {}) as IDataObject;
		const text =
			String(message.conversation ?? '') ||
			String((message.extendedTextMessage as IDataObject)?.text ?? '') ||
			String((message.imageMessage as IDataObject)?.caption ?? '') ||
			String((message.videoMessage as IDataObject)?.caption ?? '');

		let output: IDataObject;
		if (mode === 'raw') {
			output = body;
		} else {
			output = {
				event,
				instance: body.instance,
				messageId: key.id,
				remoteJid: jid,
				remoteJidAlt: key.remoteJidAlt,
				fromMe,
				isGroup: jid.endsWith('@g.us'),
				participant: key.participant,
				pushName: data.pushName,
				messageType: data.messageType,
				messageTimestamp: data.messageTimestamp,
				text,
				receivedAt: new Date().toISOString(),
				// the raw envelope is kept so downstream logic can always fall back to it
				data,
			};
		}

		return { workflowData: [this.helpers.returnJsonArray([output])] };
	}
}
