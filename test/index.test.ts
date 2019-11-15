import tap from 'tap';
import { RequestInfo, RequestInit } from 'node-fetch';
import { FireStoreClient } from '../src';
import { ReadStream } from 'fs';

tap.test(async t => {
    const client = new FireStoreClient('test_id', 'test_secret');
    const originalFetch = client.fetch;

    t.afterEach(t => {
        client.fetch = originalFetch;
    });

    await t.test('Authenticate', async t => {
        client.fetch = (url: RequestInfo, init?: RequestInit) => {
            t.type(init.body, URLSearchParams);

            const body = init.body as URLSearchParams;
            t.equal(body.get('client_id'), 'test_id');
            t.equal(body.get('client_secret'), 'test_secret');
            t.equal(body.get('grant_type'), 'client_credentials');
            t.equal(body.get('scope'), 'appstore::apps:readwrite');

            t.equal(url, 'https://api.amazon.com/auth/o2/token');
            t.equal((init.headers as any)['Content-Type'], 'application/x-www-form-urlencoded');

            return new Promise(resolve => resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve({ access_token: 'test_token', expires_in: 1234 })
            }));
        };

        await client.authenticate();

        t.equal(client.token, 'test_token');
        t.ok(Math.abs(client.expiry - Date.now() / 1000 - 1234) < 10);

        t.done();
    });

    await t.test('Upload apk', async t => {
        let editCalled = false;
        let uploadCalled = false;

        client.fetch = (url: RequestInfo, init?: RequestInit) => {
            let res;

            t.equal((init.headers as any).Authorization, 'Bearer test_token');

            if ((url as string).match(/upload$/)) {
                t.type(init.body, ReadStream);

                t.ok((url as string).match(/test_edit_id/));
                t.equal((init.headers as any)['Content-Type'], 'application/vnd.android.package-archive');
                uploadCalled = true;

                res = { test: 'upload' };
            } else {
                t.notOk(init.body);
                editCalled = true;
                res = { id: 'test_edit_id' };
            }

            return new Promise(resolve => resolve({
                status: 200,
                ok: true,
                json: () => Promise.resolve(res),
            }));
        };

        const res = await client.uploadApk('test.app.id', 'src/index.ts');
        t.equal(res.test, 'upload');
        t.ok(editCalled);
        t.ok(uploadCalled);

        t.done();
    });

});
