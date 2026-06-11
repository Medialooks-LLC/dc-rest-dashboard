# Direct Convert JS Client

Small dependency-free JavaScript wrapper for the Medialooks Direct Convert REST API.

```js
import { DirectConvertClient } from '@local/directconvert-js-client';

const directConvert = new DirectConvertClient({
  baseUrl: 'http://localhost:9753/api/',
  token: 'your-token'
});

const channels = await directConvert.getChannels();
await directConvert.startChannelConversion(0);
```

All methods accept an optional final `options` object with `signal` and `headers`.
