# Backend: `zxing-wasm` dependency (HumanID QR preview)

## Wrong command (do not use)

```bash
npm install zxing-wasm/reader
```

npm interprets `zxing-wasm/reader` as a **GitHub shorthand** (`github.com/zxing-wasm/reader`), which does not exist.

## Correct command

From the **verifik-backend** root:

```bash
npm install zxing-wasm --save
```

That installs the [`zxing-wasm`](https://www.npmjs.com/package/zxing-wasm) package. The code loads the reader with:

```js
require("zxing-wasm/reader");
```

…which is a **subpath export** of the installed package, not a separate npm package.

## Docker / CI

Add this to `package.json` `dependencies` so `npm ci` installs it:

```json
"zxing-wasm": "^2.2.4"
```

Then rebuild the image.

See also: `verifik-backend/Repositories/ZelfProof/ZELF_QR_INSTALL.md` in the backend repo.
