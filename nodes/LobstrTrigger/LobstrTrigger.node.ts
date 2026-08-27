import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { lobstrApiRequest, searchSquids } from '../Lobstr/GenericFunctions';

const ALL_EVENTS = ['run.done', 'run.error', 'run.paused', 'run.running'];

export class LobstrTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lobstr Trigger',
		name: 'lobstrTrigger',
		icon: { light: 'file:lobstr.svg', dark: 'file:lobstr.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a lobstr.io squid run event occurs',
		defaults: {
			name: 'Lobstr Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'lobstrApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Activating this trigger replaces any webhook delivery already configured on the selected squid',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Squid',
				name: 'squidId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The squid whose run events trigger this workflow',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchSquids',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. c106a44a98044ef18acc59986ae10967',
					},
				],
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [
					{
						name: 'Run Done',
						value: 'run.done',
						description: 'The run finished successfully',
					},
					{
						name: 'Run Error',
						value: 'run.error',
						description: 'The run crashed with an error',
					},
					{
						name: 'Run Paused',
						value: 'run.paused',
						description: 'The run was temporarily halted, e.g. account limits reached',
					},
					{
						name: 'Run Running',
						value: 'run.running',
						description: 'The run started or resumed',
					},
				],
				default: ['run.done'],
			},
		],
	};

	methods = {
		listSearch: {
			searchSquids,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const squidId = this.getNodeParameter('squidId', undefined, {
					extractValue: true,
				}) as string;
				const events = this.getNodeParameter('events', []) as string[];

				const squid = (await lobstrApiRequest.call(
					this,
					'GET',
					`/squids/${squidId}`,
				)) as IDataObject;
				const webhookFields = squid.webhook_fields as IDataObject | null;

				if (
					!webhookFields ||
					webhookFields.is_active !== true ||
					webhookFields.url !== webhookUrl
				) {
					return false;
				}

				const configuredEvents = (webhookFields.events as IDataObject) ?? {};
				for (const event of ALL_EVENTS) {
					if (Boolean(configuredEvents[event]) !== events.includes(event)) {
						return false;
					}
				}

				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const squidId = this.getNodeParameter('squidId', undefined, {
					extractValue: true,
				}) as string;
				const events = this.getNodeParameter('events', []) as string[];

				const subscribedEvents: IDataObject = {};
				for (const event of ALL_EVENTS) {
					subscribedEvents[event] = events.includes(event);
				}

				await lobstrApiRequest.call(
					this,
					'POST',
					'/delivery',
					{
						webhook_fields: {
							url: webhookUrl,
							is_active: true,
							retry: true,
							events: subscribedEvents,
						},
					},
					{ squid: squidId },
				);

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const squidId = this.getNodeParameter('squidId', undefined, {
					extractValue: true,
				}) as string;

				const disabledEvents: IDataObject = {};
				for (const event of ALL_EVENTS) {
					disabledEvents[event] = false;
				}

				try {
					await lobstrApiRequest.call(
						this,
						'POST',
						'/delivery',
						{
							webhook_fields: {
								url: webhookUrl,
								is_active: false,
								retry: false,
								events: disabledEvents,
							},
						},
						{ squid: squidId },
					);
				} catch (error) {
					// Returning false tells n8n the webhook may need manual cleanup on the squid
					this.logger.error(
						`Lobstr Trigger: failed to deactivate webhook delivery on squid ${squidId}: ${(error as Error).message}`,
					);
					return false;
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData as IDataObject)],
		};
	}
}
