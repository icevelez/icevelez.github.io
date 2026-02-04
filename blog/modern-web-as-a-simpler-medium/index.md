![Cover](./assets/cover.webp)

I didn’t come to this conclusion from nostalgia or minimalism.
I came to it by accident.

4 years ago, I built an internal government system using nothing but **HTML, CSS, and JavaScript**. No framework. No bundler. No build pipeline. Just files served to a browser.

At the time, I didn’t think I was making a philosophical statement about the web. I was just trying to get something working with the tools I understood.

Only later did I realize something surprising:

I had accidentally built a “modern” web app by relying almost entirely on what the browser could already do.

---

## Building Components Without a Framework

The app was component-based, but not in the way people expect.

I had a helper function:

```js
html.create(tag, attributes, children)
```

It created real DOM nodes. No virtual DOM. No compilation. Just:

* Create an element
* Set attributes
* Append children

And I nested it:

```js
html.create("div", { class: "card" }, [
  html.create("h1", {}, ["Dashboard"]),
  html.create("button", { onclick: refresh }, ["Reload"])
])
```

It looked a bit like JSX, but it was plain JavaScript generating real DOM. What you saw in DevTools was exactly what the browser executed. No hidden transform layer.

There were no reactive primitives. When state changed, I re-rendered explicitly. It wasn’t the most elegant system, but it was readable, debuggable, and understandable straight from “View Source.”

---

## I Didn’t Know the History — But I Benefited From It

At the time, I didn’t fully understand:

* The event loop
* The microtask queue
* `async` / `await`

Parts of the code were deeply nested and callback-heavy. Today I’d structure it differently.

But the app worked. It served real users. It was readable. 

I was using native `import` and `export` simply because splitting code into files felt natural. I had no idea this capability was the result of years of struggle with AMD, CommonJS, and bundlers trying to simulate a module system that didn’t yet exist.

I was standing on top of platform progress I didn’t even know had happened.

**Figure 1:** A sketch of what I plan the Restaurant System was going to be back in 2022, emphasizing breaking down each domain as its own component, its own JS file to be imported
![code_by_component](./assets/code_by_component.jpg)

---

## The Feature I Wanted Already Existed

I remember wanting one specific improvement: I didn’t want the dashboard code to download until after login. The sign-in page didn’t need the whole application.

Today I’d write:

```js
const dashboard = await import('./dashboard.js')
```

But I didn’t know dynamic `import()` existed back then. So the entire app downloaded upfront.

The platform had already solved the problem. I just didn’t know it.

That moment stuck with me later, when I began learning more about bundlers, code splitting, and build tooling. It made me question how many “necessary” tools were still compensating for limitations that no longer existed.

---

## We Built Tools for a Web That No Longer Exists

Most heavy frontend tooling came from real constraints.

Browsers once lacked:

* A native module system
* Efficient request concurrency
* Modern CSS structuring tools
* Strong compression and caching

So we built solutions in userland.

We bundled files because HTTP/1.1 made multiple requests expensive.
We invented module formats because JavaScript had none.
We used CSS preprocessors because managing styles at scale was painful.

But the platform evolved.

| Old Problem                 | Tooling Solution                        | Modern Reality                                  |
| --------------------------- | --------------------------------------- | ----------------------------------------------- |
| Many HTTP requests are slow | Bundle everything                       | HTTP/2 & HTTP/3 multiplexing                    |
| No module system            | AMD / CommonJS / Bundlers               | Native ES Modules                               |
| No lazy loading             | Code splitting                          | `import()`                                      |
| CSS collisions & structure  | SASS, PostCSS, scoped CSS in frameworks | `@layer`, CSS variables, `:where()`, Shadow DOM |
| Large payloads              | Extreme minification                    | Brotli + better caching                         |

The web platform absorbed many of the responsibilities our build tools once handled.

But our habits didn’t update.

---

## Bundlers are Brilliant, but Are They Still Necessary??

Bundlers are engineering marvels. But it’s worth asking: are they still solving a fundamental limitation, or optimizing around outdated assumptions?

### Code Splitting vs Native Lazy Loading

Bundlers promote code splitting as a key performance feature. Under the hood, this often compiles to dynamic `import()` — which browsers already support natively.

Bundlers group modules into chunks to reduce request counts, which made sense when many small requests were slow. But HTTP/2 and HTTP/3 allow multiplexed requests over a single connection efficiently.

