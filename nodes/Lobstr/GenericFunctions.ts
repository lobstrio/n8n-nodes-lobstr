import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api.lobstr.io/v1';

export async function lobstrApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}
	if (Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'lobstrApi', options);
	} catch (error) {
		// lobstr.io reports errors as { errors: { message, type, code } } — surface the real
		// message. httpRequestWithAuthentication wraps failures in its own NodeApiError with
		// the original AxiosError in `cause`. That class comes from n8n's copy of
		// n8n-workflow, not this package's, so instanceof checks are unreliable — duck-type
		// the shape and update the error in place instead.
		let responseBody = error?.context?.data ?? error?.cause?.response?.data ?? error?.response?.data;
		if (typeof responseBody === 'string') {
			try {
				responseBody = JSON.parse(responseBody);
			} catch {
				responseBody = undefined;
			}
		}
		const apiError = (responseBody as IDataObject | undefined)?.errors as IDataObject | undefined;
		if (apiError?.message && error instanceof Error) {
			const message = String(apiError.message);
			const description = apiError.type
				? `lobstr.io error type: ${apiError.type as string}`
				: undefined;
			// Mutate in place: when `error` is already a NodeApiError, the constructor below
			// returns it unchanged and discards the overrides. The overrides only take effect
			// on the fallback path where the error actually gets wrapped.
			error.message = message;
			if (description) {
				(error as unknown as IDataObject).description = description;
			}
			throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
				message,
				description,
			});
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function lobstrApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	maxItems?: number,
): Promise<IDataObject[]> {
	const items: IDataObject[] = [];
	const limit = 100;
	let page = 1;
	let totalPages = 1;

	do {
		const response = (await lobstrApiRequest.call(this, method, endpoint, body, {
			...qs,
			page,
			limit,
		})) as IDataObject;

		const data = (response.data as IDataObject[]) ?? [];
		items.push(...data);

		totalPages = (response.total_pages as number) ?? 1;
		page += 1;

		if (maxItems !== undefined && items.length >= maxItems) {
			return items.slice(0, maxItems);
		}
		if (data.length === 0) {
			break;
		}
	} while (page <= totalPages);

	return items;
}

export async function searchCrawlers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const crawlers = await lobstrApiRequestAllItems.call(this, 'GET', '/crawlers');

	let results: INodeListSearchItems[] = crawlers.map((crawler) => ({
		name: String(crawler.name ?? crawler.id),
		value: String(crawler.id),
	}));

	if (filter) {
		const search = filter.toLowerCase();
		results = results.filter((item) => item.name.toLowerCase().includes(search));
	}

	results.sort((a, b) => a.name.localeCompare(b.name));

	return { results };
}

export async function searchSquids(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const qs: IDataObject = {};
	if (filter) {
		qs.name = filter;
	}

	const squids = await lobstrApiRequestAllItems.call(this, 'GET', '/squids', {}, qs);

	const results: INodeListSearchItems[] = squids.map((squid) => ({
		name: String(squid.name ?? squid.id),
		value: String(squid.id),
	}));

	return { results };
}
