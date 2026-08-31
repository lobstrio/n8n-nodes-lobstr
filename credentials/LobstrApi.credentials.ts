import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class LobstrApi implements ICredentialType {
	name = 'lobstrApi';

	displayName = 'lobstr.io API';

	icon: Icon = { light: 'file:lobstr.svg', dark: 'file:lobstr.dark.svg' };

	documentationUrl = 'https://docs.lobstr.io/docs/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your lobstr.io API key. Find it in the <a href="https://app.lobstr.io/dashboard/api">API menu</a> of your dashboard.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.lobstr.io/v1',
			url: '/me',
		},
	};
}
