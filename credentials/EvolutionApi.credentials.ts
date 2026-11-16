import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EvolutionApi implements ICredentialType {
	name = 'steProEvolutionApi';
	displayName = 'Evolution API';
	documentationUrl = 'https://doc.evolution-api.com/v2/en/overview';
	properties: INodeProperties[] = [
		{
			displayName: 'Server URL',
			name: 'serverUrl',
			type: 'string',
			default: '',
			placeholder: 'https://evolution.example.com',
			required: true,
			description: 'Base URL of your Evolution API server, without a trailing slash',
		},
		{
			displayName: 'Global API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The AUTHENTICATION_API_KEY from the Evolution API environment',
		},
		{
			displayName: 'Default Instance Name',
			name: 'defaultInstance',
			type: 'string',
			default: '',
			description: 'Optional. Used by the trigger and by operations where you leave the instance blank',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: { apikey: '={{$credentials.apiKey}}' },
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.serverUrl}}',
			url: '/instance/fetchInstances',
			method: 'GET',
		},
	};
}
