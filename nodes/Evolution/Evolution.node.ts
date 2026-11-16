import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { runOperation } from './execute';
import { fieldProperties, operationProperties, resourceProperty } from './properties';

export class Evolution implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StePro Evolution API',
		name: 'steProEvolution',
		icon: 'file:evolution.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Full Evolution API v2 client: instances, messages, chats, groups, profiles, webhooks and diagnostics',
		defaults: { name: 'Evolution API' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'steProEvolutionApi', required: true }],
		properties: [resourceProperty, ...operationProperties, ...fieldProperties],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const response = await runOperation.call(this, i);
				returnData.push({ json: response as INodeExecutionData['json'], pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
