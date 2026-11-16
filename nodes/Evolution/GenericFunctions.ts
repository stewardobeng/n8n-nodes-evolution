import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

export type EvolutionContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

/** Join the configured server URL with an endpoint without doubling slashes. */
export function joinUrl(base: string, endpoint: string): string {
	return `${String(base).replace(/\/+$/, '')}/${String(endpoint).replace(/^\/+/, '')}`;
}

/**
 * One HTTP call against Evolution API. The key travels as the `apikey` header, which is the
 * only auth scheme Evolution accepts (it is not Bearer).
 */
export async function evolutionApiRequest(
	this: EvolutionContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<any> {
	const credentials = await this.getCredentials('steProEvolutionApi');
	const options: IHttpRequestOptions = {
		method,
		url: joinUrl(credentials.serverUrl as string, endpoint),
		headers: {
			apikey: credentials.apiKey as string,
			Accept: 'application/json',
		},
		json: true,
		// Evolution answers 400/403 with a JSON body that names the real problem
		// (ads_required, instance does not exist, number required). Surface it verbatim.
		returnFullResponse: false,
	};
	if (body !== undefined) options.body = body;
	if (qs !== undefined) options.qs = qs;
	// a dead Evolution host must not hang a workflow forever
	options.timeout = 120000;
	return this.helpers.httpRequest(options);
}

/** Resolve the instance name, falling back to the credential default. */
export async function resolveInstance(
	ctx: EvolutionContext,
	value: unknown,
): Promise<string> {
	const name = String(value ?? '').trim();
	if (name !== '') return name;
	const credentials = await ctx.getCredentials('steProEvolutionApi');
	const fallback = String(credentials.defaultInstance ?? '').trim();
	if (fallback !== '') return fallback;
	throw new Error(
		'No instance name given and no Default Instance Name set on the Evolution API credential.',
	);
}

/** Parse a JSON parameter that may arrive empty, as an object, or as a string. */
export function asObject(value: unknown): IDataObject | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'object') return value as IDataObject;
	try {
		return JSON.parse(String(value)) as IDataObject;
	} catch (error) {
		throw new Error(`Expected JSON and could not parse it: ${(error as Error).message}`);
	}
}

/** Evolution wants presence values exactly as these strings. */
export const PRESENCE_VALUES = ['composing', 'recording', 'paused', 'available', 'unavailable'];
