# #️ ohash

<!-- automd:badges bundlephobia codecov -->

[![npm version](https://img.shields.io/npm/v/ohash)](https://npmjs.com/package/ohash)
[![npm downloads](https://img.shields.io/npm/dm/ohash)](https://npm.chart.dev/ohash)
[![bundle size](https://img.shields.io/bundlephobia/minzip/ohash)](https://bundlephobia.com/package/ohash)
[![codecov](https://img.shields.io/codecov/c/gh/unjs/ohash)](https://codecov.io/gh/unjs/ohash)

<!-- /automd -->

Simple data [hashing](https://en.wikipedia.org/wiki/Hash_function) utils.

> [!NOTE]
> You are on active v2 development branch. Check [v1](https://github.com/unjs/ohash/tree/v1) for ohash v1 docs.

## Usage

Install [`ohash`](https://www.npmjs.com/package/ohash):

```sh
# ✨ Auto-detect (npm, yarn, pnpm, bun or deno)
npx nypm i ohash
```

**Import:**

```js
// ESM import
import { hash, serialize, digest } from "ohash";
import { isEqual, diff } from "ohash/utils";

// Dynamic import
const { hash, serialize, digest } = await import("ohash");
const { isEqual, diff } = await import("ohash/utils");
```

<details>
  <summary>Import from CDN</summary>

```js
import { hash, serialize, digest } from "https://esm.sh/ohash";
import { isEqual, diff } from "https://esm.sh/ohash/utils";

// Dynamic import
const { hash, serialize, digest } = await import("https://esm.sh/ohash");
const { isEqual, diff } = await import("https://esm.sh/ohash/utils");
```

</details>

## `hash(input, options?)`

Hashes any JS value into a string.

The input is first [serialized](#serializeinput-options) into a string like `object:1:string:3:foo:string:3:bar,`, then it is [hashed](#digeststr) and truncated to a length of `10`.

```js
import { hash } from "ohash";

// "dZbtA7f0lK"
console.log(hash({ foo: "bar" }));
```

## `serialize(input, options?)`

Serializes any input value into a string for hashing.

```js
import { serialize } from "ohash";

// "object:1:string:3:foo:string:3:bar,"
console.log(serialize({ foo: "bar" }));
```

## `digest(str)`

Hashes a string using the [SHA-256](https://en.wikipedia.org/wiki/SHA-2) algorithm and encodes it in [Base64URL](https://base64.guru/standards/base64url) format.

```ts
import { digest } from "ohash";

// "pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4"
console.log(digest("Hello World"));
```

## `isEqual(obj1, obj2, options?)`

Compare two objects using `===` and then fallbacks to compare based on their [serialized](#serializeinput-options) values.

```js
import { isEqual } from "ohash/utils";

// true
console.log(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 }));
```

## `diff(obj1, obj2, options?)`

Compare two objects with nested [serialization](#serializeinput-options). Returns an array of changes.

The returned value is an array of diff entries with `$key`, `$hash`, `$value`, and `$props`. When logging, a string version of the changelog is displayed.

```js
import { diff } from "ohash/utils";

const createObject = () => ({
  foo: "bar",
  nested: {
    y: 123,
    bar: {
      baz: "123",
    },
  },
});

const obj1 = createObject();
const obj2 = createObject();

obj2.nested.x = 123;
delete obj2.nested.y;
obj2.nested.bar.baz = 123;

const diff = diff(obj1, obj2);

// [-] Removed nested.y
// [~] Changed nested.bar.baz from "123" to 123
// [+] Added   nested.x
console.log(diff(obj1, obj2));
```

## Contribute

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).

Based on [puleos/object-hash](https://github.com/puleos/object-hash) by [Scott Puleo](https://github.com/puleos/), and [brix/crypto-js](https://github.com/brix/crypto-js).
