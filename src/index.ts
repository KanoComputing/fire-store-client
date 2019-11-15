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

    log(message: string) {}

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
                'Content-Type': 'application/x-www-form-urlencoded',
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
            console.log('Authenticating...');
            await this.authenticate();
        }

        this.log('Looking for an open edit...');
        let editRes = await this.fetch(`${this.BASE_URL}/v1/applications/${appId}/edits`, {
            headers: {
                Authorization: `Bearer ${this.token}`
            }
        });

        if (!editRes.ok) {
            this.log('Opening a new edit...');
            editRes = await this.fetch(`${this.BASE_URL}/v1/applications/${appId}/edits`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });
        }

        if (!editRes.ok) {
            this.log(await editRes.json());
            throw new Error('Failed to open an edit');
        }


        const { id: editId } = await editRes.json();

        this.log('Starting upload...');
        const uploadRes = await this.fetch(`${this.BASE_URL}/v1/applications/${appId}/edits/${editId}/apks/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/vnd.android.package-archive',
            },
            body: createReadStream(apkPath),
        });

        if (!uploadRes.ok) {
            throw new Error('Uploading APK failed');
        }

        this.log('Upload complete.');
        return await uploadRes.json();
    }
}
