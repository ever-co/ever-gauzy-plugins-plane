/// <reference types="jest" />
import 'reflect-metadata';
import * as http from 'http';
import type { AddressInfo } from 'net';
import express from 'express';
import { of } from 'rxjs';
import { ApiFetchService } from './modules/api-fetch/api-fetch.service';
import { clientAddressHeaders, RequestContextService } from './request-context';

/** An incoming request as the proxy receives it: its headers and the address of its socket. */
const incoming = (headers: http.IncomingHttpHeaders, remoteAddress?: string) =>
	({ headers, socket: { remoteAddress } }) as unknown as http.IncomingMessage;

/**
 * The proxy mounted inside the Gauzy API calls it over loopback, so Gauzy saw 127.0.0.1 as the client of
 * every proxied call: one rate-limit and sign-in-attempt bucket for every pm.gauzy.co user. The proxy now
 * passes on the headers Gauzy reads the client's address from.
 */
describe('clientAddressHeaders', () => {
	it('passes X-Forwarded-For and CF-Connecting-IP on unchanged', () => {
		expect(
			clientAddressHeaders(
				incoming(
					{
						'x-forwarded-for': '203.0.113.7, 10.0.0.9',
						'cf-connecting-ip': '203.0.113.7'
					},
					'10.0.0.5'
				)
			)
		).toEqual({
			'X-Forwarded-For': '203.0.113.7, 10.0.0.9',
			'CF-Connecting-IP': '203.0.113.7'
		});
	});

	it('names the socket address when the request came without X-Forwarded-For', () => {
		expect(clientAddressHeaders(incoming({}, '198.51.100.4'))).toEqual({
			'X-Forwarded-For': '198.51.100.4'
		});
	});

	it('joins a repeated X-Forwarded-For, and sends nothing it does not know', () => {
		expect(
			clientAddressHeaders(
				incoming({ 'x-forwarded-for': ['1.1.1.1', '2.2.2.2'] })
			)
		).toEqual({
			'X-Forwarded-For': '1.1.1.1, 2.2.2.2'
		});
		expect(clientAddressHeaders(incoming({}))).toEqual({});
	});

	it('passes a signed X-Ever-Client-IP set on as received, for Gauzy to verify', () => {
		const signed = {
			'x-ever-client-ip': '203.0.113.7',
			'x-ever-client-ip-timestamp': '1793120000',
			'x-ever-client-ip-signature': 'a'.repeat(64)
		};

		expect(clientAddressHeaders(incoming(signed, '10.0.0.9'))).toEqual({
			'X-Forwarded-For': '10.0.0.9',
			'X-Ever-Client-IP': '203.0.113.7',
			'X-Ever-Client-IP-Timestamp': '1793120000',
			'X-Ever-Client-IP-Signature': 'a'.repeat(64)
		});
		// A repeated one is not a single value; Gauzy would refuse it, so it is not passed on either.
		expect(
			clientAddressHeaders(
				incoming(
					{ 'x-ever-client-ip': ['1.1.1.1', '2.2.2.2'] as any },
					'10.0.0.9'
				)
			)
		).toEqual({ 'X-Forwarded-For': '10.0.0.9' });
	});
});

describe('ApiFetchService — client address on calls to Gauzy', () => {
	function service() {
		const get = jest.fn(() => of({ data: {} }));
		return { fetcher: new ApiFetchService({ get } as any), get };
	}

	const sentHeaders = (get: jest.Mock) =>
		(get.mock.calls[0] as any[])[1].headers;

	it('sends the current request’s client address with every call', async () => {
		const { fetcher, get } = service();
		const req = incoming(
			{
				'x-forwarded-for': '203.0.113.7',
				'cf-connecting-ip': '203.0.113.7'
			},
			'10.0.0.9'
		);

		await RequestContextService.store.run(
			RequestContextService.createContext(req),
			() =>
				fetcher.apiFetch({
					method: 'GET',
					path: '/user/me',
					bearer_token: 't',
					tenantId: 'tenant'
				} as any)
		);

		expect(sentHeaders(get)).toMatchObject({
			'X-Forwarded-For': '203.0.113.7',
			'CF-Connecting-IP': '203.0.113.7',
			Authorization: 'Bearer t',
			'Tenant-Id': 'tenant'
		});
	});

	it('sends none outside a request, or for a context made without one (standalone mode)', async () => {
		const { fetcher, get } = service();

		await RequestContextService.store.run(
			RequestContextService.createContext(),
			() =>
				fetcher.apiFetch({
					method: 'GET',
					path: '/user/me',
					bearer_token: 't',
					tenantId: 'tenant'
				} as any)
		);

		expect(sentHeaders(get)).not.toHaveProperty('X-Forwarded-For');
		expect(sentHeaders(get)).not.toHaveProperty('CF-Connecting-IP');
	});
});

/**
 * Gauzy reads the client as Express `req.ip` with `trust proxy` = 1 hop by default. A loopback call that
 * carries the forwarded headers must resolve to the same client as the browser's own request did.
 */
describe('Gauzy resolves the same client for the proxied call (Express, trust proxy = 1)', () => {
	let server: http.Server;
	let port: number;

	beforeAll(async () => {
		const app = express();
		app.set('trust proxy', 1);
		app.get('/ip', (req, res) => {
			res.json({ ip: req.ip });
		});
		server = http.createServer(app);
		await new Promise<void>((resolve) =>
			server.listen(0, '127.0.0.1', resolve)
		);
		port = (server.address() as AddressInfo).port;
	});

	afterAll(() => new Promise((resolve) => server.close(resolve)));

	const ipSeenBy = (headers: Record<string, string>) =>
		new Promise<string>((resolve, reject) => {
			http.get(
				{ host: '127.0.0.1', port, path: '/ip', headers },
				(res) => {
					let body = '';
					res.on('data', (chunk) => (body += chunk));
					res.on('end', () => resolve(JSON.parse(body).ip));
				}
			).on('error', reject);
		});

	it.each([
		// [what the browser's request carried, its socket address, the client Gauzy resolves for it]
		[
			'a request through the ingress',
			{ 'x-forwarded-for': '203.0.113.7' },
			'10.0.0.9',
			'203.0.113.7'
		],
		[
			'a client-written entry ahead of the ingress one',
			{ 'x-forwarded-for': '6.6.6.6, 203.0.113.7' },
			'10.0.0.9',
			'203.0.113.7'
		],
		['a request straight to the API', {}, '198.51.100.4', '198.51.100.4']
	])('%s', async (_label, headers, socketAddress, client) => {
		expect(
			await ipSeenBy(
				clientAddressHeaders(incoming(headers, socketAddress))
			)
		).toBe(client);
	});

	it('resolves 127.0.0.1 without the headers (the defect, as a control)', async () => {
		expect(await ipSeenBy({})).toBe('127.0.0.1');
	});
});
