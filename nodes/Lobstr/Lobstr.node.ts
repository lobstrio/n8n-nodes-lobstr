import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { jsonParse, NodeApiError, NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

import {
	lobstrApiRequest,
	lobstrApiRequestAllItems,
	searchCrawlers,
	searchSquids,
} from './GenericFunctions';

export class Lobstr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'lobstr.io',
		name: 'lobstr',
		icon: { light: 'file:lobstr.svg', dark: 'file:lobstr.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Run lobstr.io cloud scrapers and collect structured data',
		defaults: {
			name: 'lobstr.io',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'lobstrApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Crawler',
						value: 'crawler',
					},
					{
						name: 'Result',
						value: 'result',
					},
					{
						name: 'Run',
						value: 'run',
					},
					{
						name: 'Squid',
						value: 'squid',
					},
					{
						name: 'Task',
						value: 'task',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'run',
			},

			// ----------------------------------
			//         crawler operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['crawler'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a crawler',
						action: 'Get a crawler',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List available crawlers',
						action: 'Get many crawlers',
					},
					{
						name: 'Get Parameters',
						value: 'getParameters',
						description: 'Get the accepted task and squid parameters of a crawler',
						action: 'Get crawler parameters',
					},
				],
				default: 'getMany',
			},

			// ----------------------------------
			//         result operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['result'],
					},
				},
				options: [
					{
						name: 'Get Results',
						value: 'getMany',
						description: 'Get scraped results of a squid or a run',
						action: 'Get results',
					},
				],
				default: 'getMany',
			},

			// ----------------------------------
			//         run operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['run'],
					},
				},
				options: [
					{
						name: 'Abort',
						value: 'abort',
						description: 'Abort a run in progress',
						action: 'Abort a run',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a run',
						action: 'Get a run',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List runs of a squid',
						action: 'Get many runs',
					},
					{
						name: 'Start',
						value: 'start',
						description: 'Start a new run for a squid',
						action: 'Start a run',
					},
					{
						name: 'Start and Get Results',
						value: 'startAndGetResults',
						description: 'Start a run, wait until it finishes, and return the scraped results',
						action: 'Start a run and get results',
					},
				],
				default: 'start',
			},

			// ----------------------------------
			//         squid operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['squid'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new squid for a crawler',
						action: 'Create a squid',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a squid',
						action: 'Delete a squid',
					},
					{
						name: 'Empty',
						value: 'empty',
						description: 'Delete all tasks of a squid',
						action: 'Empty a squid',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a squid',
						action: 'Get a squid',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List your squids',
						action: 'Get many squids',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update settings of a squid',
						action: 'Update a squid',
					},
				],
				default: 'create',
			},

			// ----------------------------------
			//         task operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['task'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Add tasks to a squid',
						action: 'Create tasks',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a task',
						action: 'Delete a task',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'List tasks of a squid',
						action: 'Get many tasks',
					},
				],
				default: 'create',
			},

			// ----------------------------------
			//         user operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						description: 'Get your remaining credits',
						action: 'Get your balance',
					},
					{
						name: 'Get Profile',
						value: 'getProfile',
						description: 'Get details of the authenticated user',
						action: 'Get your profile',
					},
				],
				default: 'getProfile',
			},

			// ----------------------------------
			//         shared fields
			// ----------------------------------
			{
				displayName: 'Crawler',
				name: 'crawlerId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The crawler to operate on',
				displayOptions: {
					show: {
						resource: ['crawler'],
						operation: ['get', 'getParameters'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchCrawlers',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 4734d096159ef05210e0e1677e8be823',
					},
				],
			},
			{
				displayName: 'Crawler',
				name: 'crawlerId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The crawler the new squid will use',
				displayOptions: {
					show: {
						resource: ['squid'],
						operation: ['create'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchCrawlers',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 4734d096159ef05210e0e1677e8be823',
					},
				],
			},
			{
				displayName: 'Squid',
				name: 'squidId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The squid to operate on',
				displayOptions: {
					show: {
						resource: ['squid'],
						operation: ['delete', 'empty', 'get', 'update'],
					},
				},
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
				displayName: 'Squid',
				name: 'squidId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The squid the tasks belong to',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['create', 'getMany'],
					},
				},
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
				displayName: 'Squid',
				name: 'squidId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The squid to run',
				displayOptions: {
					show: {
						resource: ['run'],
						operation: ['getMany', 'start', 'startAndGetResults'],
					},
				},
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
				displayName: 'Run ID',
				name: 'runId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. dd3473abe4cb41b683551e851edded94',
				description: 'The hash ID of the run',
				displayOptions: {
					show: {
						resource: ['run'],
						operation: ['abort', 'get'],
					},
				},
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. c5e29d2aba8b77cdc56391e7405302de',
				description: 'The hash ID of the task to delete',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['delete'],
					},
				},
			},

			// ----------------------------------
			//         result:getMany
			// ----------------------------------
			{
				displayName: 'Filter By',
				name: 'filterBy',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Run',
						value: 'run',
						description: 'Results of one specific run',
					},
					{
						name: 'Squid',
						value: 'squid',
						description: 'All results of a squid across runs',
					},
				],
				default: 'squid',
				displayOptions: {
					show: {
						resource: ['result'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Squid',
				name: 'squidId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The squid to get results from',
				displayOptions: {
					show: {
						resource: ['result'],
						operation: ['getMany'],
						filterBy: ['squid'],
					},
				},
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
				displayName: 'Run ID',
				name: 'runId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. dd3473abe4cb41b683551e851edded94',
				description: 'The hash ID of the run to get results from',
				displayOptions: {
					show: {
						resource: ['result'],
						operation: ['getMany'],
						filterBy: ['run'],
					},
				},
			},

			// ----------------------------------
			//         squid:create
			// ----------------------------------
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'e.g. My Google Maps Scraper',
				description: 'Custom name for the squid. If empty, a name is auto-generated.',
				displayOptions: {
					show: {
						resource: ['squid'],
						operation: ['create'],
					},
				},
			},

			// ----------------------------------
			//         squid:update
			// ----------------------------------
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['squid'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Concurrency',
						name: 'concurrency',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 1,
						description: 'Number of tasks processed in parallel',
					},
					{
						displayName: 'Custom Fields (JSON)',
						name: 'customFields',
						type: 'json',
						default: '{}',
						description:
							'Any additional squid settings as JSON, merged into the request body (e.g. schedule, export or notification settings)',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'New name of the squid',
					},
					{
						displayName: 'Params (JSON)',
						name: 'params',
						type: 'json',
						default: '{}',
						description:
							'Crawler-specific squid parameters as JSON. Use the crawler Get Parameters operation to discover valid keys.',
					},
					{
						displayName: 'Run to Completion',
						name: 'toComplete',
						type: 'boolean',
						default: false,
						description: 'Whether the squid stops after all tasks complete',
					},
				],
			},

			// ----------------------------------
			//         squid:getMany filters
			// ----------------------------------
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['squid'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Only return squids whose name contains this text',
					},
				],
			},

			// ----------------------------------
			//         task:create
			// ----------------------------------
			{
				displayName: 'Tasks (JSON)',
				name: 'tasks',
				type: 'json',
				required: true,
				default: '[\n  {\n    "url": "https://example.com"\n  }\n]',
				description:
					'Array of task objects to add. Accepted keys depend on the crawler — use the crawler Get Parameters operation to discover them.',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['create'],
					},
				},
			},

			// ----------------------------------
			//         run:startAndGetResults
			// ----------------------------------
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['run'],
						operation: ['startAndGetResults'],
					},
				},
				options: [
					{
						displayName: 'Max Results',
						name: 'maxResults',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description: 'Maximum number of results to return once the run finishes. Set to 0 to return all results.',
					},
					{
						displayName: 'Poll Interval (Seconds)',
						name: 'pollInterval',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 10,
						description: 'How often to check whether the run has finished',
					},
					{
						displayName: 'Wait Timeout (Seconds)',
						name: 'waitTimeout',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 600,
						description: 'Maximum time to wait for the run to finish before the node fails',
					},
				],
			},

			// ----------------------------------
			//         shared: returnAll / limit
			// ----------------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['crawler', 'result', 'run', 'squid', 'task'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['crawler', 'result', 'run', 'squid', 'task'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
			},
		],
	};

	methods = {
		listSearch: {
			searchCrawlers,
			searchSquids,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] | undefined;

				if (resource === 'crawler') {
					if (operation === 'get') {
						const crawlerId = this.getNodeParameter('crawlerId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(this, 'GET', `/crawlers/${crawlerId}`);
					} else if (operation === 'getParameters') {
						const crawlerId = this.getNodeParameter('crawlerId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(
							this,
							'GET',
							`/crawlers/${crawlerId}/params`,
						);
					} else if (operation === 'getMany') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const maxItems = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/crawlers',
							{},
							{},
							maxItems,
						);
					}
				} else if (resource === 'squid') {
					if (operation === 'create') {
						const crawlerId = this.getNodeParameter('crawlerId', i, undefined, {
							extractValue: true,
						}) as string;
						const name = this.getNodeParameter('name', i) as string;
						const body: IDataObject = { crawler: crawlerId };
						if (name) {
							body.name = name;
						}
						responseData = await lobstrApiRequest.call(this, 'POST', '/squids', body);
					} else if (operation === 'get') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(this, 'GET', `/squids/${squidId}`);
					} else if (operation === 'getMany') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const maxItems = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (filters.name) {
							qs.name = filters.name;
						}
						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/squids',
							{},
							qs,
							maxItems,
						);
					} else if (operation === 'update') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const body: IDataObject = {};
						if (updateFields.name) {
							body.name = updateFields.name;
						}
						if (updateFields.concurrency !== undefined) {
							body.concurrency = updateFields.concurrency;
						}
						if (updateFields.toComplete !== undefined) {
							body.to_complete = updateFields.toComplete;
						}
						if (updateFields.params) {
							body.params = jsonParse<IDataObject>(updateFields.params as string, {
								errorMessage: 'Params must be valid JSON',
							});
						}
						if (updateFields.customFields) {
							const custom = jsonParse<IDataObject>(updateFields.customFields as string, {
								errorMessage: 'Custom Fields must be valid JSON',
							});
							Object.assign(body, custom);
						}
						responseData = await lobstrApiRequest.call(this, 'POST', `/squids/${squidId}`, body);
					} else if (operation === 'delete') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(this, 'DELETE', `/squids/${squidId}`);
						responseData = responseData ?? { success: true };
					} else if (operation === 'empty') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(this, 'POST', `/squids/${squidId}/empty`);
						responseData = responseData ?? { success: true };
					}
				} else if (resource === 'task') {
					if (operation === 'create') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						const tasksJson = this.getNodeParameter('tasks', i) as string;
						const parsed = jsonParse<IDataObject | IDataObject[]>(tasksJson, {
							errorMessage: 'Tasks must be valid JSON',
						});
						const tasks = Array.isArray(parsed) ? parsed : [parsed];
						responseData = await lobstrApiRequest.call(this, 'POST', '/tasks', {
							squid: squidId,
							tasks,
						});
					} else if (operation === 'getMany') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const maxItems = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/tasks',
							{},
							{ squid: squidId },
							maxItems,
						);
					} else if (operation === 'delete') {
						const taskId = this.getNodeParameter('taskId', i) as string;
						responseData = await lobstrApiRequest.call(this, 'DELETE', `/tasks/${taskId}`);
						responseData = responseData ?? { success: true };
					}
				} else if (resource === 'run') {
					if (operation === 'start') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						responseData = await lobstrApiRequest.call(this, 'POST', '/runs', { squid: squidId });
					} else if (operation === 'startAndGetResults') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						const options = this.getNodeParameter('options', i, {}) as IDataObject;
						const waitTimeout = (options.waitTimeout as number) ?? 600;
						const pollInterval = (options.pollInterval as number) ?? 10;
						const maxResults = (options.maxResults as number) ?? 0;

						const run = (await lobstrApiRequest.call(this, 'POST', '/runs', {
							squid: squidId,
						})) as IDataObject;
						const runId = run.id as string;

						// terminal statuses per the lobstr.io run lifecycle; is_done is not
						// always present on the get-run response, so check status too
						const terminalStatuses = ['aborted', 'done', 'error'];
						const isFinished = (r: IDataObject) =>
							r.is_done === true || terminalStatuses.includes(String(r.status).toLowerCase());

						const startedAt = Date.now();
						let currentRun = run;
						while (!isFinished(currentRun)) {
							if ((Date.now() - startedAt) / 1000 > waitTimeout) {
								throw new NodeOperationError(
									this.getNode(),
									`Run ${runId} did not finish within ${waitTimeout} seconds. Increase the Wait Timeout option or use the Lobstr Trigger node for long runs.`,
									{ itemIndex: i },
								);
							}
							await sleep(pollInterval * 1000);
							currentRun = (await lobstrApiRequest.call(
								this,
								'GET',
								`/runs/${runId}`,
							)) as IDataObject;
						}

						if (String(currentRun.status).toLowerCase() === 'error') {
							throw new NodeOperationError(
								this.getNode(),
								`Run ${runId} finished with status "error"`,
								{ itemIndex: i },
							);
						}

						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/results',
							{},
							{ run: runId },
							maxResults > 0 ? maxResults : undefined,
						);
					} else if (operation === 'get') {
						const runId = this.getNodeParameter('runId', i) as string;
						responseData = await lobstrApiRequest.call(this, 'GET', `/runs/${runId}`);
					} else if (operation === 'getMany') {
						const squidId = this.getNodeParameter('squidId', i, undefined, {
							extractValue: true,
						}) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const maxItems = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/runs',
							{},
							{ squid: squidId },
							maxItems,
						);
					} else if (operation === 'abort') {
						const runId = this.getNodeParameter('runId', i) as string;
						responseData = await lobstrApiRequest.call(this, 'POST', `/runs/${runId}/abort`);
						responseData = responseData ?? { success: true };
					}
				} else if (resource === 'result') {
					if (operation === 'getMany') {
						const filterBy = this.getNodeParameter('filterBy', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const maxItems = returnAll ? undefined : (this.getNodeParameter('limit', i) as number);
						const qs: IDataObject = {};
						if (filterBy === 'squid') {
							qs.squid = this.getNodeParameter('squidId', i, undefined, {
								extractValue: true,
							}) as string;
						} else {
							qs.run = this.getNodeParameter('runId', i) as string;
						}
						responseData = await lobstrApiRequestAllItems.call(
							this,
							'GET',
							'/results',
							{},
							qs,
							maxItems,
						);
					}
				} else if (resource === 'user') {
					if (operation === 'getProfile') {
						responseData = await lobstrApiRequest.call(this, 'GET', '/me');
					} else if (operation === 'getBalance') {
						responseData = await lobstrApiRequest.call(this, 'GET', '/user/balance');
					}
				}

				if (responseData === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex: i },
					);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				const nodeError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeApiError(this.getNode(), error as JsonObject);
				throw nodeError;
			}
		}

		return [returnData];
	}
}
