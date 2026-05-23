![Cover](./assets/cover.webp)

Core.js’ template compiler did not start as an ambitious compiler project. It started as a workaround. 

At the time, my understanding of Handlebar-style parsing was extremely limited. I already knew how to process a *clean* template like this:

```html
<h1>Hello {{ "World" }}</h1>
<p>My name is {{ name }}</p>
```

because the solution was relatively straightforward:

1. convert the HTML string into a DOM tree using a `<template>`
2. traverse the DOM nodes and evaluate dynamics like:

   * text interpolation
   * attributes
   * event handlers

The browser was essentially doing the parsing work for me. But the moment Handlebar control flow entered the picture:

```html
{{#if show}}
<h1>Truthy</h1>
{{:else}}
<h1>Falsey</h1>
{{/if}}
```

everything broke. 

The browser cannot parse templates containing invalid HTML structures created by unfinished Handlebar syntax. A DOM parser only works once the template is already valid HTML.

So the simplest solution I could think of was honestly a bit hacky:

> remove the problematic blocks first.

At first this was merely a workaround to avoid learning how to write a real parser.

---

# Placeholder Injection

The problem was:
I could not simply remove the blocks permanently.

They still needed to exist after evaluation.

So the idea became:

* temporarily extract the `if`, `each`, and `await` blocks
* replace them with placeholders
* restore them later during rendering

Initially the placeholders looked like this:

```html
<div block-id="if-abc123"></div>
```

with the `block-id` referencing the extracted block.

But this quickly revealed another issue:
certain DOM locations cannot legally contain a `<div>`.

For example:

* inside tables
* inside lists
* inside inline-only contexts

which eventually led to switching toward:

```html id="j6zksh"
<template block-id="if-abc123"></template>
```

because `<template>`:

* is inert
* valid nearly everywhere
* produces no visual DOM output
* works naturally as a placeholder anchor

What initially looked like a hack unexpectedly evolved into something much more interesting.

The extracted blocks formed a graph.

Parent templates referenced child templates through placeholders, and those child templates could themselves contain more placeholders recursively.

Without realizing it, the parser had started constructing a hierarchical render graph.

---

# Traversing the DOM Once

Another major turning point came later with optimization work assisted by ChatGPT.

Instead of repeatedly:

* traversing DOM nodes
* checking bindings
* re-evaluating expressions

the parser began preprocessing templates only once.

The process became:

1. convert clean HTML into a cached DOM fragment
2. traverse the DOM once
3. collect all dynamic bindings
4. store them as runtime instructions
5. execution those instructions upon rendering a block

This transformed rendering from:

> “find the dynamic region and evaluate in every render”

into:

> “execute these dynamic binding instructions at runtime”

The runtime no longer needed to:

* search for bindings
* walk the DOM repeatedly
* rediscover dynamic regions

because all of that work had already been extracted ahead of time.

---

# The Svelte 5 Realization

My primary framework has always been Svelte and at some point I came across the article:

[Svelte 5's "Magic" Debunked: It's Just Syntactic Sugar](https://www.puruvj.dev/blog/svelte-5-magic-debunked?utm_source=chatgpt.com)

which compared Svelte 3/4 with Svelte 5 and explained the magic behind its compiled output.

That article ended up becoming a massive realization because looking at Svelte 5’s generated output, I realized:

> I already have all the information required to build a compiler like this.

The structure suddenly became obvious. Modern compilers like:

* Svelte
* Vue.js Vapor Mode
* SolidJS

all conceptually follow a remarkably similar structure:

* template caching
* template cloning
* dynamic node declaration
* reactive bindings
* block rendering
* event delegation
* append to anchor

The realization was not that these frameworks copied each other. It was that:

> once you reduce template rendering to its fundamentals, the architecture naturally converges toward the same shape.

---

# Template Caching & Runtime Rendering

Looking at generated output from Svelte 5:

```js 
var root = $.from_html(`<h1> </h1>`);
```

Solid:

```js
var _tmpl$ = _$template(`<h1>Hello World <!> <h1>`);
```

and Vue Vapor:

```js
const t0 = _template("<div></div>")
```

revealed the same pattern repeatedly:

* hoist template
* cache template
* clone template
* attach dynamic bindings
* render only dynamic regions

Core.js already had:

* cached templates
* extracted bindings
* runtime instructions
* placeholder block rendering

The missing piece was simply:

> generate optimized render functions directly.

That realization eventually led to Core.js v0.3.0:
the transition from a dynamic instruction-based renderer into a runtime compiler.

---

# The “Block Tree” Parallel

Reflecting on all of this eventually led me to the talk:

[Evan You on Vue.js: Seeking the Balance in Framework Design](https://www.youtube.com/watch?v=ANtSWq-zI0s)

where Evan You discusses the concept of a “block tree.”

Surprisingly, the recursive placeholder extraction process in Core.js had independently evolved into something conceptually very similar:

* templates referencing nested templates
* dynamic regions isolated from static structure
* rendering organized hierarchically instead of linearly

The same pattern emerged again.

---

# Dynamic Bindings as “Holes”

Another fascinating parallel appeared while watching:

[The 3 Ways JavaScript Frameworks Render the DOM](https://www.youtube.com/watch?v=0C-y59betmY)

Where Ryan Carniato describes dynamic template regions as “holes.”. That description immediately resonated with Core.js’ preprocessing stage because traversing the DOM once to collect:

* text bindings
* class bindings
* directives
* event handlers
* block placeholders

was effectively identifying:

> the holes that would later be filled reactively at runtime.

- Everything static becomes cached structure.
- Everything dynamic becomes a runtime update point.

And once that separation exists, rendering becomes dramatically simpler and faster.

--- 

# Standing on Existing Foundations

One of the most important realizations during the development of Core.js was understanding that almost none of these ideas were truly original.

The deeper I explored compiler architecture, runtime rendering, and fine-grained reactivity, the more obvious it became that frameworks like:

* SolidJS
* Svelte
* Vue.js

had already solved many of the hardest rendering problems years ago.

Core.js did not invent:

* template caching
* block-based rendering
* fine-grained reactivity
* dynamic hole insertion
* DOM cloning strategies
* reactive compilation
* render graph concepts

Instead, Core.js is largely the result of observing where modern frameworks were already converging architecturally and applying those same ideas in a different environment and workflow.

In many ways, the “innovation” behind Core.js was not inventing new rendering concepts, but recognizing that:

> modern frameworks had already converged toward a highly optimized rendering model.

Once that pattern became visible, the implementation direction became much clearer.

---

# A Browser-Only Runtime Compiler

Core.js was ultimately designed around a very different developer experience philosophy.

Modern frontend ecosystems often assume:

* bundlers
* build pipelines
* file-based compilation
* server tooling
* complex project scaffolding

Core.js intentionally moves in the opposite direction.

The goal was to create:

> a fast browser-only runtime framework that still benefits from modern compiler-inspired rendering techniques.

The workflow resembles older web development styles:

* include a script
* write components
* render immediately

or in modern terms:

* import the runtime
* start coding directly
* no mandatory build step

while still incorporating ideas inspired by modern compilers.

---

# The Unexpected Lesson

Ironically, what began as:

> “I do not know how to properly parse Handlebar blocks”

eventually led to discovering that many modern frameworks fundamentally solve the same rendering problem in remarkably similar ways.

Different syntax.
Different APIs.
Different philosophies.

But underneath:

* isolate static structure
* identify dynamic regions
* minimize runtime work
* reuse DOM aggressively
* let reactivity drive updates

the underlying architecture repeatedly converges toward the same ideas.

Core.js simply became another variation of that convergence.