We are still optimizing for a network model that has largely changed.

### The Minification Trade-Off

Minification works best when the optimizer sees the whole program. Variable renaming and compression are more effective globally.

When we split into chunks, each file is minified in isolation. Cross-chunk compression opportunities shrink. Global renaming becomes impossible.

In other words, code splitting — done to improve loading — can reduce the theoretical efficiency of minification.

The loss isn’t catastrophic, but it’s ironic: we add build complexity for optimizations that sometimes counteract each other.

### Tree Shaking Isn’t a Silver Bullet

Tree shaking sounds like magic: unused code disappears.

In practice, it depends heavily on how developers write imports. For example:

```js
import * as Utils from './utils.js'
```

From a bundler’s perspective, any property on `Utils` might be accessed dynamically. Everything must stay.

Tree shaking works best in ideal scenarios like

```js
import { formatDate } from './utils.js'
```

But real-world code is not always ideal. Tools promise perfect dead code elimination, but JavaScript’s dynamic nature makes that guarantee fragile.

We built tools that assume perfect static structure, then fed them messy, human-written programs.

---

## CSS Is Catching Up

CSS has evolved in ways that reduce the need for heavy preprocessing:

* `@layer` helps organize style priority
* `@scope` limit the styles to a specific part of the DOM
* `:where()` and `:is()` help manage specificity
* Native variables replace many SASS use cases

Framework-scoped CSS, SASS, and PostCSS solved real problems — but many of those problems now have native answers.

---

## The Last Major Gap: Reactive UI

There’s still one big feature frameworks provide that the platform does not standardize: structured reactivity. The automatic link between state changes and DOM updates.

That remains the strongest argument for frameworks.

But if the platform ever gains a standard, declarative reactive templating model, most SPA frameworks would shift from essential infrastructure to optional ergonomics.

---

## Complexity Has a Cost

Modern frontend tooling often promises leaner, faster applications through minification, tree-shaking, and code splitting. And those tools absolutely have their place. But my experience has shown me something surprising:

**More tooling does not automatically mean a smaller or simpler result.**

In a recent restaurant Ordering System I built using my own lightweight framework (Core.js), I relied on:

* Native ES modules
* Dynamic `import()` for lazy loading
* HTTP/2 multiplexing
* Gzip compression

No bundler. (with the exception for the CSS as I used Tailwind CLI)

No minification.

No tree-shaking step.

The login page with just the application code — shipped at **19.7 KB**.

For comparison:

* A government system built with **Angular 19** delivered a login bundle of **30.7 KB**, even with minification, tree-shaking, and code splitting.
* A legacy **server-rendered** government system shipped **93 KB** on the login page — **85 KB of that was jQuery alone**.

Despite using *less* tooling, the simplest architecture produced the smallest result.

This doesn’t prove that bundlers are useless as I'm sure Tailwind helped heavily in reducing my app's CSS bundle size. But it does challenge the assumption that adding more build steps automatically leads to leaner software. Code splitting can reduce the impact of minification by breaking compression across chunks. Tree-shaking can only remove code when imports are structured perfectly. In practice, real applications often import more than they use.

Complexity isn’t free — it just moves around.

There’s also a people side to this. Popular frameworks can make hiring and onboarding easier because more developers already know them. That’s a real advantage. But those ecosystems also come with layers of abstraction, conventions, and build pipelines that every team member must eventually understand.

In smaller systems, internal tools, or government projects, the question isn’t just:

**“What technology is most popular?”**

It’s:

**“What level of complexity can this team realistically understand and maintain over time?”**

All software has complexity. The choice is whether that complexity lives in a massive toolchain you inherit — or in a smaller system you deeply understand.

In my case, leaning on the browser itself reduced the number of moving parts. Fewer transformations. Fewer hidden layers. More of the system was visible in “View Source.”

And that visibility has value.

---

## The Web Is Becoming Simple Again

We are slowly returning to a model where the browser itself is powerful enough to be the primary runtime — not just the final target of a long chain of transformations.

And when you experience that shift firsthand — when you build something real, used by real people, with just HTML, CSS, and JavaScript — you start to see the web less as a fragile platform that needs layers of protection…

…and more as a capable medium that’s grown up.

The modern web is becoming **mature enough to be simple**.
