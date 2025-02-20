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
  return serializer.serialized;
}

const Serializer = /*@__PURE__*/ (function () {
  class Serializer {
    serialized = "";

    #context = new Map();
    #contents = new WeakMap();

    write(str: string) {
      this.serialized += str;
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

    objectEntries(type: string, entries: Iterable<[string, any]>) {
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
      this.write("'" + string + "'");
    }

    $symbol(symbol: symbol) {
      this.write(symbol.toString());
    }

    $bigint(bigint: bigint) {
      this.write(`${bigint}n`);
    }

    $object(object: any): void {
      const objString = Object.prototype.toString.call(object);

      let objType = "";
      const objectLength = objString.length;

      // '[object a]'.length === 10, the minimum
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        // '[object '.length === 8
        objType = objString.slice(8, objectLength - 1);
      }

      let objectNumber = null;

      if ((objectNumber = this.#context.get(object)) === undefined) {
        this.#context.set(object, this.#context.size);
      } else {
        const content = this.#contents.get(object);

        if (content) {
          return this.write(content);
        }

        return this.write(`#${objectNumber}`);
      }

      const currentLength = this.serialized.length;

      if (
        objType !== "Object" &&
        objType !== "Function" &&
        objType !== "AsyncFunction"
      ) {
        // @ts-expect-error
        const handler = this["$" + objType];
        if (handler) {
          handler.call(this, object);
        } else {
          if (typeof object?.entries === "function") {
            this.objectEntries(objType, object.entries());
          } else {
            throw new TypeError(`Cannot serialize ${objType}`);
          }
        }
      } else {
        const constructor = object.constructor.name;
        const objectName = constructor === "Object" ? "" : constructor;
        if (typeof object.toJSON === "function") {
          if (objectName) {
            this.write(objectName);
          }
          this.$object(object.toJSON());
        } else {
          this.objectEntries(objectName, Object.entries(object));
        }
      }

      this.#contents.set(object, this.serialized.slice(currentLength));
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
      return this.objectEntries("Map", map.entries());
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
