![Cover](./assets/cover.webp)

JavaScript is often described as a single-threaded language.

That description is useful, but incomplete.

In the browser, the JavaScript that drives your application typically runs on a main thread. That thread is responsible for executing JavaScript, responding to user input, and coordinating UI work.

So when you do something computationally expensive like

```js
const result = expensiveComputation(data);
```

the main thread gets occupied for a moment, visualized like so

```text
Main Thread
────────────────────────────────────────────
UI │ Input │ ██████████████████████████ │ UI
               expensive computation
```

The UI doesn't necessarily become completely frozen in every circumstance, but a long-running synchronous computation can prevent the browser from doing other work.

And that leads to an interesting question:

> **Can we move that expensive computation somewhere else?**

Yes, yes we can. Using Web Workers.

---

# Web Workers: JavaScript Outside the Main Thread

Browsers provide an API called **Web Workers**.

A Worker creates another JavaScript execution context that can execute independently from the main thread.

The simplest example looks like this:

```js
// script.js
const worker = new Worker("worker.js");

worker.postMessage({
    numbers: [1, 2, 3, 4]
});

worker.onmessage = event => {
    console.log(event.data);
};
```

The worker can then do:

```js
// worker.js
self.onmessage = event => {
    const result = expensiveComputation(event.data.numbers);
    self.postMessage(result);
};
```

Conceptually:

```text
              Browser
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   Main Thread          Worker
        │                 │
      UI work          computation
        │                 │
        └── postMessage ──┘
```

Now JavaScript is executing on more than one thread.

So in that sense:

> **Web Workers give JavaScript a form of multi-threaded execution.**

But they are not quite like conventional threads in languages such as C++ or Java.

---

# Workers Don't Share the JavaScript Heap

This is one of the most important things to understand about Web Workers.

A conventional thread typically shares the process's memory like

```text
Process
┌────────────────────────────────────┐
│ Shared Memory                      │
│                                    │
│ Thread 1     Thread 2     Thread 3 │
│    │            │            │     │
│    └────────────┼────────────┘     │
│                 │                  │
│            shared objects          │
└────────────────────────────────────┘
```

But Web Workers are different. Conceptually, you have:

```text
Browser
│
├── Main Thread
│     └── JavaScript Heap A
│
├── Worker 1 Thread
│     └── JavaScript Heap B
│
├── Worker 2 Thread
│     └── JavaScript Heap C
│
└── Worker 3 Thread
      └── JavaScript Heap D
```

A worker cannot access an object that belongs to the main thread.

Instead, the main thread and worker communicate through messaging:

```js
worker.postMessage(data);
```

and:

```js
self.postMessage(result);
```

