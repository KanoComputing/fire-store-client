# Fire Store Tools

A simple NodeJS client that uploads APKs to the Amazon Fire Store.

## Usage

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
