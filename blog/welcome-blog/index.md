![Happy Dog](./assets/happy-dog.webp)

# Hello viewer

This is my first blog. I don't know how blogs work or how to make so I'm just typing out what's on my mind

I was inspired to make this by [Emil Privér's](https://priver.dev/) website which had this simple yet elegant look. It is powered by Hugo, a Framework that compiles markdown files as HTML using Go but I'd like to go on a different route

My goal was to create blog pages client-side (browser) which means no build step ergo no Frameworks which will quite a challenge and to overcome that challenge my first idea is to convert markdown (.md) to HTML and inject it to the DOM which led me to [Marked](https://github.com/markedjs/marked)

directory structure

```
├── index.html
├── style.css
├── marked.min.js
├── marked.build.js
└── blog
    ├── index.html
    └── welcome-blog
        ├── index.html
        └── index.md
    └── upcoming-blog...
        ├── index.html
        └── index.md
```

The idea is to use `fetch` to download `index.md`, parse it as a text then use `marked.min.js` to convert it to HTML then insert it to `id="content"` and repeat that for every blog site that will come next


```
fetch("index.md").then((response) => response.text()).then((data) => {
    const contentElement = document.getElementById("content");
    if (!contentElement) {
        alert("content element not found")
        return;
    }

    try {
        if (!marked) {
            alert("marked.js not found")
            return;
        }
        contentElement.innerHTML = marked.parse(data)
    } catch (error) {
        alert("something went wrong converting markdown to html")
        console.error(error);
        return;
    }
}).catch((error) => {
    alert("failed to retrieve content");
    console.error(error);
})
```

I don't have the hassle of a build process but that also means I have to do things more manually like adding in a new blog entry in `/blog/index.html` and the caveat that `marked.js` brings (like no syntax highlight for code blocks) but to me it's an okay compromise to meet the goal of "no build step"

