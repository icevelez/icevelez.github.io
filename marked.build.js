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