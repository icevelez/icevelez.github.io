![Cover](./assets/cover.webp)

When people discuss runtime compilation, the conversation almost always centers around performance.

Questions usually sound like:

* Isn't runtime compilation slower?
* Why compile in the browser?
* Wouldn't it be better to compile ahead of time?
* Why not just use a build tool?

These are reasonable questions, but they often overlook a more interesting consequence of runtime compilation.

The real opportunity is not that components can be compiled in the browser.

The real opportunity is that **components remain components after deployment.**

---

## The Build-Time Assumption

Most modern frontend frameworks follow a similar workflow:

```text
Source Files
    ↓
Build Tool
    ↓
JavaScript Bundle
    ↓
Browser
```

A component may begin its life as:

```text
App.vue
UserCard.svelte
Dashboard.tsx
```

but after the build process, those files no longer exist in a meaningful runtime form.

The browser receives JavaScript.

The framework receives JavaScript.

The component becomes an implementation detail of the build system.

This approach has many benefits:

* Faster startup performance
* Static optimizations
* Smaller runtime overhead
* Dead code elimination
* Asset bundling

But there is also a tradeoff.

Once the application is built, components are no longer runtime resources.

---

## Components Disappear

Imagine deploying an application built with a traditional build pipeline.

Before deployment:

```text
App.vue
Settings.vue
Profile.vue
```

After deployment:

```text
assets/index-7f8a92.js
```

The original components have effectively disappeared.

The browser cannot request them.

The application cannot discover them.

The server cannot easily distribute them.

They have been transformed into implementation details of a bundle.

For most applications, this is perfectly acceptable.

But it closes the door on a different class of possibilities.

---

## Runtime Compilation Preserves Components

Runtime compilation takes a different approach.

Instead of compiling components before deployment, components remain available as runtime resources.

```text
App.html
Settings.html
Profile.html
```

The browser can request them directly.

The runtime can process them directly.

The server can distribute them directly.

Most importantly:

> Components remain components after deployment.

This sounds simple, but it fundamentally changes what becomes possible.

---

## Components Become Deployable Units

In a runtime compilation model, a component is no longer merely source code.

A component becomes a deployable resource.

```text
UserProfile.html
```

can be:

* Hosted on a server
* Requested on demand
* Updated independently
* Distributed separately
* Cached independently

The component becomes the unit of deployment.

Not the bundle.

Not the application.

The component.

---

## Dynamic Distribution

Consider a traditional application.

Adding a new feature often means:

```text
Modify Source
    ↓
Build Application
    ↓
Deploy Application
```

Even if only a single component changed.

With runtime-distributed components:

```text
Deploy New Component
    ↓
Application Loads Component
```

No application rebuild is required.

The application can discover and execute new functionality dynamically.

---

## Plugin Architectures Become Simpler

Plugin systems are notoriously difficult to build.

Most frontend plugin architectures eventually run into the reality that components have already been bundled into the application.

Runtime components change that equation.

A plugin can simply become:

```text
Plugin Component URL
```

The application downloads the component and executes it.

```text
Plugin
    ↓
Component
    ↓
Runtime
```

No recompilation.

No rebuild.

No bundling process.

---

## Component Marketplaces

Runtime resources also enable a different way of thinking about distribution.

Imagine:

```text
Download Component from a Component Library 
        ↓
Load Component
        ↓
Use Component
```

without rebuilding the application.

Because components remain deployable units, applications can consume functionality in the same way they consume other web resources.

---

## Security Considerations

The ability to distribute and execute components at runtime introduces an important question:

> What happens when components come from untrusted sources?

For example:

```text
User Uploads Component
        ↓
Application Loads Component
        ↓
Component Executes
```

At first glance, this appears powerful—and it is—but it also introduces the same security concerns as executing any user-provided JavaScript.

A Core component is ultimately code.

That means a component can potentially:

* Access browser APIs
* Perform network requests
* Read application state exposed to it
* Interact with the DOM
* Execute arbitrary JavaScript

For this reason, applications should treat untrusted components the same way they would treat untrusted scripts.

