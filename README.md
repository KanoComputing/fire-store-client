# Fire Store Tools

A simple NodeJS client that uploads APKs to the Amazon Fire Store.

Documentation for the API: https://s3-us-west-1.amazonaws.com/devportal-reference-docs/appsubapi/swagger-en/index.html

## Usage

```typescript
import { FireStoreClient } from 'fire-store-client';

const clientId = '...';
const clientSecret = '...'
const appId = '...';
const apkFilePath = '...';


async function main() {
    const client = new FireStoreClient(clientId, clientSecret);
    const res = await client.uploadApk(appId, apkFilePath);
}
```