This is somewhat analogous to [IPC](https://www.geeksforgeeks.org/operating-systems/inter-process-communication-ipc/) between processes:

```text
Main Thread
     │
     │ message
     ▼
┌───────────────┐
│    Browser    │
│ communication │
└───────────────┘
     │
     ▼
Worker
```

This isolation is intentional.

It makes existing JavaScript easier to reason about than a shared-memory JavaScript would be.

---

## Tedious Communication and Expanding Worker Capabilities

There is another problem you'll encounter with Web Workers that becomes apparent once you try to build something beyond a single isolated task

> **the Worker itself doesn't know what your application wants it to do.**

In a 2019 presentation by Surma titled ["The main thead is overworked & underpaid"](https://www.youtube.com/watch?v=7Rrv9qFMWNM&t=827), he pointed out a problem with progressively adding capabilities to a Worker: every new capability has to be explicitly implemented in the Worker, along with the communication protocol needed to invoke it from the main thread.

You might start with something simple:

```js
worker.postMessage({
    type: "parseCSV",
    data
});
```

Then the Worker needs to know about it:

```js
self.onmessage = event => {
    switch (event.data.type) {
        case "parseCSV":
            // ...
            break;
    }
};
```

Then you add another capability:

```js
case "resizeImage":
    // ...
    break;
```

Then another:

```js
case "compressData":
    // ...
    break;
```

And another.

Eventually, the Worker becomes a collection of hard-coded capabilities:

```text
                    Web Worker
                        │
              ┌─────────┼─────────┐
              │         │         │
           parseCSV  resizeImage  compress
              │         │         │
              └─────────┼─────────┘
                        │
                  message protocol
```

Every capability requires more than just implementing the function itself. You also need to define **how the main thread asks the Worker to execute it, how arguments are represented, how the result is returned, how errors are propagated, and how the response is associated with the original request.**

You eventually end up building your own little RPC system:

```text
Main Thread                         Worker
     │                                │
     │ { id: 1, type: "parseCSV" }    │
     ├───────────────────────────────►│
     │                                │
     │                                │ parseCSV()
     │                                │
     │ { id: 1, result: ... }         │
     │◄───────────────────────────────┤
     │                                │
```

And now you need bookkeeping:

```text
Request ID
Response mapping
Function/capability registry
Argument serialization
Result serialization
Promise resolution
Promise rejection
Error propagation
```

This is the part of Web Workers that can feel surprisingly tedious.

---

# The Idea Behind Worklet

The original idea was

> **"I want a simple API to off-load expensive computation from the main thread."**

Instead of:

```js
const worker = new Worker(...);
worker.postMessage(...);
worker.onmessage = ...;
```

I wanted something conceptually closer to:

```js
import { wrap } from "worklet";

const calculate = wrap(expensiveComputation);

const result = await calculate(data);
```

The rest came afterward.

Once that abstraction existed, several questions naturally appeared:

> What happens if I execute multiple tasks?

**A queue.**

> What happens if I have multiple tasks that could execute simultaneously?

**A pool of workers.**

> How many workers should I create?

**A worker limit based on available hardware.**

> What happens when a worker gets stuck?

**A timeout.**

> What happens when workers consume memory while doing nothing?

**An idle lifetime.**

> What happens when a worker crashes?

**Worker replacement.**

And Worklet gradually became something more interesting than simply:

```text
function → Web Worker
```

It became:

```text
function
   ↓
task
   ↓
scheduler
   ↓
worker pool
   ↓
result
```

The idea of a scheduler was not entirely new to me. About a year earlier, I had watched a presentation about [Go's scheduler](https://www.youtube.com/watch?v=YHRO5WQGh0k&t=1582s&pp=ygUMR28gc2NoZWR1bGVy) because I wanted to understand what was happening underneath Go's concurrency model—much in the same way that understanding JavaScript's event loop, event queue, microtask queue, and Web APIs can give you a better mental model of how JavaScript actually executes asynchronous work.

What stuck with me was the idea that concurrency doesn't necessarily mean manually managing the underlying execution resources yourself. You can have many units of work, while a scheduler decides when and where those units should execute.

That idea translated naturally to Worklet.

---

# From Function Wrapping to a Scheduler

The API can remain deceptively simple:

```js
const parseCSV = worklet.wrap(parseCSVFile);
```

But internally:

```text
parseCSV(file)
      │
      ▼
   Task ID
      │
      ▼
 Task Queue
      │
      ▼
  Scheduler
      │
      ├───────────────┐
      ▼               ▼
 Worker 1          Worker 2
      │               │
      ▼               ▼
   Task A           Task B
```

Suppose we have 25 CSV files:

```js
await Promise.all(
    files.map(file => parseCSV(file))
);
```

The application has created 25 tasks.

It doesn't necessarily create 25 Workers.

Instead, the scheduler might have:

```text
MAX_WORKERS = 16

25 tasks
│
├── Worker 1  → CSV 1
├── Worker 2  → CSV 2
├── Worker 3  → CSV 3
├── ...
├── Worker 16 → CSV 16
│
└── CSV 17-25 → queue
```

When Worker 4 finishes:

```text
Worker 4
   │
   └── finished CSV 4
             │
             ▼
         CSV 17
```

This is where the **worker pool** becomes important.

The developer thinks in terms of:

```text
Functions → Tasks
```

rather than:

```text
Functions → Workers
```

The workers become an implementation detail.

---

# This Starts to Look a Little Like Go

At this point, the architecture starts to resemble something familiar from languages such as Go.

Go gives developers:

```go
go expensiveComputation()
```

and the Go runtime takes responsibility for scheduling goroutines across available threads.

Worklet provides something conceptually similar:

```js
const compute = worklet.wrap(expensiveComputation);

compute(data1);
compute(data2);
compute(data3);
```

and the Worklet scheduler distributes those tasks across Workers.

Conceptually:

```text
             Application
                  │
             many tasks
                  │
                  ▼
              Scheduler
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
       W1        W2        W3
```

But this is **not the same concurrency model as Go**.

A goroutine is an extremely lightweight language/runtime abstraction over execution contexts managed by the Go runtime.

A Web Worker is much heavier:

```text
Go:

goroutine
   ↓
Go runtime scheduler
   ↓
OS threads


JavaScript:

task
   ↓
Worklet scheduler
   ↓
Web Worker
   ↓
browser / OS thread
```

And Workers have isolated JavaScript heaps.

So the analogy is:

> **Worklet has a Go-like feeling at the scheduling/API level, but not Go's underlying execution model.**

---

# Looking for Others just like Worklet

While exploring the Web Worker ecosystem, I came across [`useWorker`](https://www.youtube.com/watch?v=jB0-KQrQ7HY).

It immediately looked familiar.

`useWorker` provides an abstraction where a function can be executed in a Web Worker rather than directly on the main thread.

Conceptually:

```js
const [workerFunction] = useWorker(expensiveFunction);

const result = await workerFunction(data);
```

This overlaps significantly with Worklet:

Both are trying to provide the same fundamental developer experience:

```text
ordinary function
       ↓
worker-backed function
       ↓
Promise
```

That was useful because it demonstrated that the basic idea of **"wrap a function and execute it in a Web Worker"** is independently useful.

But there is an important architectural difference.

## useWorker vs Worklet

[`useWorker`](https://github.com/alewin/useWorker) and Worklet share a similar goal: **take a JavaScript function and execute it away from the main thread**.

The difference is primarily in **what owns and manages the Worker, and how concurrent work is scheduled**.

`useWorker` is primarily a **React-oriented abstraction around an individual Web Worker**:

```text
React
  │
  ▼
useWorker()
  │
  ▼
Web Worker
```

Worklet is designed as a **framework-independent execution system**:

```text
Core ─────┐
React ────┤
Vue ──────┤
Svelte ───┤
Vanilla ──┘
     │
     ▼
  Worklet
     │
 Scheduler
     │
 Worker Pool
```

### One `useWorker` instance, one Worker

With `useWorker`, a wrapped function is associated with a Worker instance.

For example:

```js
const [parse_csv] = useWorker(parse_csv_func);
const [fibonacci] = useWorker(fibonacci_func);
```

These are two independent `useWorker` instances, and therefore two independent Workers:

```text
parse_csv()
     │
     ▼
┌─────────────────────┐
│      Worker 1       │
│                     │
│     parse_csv()     │
└─────────────────────┘


fibonacci()
     │
     ▼
┌─────────────────────┐
│      Worker 2       │
│                     │
│    fibonacci()      │
└─────────────────────┘
```

There is an important detail, however: [**a single `useWorker` instance only allows one invocation to be running at a time.**](https://github.com/alewin/useWorker/blob/master/packages/useWorker/src/useWorker.ts#L162) It does not maintain a task queue for concurrent calls.

For example:

```js
const [parse_csv] = useWorker(parse_csv_func);

await Promise.all([
    parse_csv(file1),
    parse_csv(file2),
    parse_csv(file3),
    parse_csv(file4),
]);
```

The first call starts the Worker:

```text
parse_csv(file1)
       │
       ▼
   Worker 1
       │
    running
```

While that Worker is running, another invocation of the same `useWorker` instance is rejected rather than queued.

Conceptually:

```text
Worker 1
────────────────────────────────────────────
████████ file1 ████████████
        │
        ├── parse(file2) → rejected
        ├── parse(file3) → rejected
        └── parse(file4) → rejected
```

To execute multiple invocations of the same function concurrently with `useWorker`, you need multiple `useWorker` instances:

```js
const [parse_csv_1] = useWorker(parse_csv_func);
const [parse_csv_2] = useWorker(parse_csv_func);
const [parse_csv_3] = useWorker(parse_csv_func);
const [parse_csv_4] = useWorker(parse_csv_func);
```

which gives you:

```text
parse_csv_1 ──► Worker 1
parse_csv_2 ──► Worker 2
parse_csv_3 ──► Worker 3
parse_csv_4 ──► Worker 4
```

This means concurrency is exposed at the **Worker instance level**.

### Worker lifetime

`useWorker` also has an `autoTerminate` option.

By default:

```js
autoTerminate: true
```

When the task finishes, the Worker is terminated:

```text
call
 │
 ▼
create Worker
 │
 ▼
execute function
 │
 ▼
resolve Promise
 │
 ▼
terminate Worker
```

The next invocation creates another Worker.

With:

```js
const [parse_csv] = useWorker(parse_csv_func, {
    autoTerminate: false,
});
```

the Worker remains alive and can be reused:

```text
call #1
   │
   ▼
Worker 1
   │
   ▼
result
   │
   │  Worker remains alive
   ▼
call #2
   │
   ▼
Worker 1
```

However, this still does not turn the Worker into a concurrent task queue. Only one invocation can be active at a time for that `useWorker` instance.

---

## Worklet: Functions Become Tasks

Worklet takes a different approach.

Instead of associating a Worker with a function, Worklet treats each invocation as a **task**.

```js
import { wrap } from "worklet";

const parse_csv = wrap(parse_csv_func);
const fibonacci = wrap(fibonacci_func);
```

Calling the wrapped function creates work that is submitted to the scheduler:

```js
await Promise.all([
    parse_csv(file1),
    parse_csv(file2),
    parse_csv(file3),
    parse_csv(file4),
    fibonacci(32),
]);
```

The scheduler can distribute those tasks across the available Workers:

```text
                         Worklet
                            │
                         Scheduler
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Worker 1          Worker 2          Worker 3
          │                 │                 │
     parse_csv(file1)  parse_csv(file2)  parse_csv(file3)
```

If the pool is limited to four Workers:

```text
Task 1 ──► Worker 1
Task 2 ──► Worker 2
Task 3 ──► Worker 3
Task 4 ──► Worker 4
Task 5 ──► Queue
Task 6 ──► Queue
```

When a Worker becomes available:

```text
Task 2
   │
   └── finished
          │
          ▼
       Worker 2
          │
          ▼
       Task 5
```

The Worker is therefore an **execution resource**, rather than something permanently associated with a particular function.

You can have many different functions:

```js
const parse_csv = wrap(parse_csv_func);
const resize_image = wrap(resize_image_func);
const compress = wrap(compress_func);
const calculate = wrap(calculate_func);
```

while still maintaining a fixed Worker limit:

```text
                    Scheduler
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
            W1         W2         W3
             │          │          │
          parse       resize     calculate
             │          │          │
             └──────────┴──────────┘
                        │
                  Workers become
                     available
                        │
                        ▼
                  next queued task
```

The scheduler determines **which Worker executes which task**.

---

## The Key Architectural Difference

The distinction can be summarized as:

```text
useWorker

Wrapped Function
       │
       ▼
    Worker
       │
       ▼
   One task at a time
```

versus:

```text
Worklet

Wrapped Function
       │
       ▼
      Task
       │
       ▼
   Scheduler
       │
       ▼
   Worker Pool
       │
   ┌───┼───┐
   ▼   ▼   ▼
  W1  W2  W3
```

This means Worklet separates **what is being executed** from **where it is executed**.

With `useWorker`, the relationship is roughly:

```text
Function instance ──► Worker instance
```

With Worklet:

```text
Function invocation ──► Task ──► Scheduler ──► Worker
```

That distinction is central to Worklet.

> **`useWorker` abstracts the Worker; Worklet abstracts the execution of tasks across Workers.**

The goal of Worklet is therefore not simply to make `new Worker()` easier to use. It is to move **task scheduling, concurrency, Worker reuse, Worker limits, and Worker lifecycle** out of application code and into the execution abstraction.

---

# The Price of Parallelism

This all sounds fantastic until you move a large amount of data.

And this is where Web Workers reveal their biggest trade-off.

Suppose we're parsing CSV files.

The main thread has:

```js
const file = input.files[0];
```

We send it to the worker:

```js
worker.postMessage(file);
```

The browser handles the communication between the two execution contexts.

For values that aren't transferable, JavaScript uses the **structured clone algorithm**.

Conceptually:

```text
Main Thread                         Worker

Object A                            Object B
┌──────────────┐                    ┌──────────────┐
│ CSV records  │ ─── clone ───────► │ CSV records  │
│ arrays       │                    │ arrays       │
│ strings      │                    │ strings      │
└──────────────┘                    └──────────────┘
```

You don't get:

```text
Main ──► same object reference ──► Worker
```

Instead, you get a corresponding representation in another JavaScript heap.

---

# The Memory Cost

This becomes particularly important with large datasets.

Suppose a worker parses 500 MB worth of CSV data and produces a large JavaScript object graph.

You may temporarily have:

```text
Main Thread
┌──────────────────────────────┐
│ input data                   │
│ application state            │
│ cloned result                │
└──────────────────────────────┘

Worker
┌──────────────────────────────┐
│ input data                   │
│ parser state                 │
│ parsed result                │
└──────────────────────────────┘
```

And while garbage collection and temporary allocations are occurring, the peak memory usage can become considerably larger than the final dataset.

This is one explanation for why a Worker-based CSV processing workload can show surprisingly high memory usage.

If you have several Workers:

```text
Worker 1 → Heap
Worker 2 → Heap
Worker 3 → Heap
Worker 4 → Heap
...
```

each worker has its own JavaScript execution environment and associated memory.

Parallelism isn't free.

---

# Transferables Help

JavaScript has another mechanism for moving certain types of data between Workers without copying the underlying memory: **Transferable Objects**.

For example:

```js
const buffer = new ArrayBuffer(1024);

worker.postMessage(
    buffer,
    [buffer]
);
```

The ownership of the buffer moves:

```text
Before

Main
 │
 └── ArrayBuffer


After

Main                     Worker
 │                          │
 └── detached          ArrayBuffer
```

This can be substantially more efficient for large binary data.

But there's a catch:

> **The original owner loses access to the transferred resource.**

And not every JavaScript value is transferable.

---

# SharedArrayBuffer Goes Even Further

There is also `SharedArrayBuffer`.

Instead of transferring ownership:

```text
Main ───────► Worker
```

both execution contexts can access the same underlying bytes:

```text
             SharedArrayBuffer
                    │
             ┌──────┴──────┐
             ▼             ▼
           Main          Worker
```

With `Atomics`, the two execution contexts can coordinate access.

This starts to look much more like traditional shared-memory multithreading.

But there's an important limitation:

**SharedArrayBuffer contains bytes, not arbitrary JavaScript objects.**

You can't simply place a `Map`, arbitrary object graph, or function into shared memory.

You have to design a binary representation.

---

# The Fundamental Trade-Off

At this point, the architecture can be summarized as:

```text
             Web Workers
                  │
       ┌──────────┴──────────┐
       │                     │
       ▼                     ▼
   Parallelism            Isolation
       │                     │
       │                     │
       └──────────┬──────────┘
                  ▼
          Communication cost
```

Workers give us something extremely valuable:

**parallel computation.**

But they also give us:

**isolated memory.**

And isolated memory means:

**communication overhead.**

So the optimization question isn't simply:

> "Can I move this computation to a Worker?"

It becomes:

> **"Is the computation expensive enough to justify moving the data across the Worker boundary?"**

---

# CSV Parsing Is a Good Example

Imagine 25 CSV files selected through:

```html
<input type="file" multiple>
```

A main-thread implementation might do:

```text
Main Thread
│
├── File 1 → parse
├── File 2 → parse
├── File 3 → parse
├── ...
└── File 25 → parse
```

The main thread performs the CPU-intensive parsing.

With Worklet:

```text
                  Worklet
                     │
                  Scheduler
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      W1            W2            W3
       │             │             │
    CSV 1          CSV 2          CSV 3
       │             │             │
       ▼             ▼             ▼
    parsing        parsing        parsing
```

The CPU-heavy work can happen concurrently.

But eventually:

```text
Worker
   │
   │ parsed result
   ▼
Main Thread
```

and that result still has to cross the boundary.

If the result is a massive JavaScript object graph, the communication and memory costs can become significant.

This is why a high-performance Worker architecture often benefits from:

* streaming input
* compact representations
* typed arrays
* Transferable objects
* avoiding unnecessary intermediate objects
* processing data incrementally
* terminating workers when their memory is no longer useful

The goal isn't simply:

> **"Put everything in Workers."**

It's:

> **"Put the right computation and data representation in Workers."**

---

# Concurrency vs Parallelism

There's another distinction worth making.

These two concepts are related but different.

### Concurrency

Multiple tasks are in progress:

```text
Task A ────────────────┐
Task B ─────────┐     │
Task C ───────┐ │     │
              ▼ ▼     ▼
              scheduler
```

### Parallelism

Multiple tasks are actually executing simultaneously on different processors:

```text
CPU 1 ── Task A ──────────
CPU 2 ── Task B ──────────
CPU 3 ── Task C ──────────
```

A single Worker can give you asynchronous/concurrent behavior:

```text
Task A
Task B
Task C
```

but its JavaScript execution is still sequential.

Multiple Workers allow actual CPU parallelism:

```text
Worker 1 → CPU
Worker 2 → CPU
Worker 3 → CPU
```

This is why the Worker Pool matters.

---

# What Worklet Ultimately Became

What started as:

> "Can I run an expensive function away from the main thread?"

eventually became:

```text
                    Worklet
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Wrapping     Scheduling    Lifecycle
          │            │            │
          │            ▼            │
          │       Worker Pool       │
          │                         │
          └───────────┬─────────────┘
                      ▼
                 Web Workers
```

The developer experience remains simple:

```js
import { wrap } from "worklet";

const expensive = wrap(expensiveFunction);

const result = await expensive(data);
```

But underneath, there is a runtime dealing with:

```text
Function registration
        ↓
Task creation
        ↓
Task queue
        ↓
Worker selection
        ↓
Message passing
        ↓
Promise resolution
        ↓
Timeout handling
        ↓
Worker replacement
        ↓
Idle worker termination
```

And that's what makes the abstraction interesting.

---

# Is JavaScript Still Single-Threaded?

A JavaScript execution context executes code sequentially but the browser can host multiple JavaScript execution contexts like

```text
Main Thread
Worker 1
Worker 2
Worker 3
Worker 4
...
```

Those contexts can execute simultaneously. They just simply don't share arbitrary JavaScript objects.

Web Workers are one of those mechanisms and Worklet builds an abstraction on top of them:

- It doesn't turn JavaScript into Go.
- It doesn't turn Workers into shared-memory threads.
- And it doesn't eliminate the cost of moving data.

What it does is make a capability that is otherwise fairly low-level feel like something much closer to

Multi-threading in JavaScript... Sort of.
