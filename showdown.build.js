const converter = new showdown.Converter();
fetch("index.md").then((response) => response.text()).then((data) => {
    const contentElement = document.getElementById("content");
    if (!contentElement) {
        alert("content element not found")
        return;
    }

    try {
        contentElement.innerHTML = converter.makeHtml(document.body)
    } catch (error) {
        alert("something went wrong converting markdown to html")
        console.error(error);
        return;
    }
}).catch((error) => {
    alert("failed to retrieve content");
})