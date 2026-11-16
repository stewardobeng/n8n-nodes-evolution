import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { asObject, evolutionApiRequest, resolveInstance } from './GenericFunctions';

const split = (value: unknown): string[] =>
	String(value ?? '')
		.split(',')
		.map((v) => v.trim())
		.filter((v) => v !== '');

export async function runOperation(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;
	const inst = await resolveInstance(this, this.getNodeParameter('instanceName', i, ''));

	const p = <T>(name: string, fallback?: T): T =>
		this.getNodeParameter(name, i, fallback as T) as unknown as T;

	const post = (endpoint: string, body: IDataObject) => evolutionApiRequest.call(this, 'POST', endpoint, body);
	const get = (endpoint: string) => evolutionApiRequest.call(this, 'GET', endpoint);
	const del = (endpoint: string) => evolutionApiRequest.call(this, 'DELETE', endpoint);

	switch (resource) {
		/* ---------------------------------------------------------------- instance */
		case 'instance':
			switch (operation) {
				case 'fetchAll':
					return get('/instance/fetchInstances');
				case 'connectionState':
					return get(`/instance/connectionState/${encodeURIComponent(inst)}`);
				case 'create':
					return post('/instance/create', {
						instanceName: p<string>('newInstanceName'),
						qrcode: p<boolean>('qrcode', true),
						integration: p<string>('integration', 'WHATSAPP-BAILEYS'),
					});
				case 'connect': {
					const number = String(p<string>('number', '')).replace(/\D/g, '');
					const qs = number !== '' ? `?number=${number}` : '';
					return get(`/instance/connect/${encodeURIComponent(inst)}${qs}`);
				}
				case 'logout':
					return del(`/instance/logout/${encodeURIComponent(inst)}`);
				case 'restart':
					return post(`/instance/restart/${encodeURIComponent(inst)}`, {});
				case 'delete':
					return del(`/instance/delete/${encodeURIComponent(inst)}`);
			}
			break;

		/* ---------------------------------------------------------------- message */
		case 'message': {
			const number = String(p<string>('number', ''));
			const delay = Number(p<number>('delay', 0));
			switch (operation) {
				case 'sendText': {
					const body: IDataObject = { number, text: p<string>('text') };
					if (delay > 0) body.delay = delay;
					body.linkPreview = p<boolean>('linkPreview', true);
					return post(`/message/sendText/${encodeURIComponent(inst)}`, body);
				}
				case 'sendMedia': {
					const body: IDataObject = {
						number,
						mediatype: p<string>('mediatype', 'image'),
						media: p<string>('media'),
					};
					const fileName = p<string>('fileName', '');
					const caption = p<string>('caption', '');
					if (fileName !== '') body.fileName = fileName;
					if (caption !== '') body.caption = caption;
					if (delay > 0) body.delay = delay;
					return post(`/message/sendMedia/${encodeURIComponent(inst)}`, body);
				}
				case 'sendAudio': {
					const body: IDataObject = { number, audio: p<string>('audio') };
					if (delay > 0) body.delay = delay;
					return post(`/message/sendWhatsAppAudio/${encodeURIComponent(inst)}`, body);
				}
				case 'sendPtv': {
					const body: IDataObject = { number, video: p<string>('video') };
					if (delay > 0) body.delay = delay;
					return post(`/message/sendPtv/${encodeURIComponent(inst)}`, body);
				}
				case 'sendLocation':
					return post(`/message/sendLocation/${encodeURIComponent(inst)}`, {
						number,
						name: p<string>('name', ''),
						address: p<string>('address', ''),
						latitude: Number(p<number>('latitude', 0)),
						longitude: Number(p<number>('longitude', 0)),
					});
				case 'sendContact':
					return post(`/message/sendContact/${encodeURIComponent(inst)}`, {
						number,
						contact: asObject(p<unknown>('contact', '[]')),
					});
				case 'sendPoll':
					return post(`/message/sendPoll/${encodeURIComponent(inst)}`, {
						number,
						name: p<string>('pollName'),
						selectableCount: Number(p<number>('selectableCount', 1)),
						values: split(p<string>('pollValues', '')),
					});
				case 'sendReaction':
					return post(`/message/sendReaction/${encodeURIComponent(inst)}`, {
						key: asObject(p<unknown>('reactionKeyJson', '{}')),
						reaction: p<string>('reaction'),
					});
				case 'sendStatus':
					return post(`/message/sendStatus/${encodeURIComponent(inst)}`, {
						type: p<string>('statusType', 'text'),
						content: p<string>('statusContent'),
						caption: p<string>('statusCaption', ''),
					});
				case 'sendButtons':
				case 'sendList': {
					const raw = asObject(p<unknown>('rawPayload', '{}')) ?? {};
					return post(`/message/${operation}/${encodeURIComponent(inst)}`, { number, ...raw });
				}
			}
			break;
		}

		/* ---------------------------------------------------------------- chat */
		case 'chat': {
			const chatJid = String(p<string>('chatJid', ''));
			switch (operation) {
				case 'sendPresence':
					return post(`/chat/sendPresence/${encodeURIComponent(inst)}`, {
						number: String(p<string>('presenceNumber', '')),
						presence: p<string>('presence', 'composing'),
						delay: Number(p<number>('presenceDelay', 2000)),
					});
				case 'markRead': {
					const ids = split(p<string>('messageIds', ''));
					return post(`/chat/markMessageAsRead/${encodeURIComponent(inst)}`, {
						readMessages: ids.map((id) => ({
							remoteJid: chatJid,
							fromMe: Boolean(p<boolean>('fromMe', false)),
							id,
						})),
					});
				}
				case 'fetchMessages':
					return post(`/chat/findMessages/${encodeURIComponent(inst)}`, {
						where: { key: { remoteJid: chatJid } },
						limit: Number(p<number>('limit', 20)),
					});
				case 'fetchChats':
					return post(`/chat/findChats/${encodeURIComponent(inst)}`, {});
				case 'archiveChat':
					return post(`/chat/archiveChat/${encodeURIComponent(inst)}`, {
						chat: chatJid,
						archive: Boolean(p<boolean>('archive', true)),
						lastMessage: {
							key: {
								remoteJid: chatJid,
								fromMe: Boolean(p<boolean>('fromMe', false)),
								id: p<string>('lastMessageId', '') || 'BAE5F00000000000',
							},
						},
					});
				case 'markUnread':
					return post(`/chat/markChatUnread/${encodeURIComponent(inst)}`, {
						chat: chatJid,
						unread: Boolean(p<boolean>('unread', true)),
						lastMessage: {
							key: {
								remoteJid: chatJid,
								fromMe: Boolean(p<boolean>('fromMe', false)),
								id: p<string>('lastMessageId', '') || 'BAE5F00000000000',
							},
						},
					});
				case 'deleteMessage':
					return del(
						`/chat/deleteMessageForEveryone/${encodeURIComponent(inst)}?id=${encodeURIComponent(
							p<string>('messageId'),
						)}&remoteJid=${encodeURIComponent(chatJid)}&fromMe=${Boolean(
							p<boolean>('fromMe', false),
						)}`,
					);
			}
			break;
		}

		/* ---------------------------------------------------------------- group */
		case 'group': {
			const g = encodeURIComponent(String(p<string>('groupJid', '')));
			const participants = split(p<string>('participants', ''));
			switch (operation) {
				case 'fetchAll':
					return get(
						`/group/fetchAllGroups/${encodeURIComponent(inst)}?getParticipants=${Boolean(
							p<boolean>('getParticipants', false),
						)}`,
					);
				case 'findGroup':
					return get(`/group/findGroupInfos/${encodeURIComponent(inst)}?groupJid=${g}`);
				case 'create':
					return post(`/group/create/${encodeURIComponent(inst)}`, {
						subject: p<string>('groupSubject'),
						participants,
						description: p<string>('groupDescription', ''),
					});
				case 'inviteCode':
					return get(`/group/inviteCode/${encodeURIComponent(inst)}?groupJid=${g}`);
				case 'inviteInfo':
					return get(
						`/group/inviteInfo/${encodeURIComponent(inst)}?inviteCode=${encodeURIComponent(
							p<string>('inviteCode'),
						)}`,
					);
				case 'leaveGroup':
					return del(`/group/leaveGroup/${encodeURIComponent(inst)}?groupJid=${g}`);
				case 'updateParticipant':
					return post(`/group/updateParticipant/${encodeURIComponent(inst)}?groupJid=${g}`, {
						action: p<string>('participantAction', 'add'),
						participants,
					});
				case 'updateSubject':
					return post(`/group/updateGroupSubject/${encodeURIComponent(inst)}?groupJid=${g}`, {
						subject: p<string>('groupSubject'),
					});
				case 'updateDescription':
					return post(`/group/updateGroupDescription/${encodeURIComponent(inst)}?groupJid=${g}`, {
						description: p<string>('groupDescription', ''),
					});
			}
			break;
		}

		/* ---------------------------------------------------------------- profile */
		case 'profile': {
			const number = String(p<string>('profileNumber', '')).replace(/\D/g, '');
			switch (operation) {
				case 'fetch':
					return get(
						`/profile/fetchProfile/${encodeURIComponent(inst)}${number ? `?number=${number}` : ''}`,
					);
				case 'fetchBusiness':
					return get(`/profile/fetchBusinessProfile/${encodeURIComponent(inst)}`);
				case 'updateName':
					return post(`/profile/updateProfileName/${encodeURIComponent(inst)}`, {
						name: p<string>('profileName'),
					});
				case 'updateStatus':
					return post(`/profile/updateProfileStatus/${encodeURIComponent(inst)}`, {
						status: p<string>('profileStatus'),
					});
				case 'updatePicture':
					return post(`/profile/updateProfilePicture/${encodeURIComponent(inst)}`, {
						picture: p<string>('profilePicture'),
					});
				case 'removePicture':
					return del(`/profile/removeProfilePicture/${encodeURIComponent(inst)}`);
			}
			break;
		}

		/* ---------------------------------------------------------------- webhook */
		case 'webhook': {
			const endpoint = `/webhook/set/${encodeURIComponent(inst)}`;
			if (operation === 'find') return get(`/webhook/find/${encodeURIComponent(inst)}`);

			if (operation === 'set') {
				return post(endpoint, {
					webhook: {
						enabled: true,
						url: p<string>('webhookUrl'),
						events: split(p<string>('webhookEvents', 'MESSAGES_UPSERT')),
						byEvents: Boolean(p<boolean>('webhookByEvents', false)),
						base64: Boolean(p<boolean>('webhookBase64', false)),
					},
				});
			}

			// unset: Evolution replaces the whole object, so keep the URL and drop the events
			const current = (await get(`/webhook/find/${encodeURIComponent(inst)}`)) as IDataObject;
			return post(endpoint, {
				webhook: {
					enabled: false,
					url: String(current?.url ?? ''),
					events: [],
					byEvents: false,
					base64: false,
				},
			});
		}

		/* ---------------------------------------------------------------- diagnostics */
		case 'diagnostics':
			return get('/');
	}

	throw new Error(`The operation "${operation}" on resource "${resource}" is not implemented.`);
}