---

### Runtime Components Do Not Remove Security Boundaries

Runtime compilation does not bypass browser security.

Core components execute within the same browser security model as any other JavaScript module.

They are still constrained by:

* Same-Origin Policy
* Content Security Policy (CSP)
* Browser sandboxing
* Permission-based browser APIs

However, these protections do not automatically make untrusted code safe.

A malicious component can still perform any action that the hosting application itself is permitted to perform.

---

### Trust Models

Whether runtime-distributed components are appropriate depends on the trust model of the application.

### Trusted Components

Many applications load components only from trusted sources:

```text
Application
        ↓
Developer Components
        ↓
Organization Components
```

In this model, runtime distribution introduces little additional risk beyond loading application code itself.

---

### Semi-Trusted Components

Some applications may allow third-party extensions:

```text
Application
        ↓
Plugin Marketplace
        ↓
Reviewed Components
```

In this scenario, components can be:

* Reviewed
* Signed
* Validated
* Permission-restricted

before distribution.

---

### Untrusted Components

Fully user-generated components represent the highest-risk scenario:

```text
User
        ↓
Upload Component
        ↓
Execute Component
```

In this model, additional isolation mechanisms may be required.

Examples include:

* Sandboxed iframes
* Web Workers
* Capability-based APIs
* Restricted execution environments
* Permission systems

These protections are outside the scope of Core itself and become application-level architectural decisions.

---

### Runtime Distribution Is Not The Same As Trust

One common misconception is:

> "If components can be distributed dynamically, they should also be executable safely."

These are separate concerns.

Runtime distribution answers:

> How do components reach the browser?

Security answers:

> What is the component allowed to do once it arrives?

Core focuses on the former.

Applications remain responsible for defining the latter.

---

### Security as an Architectural Decision

The ability to load components dynamically does not imply that applications should allow arbitrary components.

For many applications, the simplest and safest approach is:

```text
Trusted Components Only
```

Other applications may choose to build richer extension systems with additional safeguards.

The important distinction is that runtime-distributed components create the possibility of user-generated interfaces, but whether that capability is exposed—and how it is secured—remains entirely under the control of the application developer.

---

## Runtime Compilation Is Not The Goal

It is important to understand that runtime compilation itself is not the objective.

The objective is not:

> Compile things in the browser.

The objective is:

> Keep components available as runtime resources.

Runtime compilation simply happens to be the mechanism that makes this possible.

The interesting outcome is not the compiler.

The interesting outcome is what remains available after deployment.

---

## Progressive Optimization

A common criticism of runtime systems is that compilation work must occur in the browser.

Historically, this has been one of the strongest arguments for build tools.

However, runtime compilation and progressive optimization are not mutually exclusive.

Systems such as JavaScript engines and JVMs have demonstrated this for decades.

Code can remain a runtime resource while still becoming faster over time.

This idea inspired the development of Core Assist.

Instead of treating compilation as work that must occur repeatedly, compilation becomes:

```text
Component
    ↓
Compile Once
    ↓
Store Result
    ↓
Reuse Result
```

The component remains a runtime resource.

The browser progressively eliminates repeated compilation work.

---

## A Different Way To Think About Frontend Applications

The traditional frontend mindset is:

> Build, bundle, and ship.

Runtime-distributed components suggest a different perspective:

> Distribute, execute, and progressively optimize.

In this model:

* Components remain deployable units
* Components remain discoverable
* Components remain executable resources
* Performance improves through reuse and caching

The browser becomes more than a destination for compiled code.

It becomes both the runtime and the optimization layer.

---

## Closing Thoughts

The surprising opportunity offered by runtime compilation is not that code can be compiled in the browser.

The surprising opportunity is that components never stop being components.

They remain deployable resources that can be loaded, distributed, cached, shared, updated, and executed long after an application has been deployed.

Whether this model is appropriate for every application is a separate discussion.

But it opens architectural possibilities that largely disappear once components are transformed into a bundle.

And that may be the most interesting aspect of runtime compilation.
