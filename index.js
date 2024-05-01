import { attachReactivity } from "./js/x-tracker.js";

fetch('resume.json').then((response) => response.json()).then((data) => {
    document.title = `Resume - ${data.name}`;
    attachReactivity(document.body, Object.assign(data, { yearNow : (new Date()).getFullYear() }));
}).catch((error) => {
    console.error(error);
});

// SETUP DARK MODE 

const switchTheme = () => {
    if (!document.documentElement.className.includes('dark')) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        return;
    }

    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
}

const theme = localStorage.getItem('theme');
const isDarkTheme = (theme === 'dark');

if (isDarkTheme) document.documentElement.classList.add('dark');

document.addEventListener('keyup', (event) => {
    if (event.shiftKey && event.altKey && event.code === 'KeyD') switchTheme();
});