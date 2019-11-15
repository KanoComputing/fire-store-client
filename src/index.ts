import fetch, { RequestInit, RequestInfo, Response } from 'node-fetch';
import URLSearchParams from 'url-search-params';
import { createReadStream } from 'fs';

export class FireStoreClient {
    private clientId: string;
    private clientSecret: string;
    private grantType = 'client_credentials';
    private scope = 'appstore::apps:readwrite';

    private AUTH_URL = 'https://api.amazon.com/auth/o2/token';
    private BASE_URL = 'https://developer.amazon.com/api/appstore';

    token: string;
    expiry: number;

    /* Testing */
    fetch: (url: RequestInfo, init?: RequestInit) => Promise<any> = fetch;

    constructor(clientId: string, clientSecret: string, grantType?: string, scope?: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        if (grantType) {
            this.grantType = grantType;
        }

        if (scope) {
            this.scope = grantType;
        }
    }

    async authenticate() {
        const body = new URLSearchParams();
        body.set('client_id', this.clientId);
        body.set('client_secret', this.clientSecret);
        body.set('grant_type', this.grantType);
        body.set('scope', this.scope);

        const res = await this.fetch(this.AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'pplication/x-www-form-urlencoded',
            },
            body,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(`Authentication failed: ${data.error_description}`);
        }

        this.token = data.access_token;
        this.expiry = Math.floor(Date.now() / 1000) + data.expires_in;
    }

    async uploadApk(appId: string, apkPath: string) {
        if (!this.token || this.expiry > Date.now()) {
            await this.authenticate();
        }

        const editRes = await this.fetch(`${this.BASE_URL}/v1/applications/${appId}/edits`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });

        if (!editRes.ok) {
            throw new Error('Failed to create an edit');
        }

        const { id: editId } = await editRes.json();

        const uploadRes = await this.fetch(`${this.BASE_URL}/v1/applications/${appId}/edits/${editId}/apks/upload`, {
            headers: {
                method: 'POST',
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/vnd.android.package-archive',
            },
            body: createReadStream(apkPath),
        });

        if (!uploadRes.ok) {
            throw new Error('Uploading APK failed');
        }

        return await uploadRes.json();
    }
}
