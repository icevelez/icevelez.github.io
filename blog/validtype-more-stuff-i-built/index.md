![Validator](./assets/validtype.webp)

I had a conversation with a friend about removing 3rd party dependencies in our node projects and I showed him my Svelte project that only had Svelte with manual type validation and pointed out the redundancy I had to do to achieve type safety and I agreed with him. It was a hassle repeating all the `if` and `throw` when setting a variable wrong and I told him it's the compromise I had to make, if I wanted to have a minimal dependency project

but ultimately he's right, it is easier to use a validation library like [Zod](https://www.npmjs.com/package/zod) and [Valibot](https://www.npmjs.com/package/valibot) if you want to get the job done but knowing myself, I thought of "What if I made my own?"

# Introducing, Validtype

At that evening I started to make a prototype class that accepts a callback function and use that to validate an input data and landed on this piece of code

```js
/**
* @template {any} T
*/
class ValidType {

    /**
    * array of callbacks to validate custom type
    * @type {Set<(_:T) => void>}
    */
    #callbacks = new Set();
    #is_optional = false;

    /**
    * @param {((_:T) => void)[]} args
    */
    #addCallbacks = (...args) => {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] !== "function") throw new TypeError(`args[${i}] is not a function`);
            this.#callbacks.add(args[i])
        }
    };

    /**
    * @param  {((_:T) => void)[]} args
    */
    constructor(...args) {
        this.#addCallbacks(...args);
    }

    /**
    * return void if passed, throw an error if not
    * @param {(input:T) => void} callback
    */
    pipe(callback) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        this.#callbacks.add(callback);
        return this;
    }

    optional() {
        this.#is_optional = true;
        return this;
    }

    /**
    * @param {T} input
    */
    validate(input) {
        if (this.#is_optional && (input === null || input === undefined)) return;

        try {
            for (const callback of this.#callbacks) callback(input);
        } catch (error) {
            return `${error.toString()}`;
        }
    }

    /**
    * Access internal function for whatever purpose you see fit.
    * I used it to make it easier to implement `union()`
    */
    raw() {
        return {
            addCallbacks: this.#addCallbacks,
            callbacks: this.#callbacks,
            is_optional: this.#is_optional,
        }
    }
}
```

Using that base class we can use it to generate specific validators like `number()` and `string()` similar to Valibot and that already covers 80% of what I need to do.

```js
/**
* @type {() => ValidType<number>}
*/
export const number = () => new ValidType((i) => {
    if (!isNaN(i) && (i >= 0 || i <= 0) && typeof i === "number") return;
    throw new TypeError("not a number");
});

/**
* @type {() => ValidType<string>}
*/
export const string = () => new ValidType((i) => {
    if ((i || i === "") && typeof i === "string") return;
    throw new TypeError("not a string");
});
```

```js
// Class code above...

    set value(data) {
        if (!data) return;

        const error = type.validate(data)
        if (error) throw new TypeError(error);

        this.#value = data;
    }
}

const type = object({
    id: number(),
    name: string(),
    total_quantity: number(),
    category: array(object({
        id: number(),
        name: string(),
    })),
    details: record(string()),
})
```

With those validation function I updated my Svelte project to use Validtype and it worked! Achieve the same ease-of-use as a 3rd party library without having to do `npm install`. It's not much but I like building things like this
