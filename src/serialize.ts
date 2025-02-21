// Originally based on https://github.com/puleos/object-hash v3.0.0 (MIT)

/**
 * Serializes any input value into a string for hashing.
 *
 * This method uses best efforts to generate stable serialized values.
 * However, it is not designed for security purposes.
 * Keep in mind that there is always a chance of intentional collisions caused by user input.
 *
 * @param input any value to serialize
 * @return {string} serialized string value
 */
export function serialize(input: any): string {
  if (typeof input === "string") {
    return `'${input}'`;
  }
  const serializer = new Serializer();
  serializer.dispatch(input);
  return serializer.getSerialized();
}

const Serializer = /*@__PURE__*/ (function () {
  class Serializer {
    #buffer = "";
    #serialized = "";
    #contents = new Map();

    getSerialized() {
      this.commit();

      return this.#serialized;
    }

    write(str: string) {
      this.#buffer += str;
    }

    commit() {
      this.#serialized += this.#buffer;
      this.#buffer = "";
    }

    dispatch(value: any): string | void {
      const type = value === null ? "null" : typeof value;
      // @ts-ignore
      const handler = this["$" + type];
      return handler.call(this, value);
    }

    compare(a: any, b: any): number {
      if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
      }
      return serialize(a).localeCompare(serialize(b));
    }

    writeObject(object: any): void {
      const objString = Object.prototype.toString.call(object);

      let objType: string;

      // '[object a]'.length === 10, the minimum
      if (objString.length < 10) {
        objType = `unknown:[${objString}]`;
      } else {
        // '[object '.length === 8
        objType = objString.slice(8, -1);
      }

      if (
        objType !== "Object" &&
        objType !== "Function" &&
        objType !== "AsyncFunction"
      ) {
        // @ts-expect-error
        const handler = this["$" + objType];
        if (handler) {
          return handler.call(this, object);
        }

        if (typeof object?.entries === "function") {
          return this.writeObjectEntries(objType, object.entries());
        }

        throw new TypeError(`Cannot serialize ${objType}`);
      }

      const constructor = object.constructor.name;

      objType = constructor === "Object" ? "" : constructor;

      if (typeof object.toJSON === "function") {
        this.write(objType);

        return this.$object(object.toJSON());
      }

      this.writeObjectEntries(objType, Object.entries(object));
    }

    writeObjectEntries(type: string, entries: Iterable<[string, any]>): void {
      const sortedEntries = Array.from(entries).sort((a, b) =>
        this.compare(a[0], b[0]),
      );
      this.write(`${type}{`);
      for (let i = 0; i < sortedEntries.length; i++) {
        const [key, value] = sortedEntries[i];
        this.write(`${key}:`);
        this.dispatch(value);
        if (i < sortedEntries.length - 1) {
          this.write(",");
        }
      }
      this.write("}");
    }

    $string(string: any) {
      this.write(`'${string}'`);
    }

    $symbol(symbol: symbol) {
      this.write(symbol.toString());
    }

    $bigint(bigint: bigint) {
      this.write(`${bigint}n`);
    }

    $object(object: any): void {
      if (this.#contents.has(object)) {
        return this.write(this.#contents.get(object));
      }

      this.#contents.set(object, `#${this.#contents.size}`);
      this.commit();
      this.writeObject(object);
      this.#contents.set(object, this.#buffer);
    }

    $function(fn: any) {
      const fnStr = Function.prototype.toString.call(fn);
      if (
        fnStr.slice(-15 /* "[native code] }".length */) === "[native code] }"
      ) {
        return this.write(`${fn.name || ""}()[native]`);
      }
      this.write(`${fn.name}(${fn.length})${fnStr.replace(/\s*\n\s*/g, "")}`);
    }

    $Array(arr: any[]): string | void {
      this.write("[");
      for (let i = 0; i < arr.length; i++) {
        this.dispatch(arr[i]);
        if (i < arr.length - 1) {
          this.write(",");
        }
      }
      this.write("]");
    }

    $Date(date: any) {
      return this.write(`Date(${date.toJSON()})`);
    }

    $ArrayBuffer(arr: ArrayBuffer) {
      this.write(
        `ArrayBuffer[${Array.prototype.slice.call(new Uint8Array(arr)).join(",")}]`,
      );
    }

    $Set(set: Set<any>) {
      this.write(`Set`);
      this.$Array(Array.from(set).sort((a, b) => this.compare(a, b)));
    }

    $Map(map: Map<any, any>) {
      return this.writeObjectEntries("Map", map.entries());
    }
  }

  for (const type of ["boolean", "number", "null", "undefined"] as const) {
    // @ts-ignore
    Serializer.prototype["$" + type] = function (val: any) {
      return this.write(val);
    };
  }

  for (const type of ["Error", "RegExp", "URL"] as const) {
    // @ts-ignore
    Serializer.prototype["$" + type] = function (val: any) {
      return this.write(`${type}(${val.toString()})`);
    };
  }

  for (const type of [
    "Uint8Array",
    "Uint8ClampedArray",
    "Unt8Array",
    "Uint16Array",
    "Unt16Array",
    "Uint32Array",
    "Unt32Array",
    "Float32Array",
    "Float64Array",
  ] as const) {
    // @ts-ignore
    Serializer.prototype["$" + type] = function (arr: ArrayBufferLike) {
      this.write(`${type}[${Array.prototype.slice.call(arr).join(",")}]`);
    };
  }
  return Serializer;
})();
