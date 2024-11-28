/*
    Author: John Iceberg Velez 
    Description: x-tracker.js a reacitive primitive inspired from Solid.js signal as a proof-of-concept for building my own reacivity system 
*/

const tracked = {
    signals : [],
    dependants : [],
    dependencies : [],
    runningComputed : false,
    runningWatcher : false,
    watchers : [],
};

const untracked = {
    signals : [],
    dependencies : [],
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = (c == 'x') ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function useSignal(initialValue) {

    let id = uuidv4();
    let value = initialValue;

    const dependencies = new Set();
    
    const addComputedAsDependency = (callback) => {
        dependencies.add(callback);
        return () => dependencies.delete(callback);
    }

    const clearDependencies = () => dependencies.clear();

    const get = () => {
        if (tracked.runningComputed) tracked.dependants.push(addComputedAsDependency);
        return value;
    }

    const set = (newValue) => {
        value = newValue;
        dependencies.forEach((dependency) => dependency());
    }

    const update = (callback) => {
        if (typeof callback !== 'function') throw `Error: callback should be a function.`;
        set(callback(value) || value);
    }

    const push = (...args) => {
        if (value.constructor.name !== 'Array' || !Array.isArray(value)) throw 'value is not an array';
        value.push(...args);
        set(value);
    }

    const splice = (start, deleteCount) => {
        if (value.constructor.name !== 'Array' || !Array.isArray(value)) throw 'value is not an array';
        value.splice(start, deleteCount);
        set(value);
    }

    const pipe = (...operators) => {
        return { ...operators.reduce((signal, operator) => {
            if (typeof operator !== 'function') throw `Error: operator should be a function.`;
            return operator(signal);
        }, data), set };
    };

    const data = { id, value, get, set, update, push, splice, pipe, clearDependencies, dependencies };

    (tracked.runningWatcher) ? tracked.signals.push(data) : untracked.signals.push(data);

    return data;
}

export function useComputed(callback) {
    if (typeof callback !== 'function') throw `Error: callback should be a function.`;
    // if (tracked.runningComputed) throw 'Error: computed() should not be called inside another computed().';
    
    if (tracked.runningComputed) {
        const signal = useSignal(callback());
        const { set, ...data } = signal;
        return data;
    }
    
    tracked.runningComputed = true;
    
    const signal = useSignal(callback());
    const setup = () => signal.set(callback());

    tracked.dependants.forEach((dependant) => {
        const removeDependency = dependant(setup);
        (tracked.runningWatcher) ? tracked.dependencies.push(removeDependency) : untracked.dependencies.push(removeDependency);
    });
    tracked.dependants = [];

    tracked.runningComputed = false;

    const { set, ...data } = signal;
    return data;
}

export function useWatcher(callback) {
    if (typeof callback !== 'function') throw `Error: callback should be a function.`;
    if (tracked.runningWatcher) throw 'Error: useWatcher() should not called inside another userWatcher().';

    const dependencies = new Set();
    const signals = [];

    tracked.runningWatcher = true;

    callback();
    
    tracked.dependencies.forEach((removeDependency) => dependencies.add(removeDependency));
    tracked.dependencies = [];

    tracked.signals.forEach((signal) => signals.push(signal));
    tracked.signals = [];

    tracked.runningWatcher = false;

    const watcher = Object.freeze({
        destroy : () => dependencies.forEach((removeDependency) => removeDependency()),
        signals,
        dependencies,
    });

    tracked.watchers.push(watcher);
    
    return watcher;
}

export function httpClient(resource, options = {}) {
    if (typeof options != 'object' || Array.isArray(options)) throw 'Error! options is not an object';

    let signal = useSignal();

    const abortController = new AbortController();
    options.signal = abortController.signal;
    setTimeout(() => {
        console.log("fetch")
        fetch(resource, options).then((value) => {
            signal.set(value);
        });
    }, 1000)

    return signal;
}

// ==================

function generateString(length = 16) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function attachReactivity(template, variables) {
    const handlebarRegex = /(\{\{[\s]*.*?[\s]*\}\})/g;  // found this in some Stackoverflow forum, I lost the link and can't find it
    const functionVariables = Object.keys(variables).reduce((string, key) => string + `const ${key} = (() => data['${key}'])();`, '');

    const xif = template.querySelectorAll('[x-if]');
    xif.forEach((element) => {

        const anchorNode = new Text();
        insertAfter(anchorNode, element);

        const handlebarExpress = element.getAttribute('x-if');
        const expression = handlebarExpress.substring(2, handlebarExpress.length - 2);
        const anonymousFunction = new Function('data', `${functionVariables}; return ${expression};`);

        element.removeAttribute('x-if');

        if (element.nodeName.toLowerCase() === 'x-container') {
            element.parentNode.removeChild(element);

            const children = Array.from(element.children);

            useComputed(() => {
                if (!anonymousFunction(variables)) return children.forEach((child) => child.parentNode.removeChild(child));
                
                const fragment = new DocumentFragment();
                fragment.append(...children);
                
                insertAfter(fragment, anchorNode);
            });

            return;
        }
        
        useComputed(() => {
            anonymousFunction(variables) ? insertAfter(element, anchorNode) : element.parentNode.removeChild(element)
        });
    });
    
    const xfor = template.querySelectorAll('[x-for]');
    xfor.forEach((element) => {

        const anchorNode = new Text();
        insertAfter(anchorNode, element);

        const key = element.getAttribute('x-key');
        const handlebarExpress = element.getAttribute('x-for');
        const expression = handlebarExpress.substring(2, handlebarExpress.length - 2);
        const anonymousFunction = new Function('data', `${functionVariables}; try { return ${expression}; } catch (error) { return null; }`);

        element.removeAttribute('x-for');
        element.removeAttribute('x-key');
        
        let existingElements = [];
        let existingData = [];
        
        element.parentNode.removeChild(element);

        if (element.nodeName.toLowerCase() === 'x-container') {
            const children = Array.from(element.children);

            useComputed(() => {
                if (existingElements.length > 0) {
                    existingElements.forEach((element) => element.parentNode.removeChild(element));
                    existingElements = [];
                }
                
                const array = anonymousFunction(variables);

                if (!array) return;

                array.reverse().forEach((item, i) => {
                    
                    const clonedChildren = children.map((child) => child.cloneNode(true));

                    const div = document.createElement('div');
                    div.append(...clonedChildren);

                    const data = { ...variables };
                    data[key] = item;
                    data.i = (array.length - 1) - i;

                    attachReactivity(div, data);

                    const divChildren = Array.from(div.children);

                    const fragment = new DocumentFragment();
                    fragment.append(...divChildren);

                    insertAfter(fragment, anchorNode);
                    
                    existingElements.push(...divChildren);
                })
                
            });

            return;
        }
        
        useComputed(() => {
            if (existingElements.length > 0) {
                existingElements.forEach((element) => element.parentNode.removeChild(element));
                existingElements = [];
            }

            const array = anonymousFunction(variables);

            if (!array) return;
            
            array.reverse().forEach((item, i) => {
                
                const template = element.cloneNode(true);

                const data = { ...variables };
                data[key] = item;
                data.i = (array.length - 1) - i;

                attachReactivity(template, data);
                insertAfter(template, anchorNode);
                
                existingElements.push(template);
            })
        });
    });

    const xclick = template.querySelectorAll('[x-click]');
    xclick.forEach((element) => {
        const handlebarExpress = element.getAttribute('x-click');
        const expression = handlebarExpress.substring(2, handlebarExpress.length - 2);
        const anonymousFunction = new Function('data', `${functionVariables}; return ${expression};`);

        element.removeAttribute('x-click');
        console.log(anonymousFunction(variables))
        element.addEventListener('click', event => anonymousFunction(variables)(event));
    });

    const xall = template.querySelectorAll('*');
    xall.forEach((element) => {
        const attributes = {
            href : element.getAttribute('href'),
            class : element.getAttribute('class'),
            style : element.getAttribute('style'),
            type : element.getAttribute('type'),
            title : element.getAttribute('title'),
            placeholder : element.getAttribute('placeholder'),
            value : element.getAttribute('value')
        }

        Object.entries(attributes).forEach(([key, value]) => {
            if (!value || value === '') return;

            Array.from(new Set(value?.match(handlebarRegex))).forEach((handlebar) => {
                const expression = handlebar.substring(2, handlebar.length - 2);
                const anonymousFunction = new Function('data', `${functionVariables}; return ${expression};`);

                useComputed(() => {
                    element[key] = value.replace(handlebar, anonymousFunction(variables));
                    element.setAttribute(key, value.replace(handlebar, anonymousFunction(variables)));
                })
            });
        })
    }) 

    const xcontainer = template.querySelectorAll('x-container');
    const xcontainerPlaceback = Array.from(xcontainer).map((element) => {
        const placeholderNode = document.createElement('placeholder');
        placeholderNode.id = generateString();

        insertAfter(placeholderNode, element);
        element.parentNode.removeChild(element);

        return () => insertAfter(element, document.querySelector(`#${placeholderNode.id}`));
    });

    let innerText = Array.from(new Set(template.innerText.match(handlebarRegex))) || [];
    innerText = innerText.reduce((elements, handlebar, i) => {
        const expression = handlebar.substring(2, handlebar.length - 2);
        const anonymousFunction = new Function('data', `${functionVariables}; return ${expression};`);
        const id = generateString();

        template.innerHTML = template.innerHTML.replaceAll(handlebar, `<placeholder id="${id}">${handlebar}</placeholder>`);
        
        elements.push({ id, anonymousFunction });

        return elements;
    }, []);
    innerText.forEach(({ id, anonymousFunction }) => {

        const placeholderTexts = Array.from(template.querySelectorAll(`#${id}`));

        const texts = placeholderTexts.map((placeholderText) => {
            const text = new Text('');
            placeholderText.parentNode.replaceChild(text, placeholderText);
            return text;
        });
                            
        useComputed(() => {
            const newValue = `${anonymousFunction(variables)}`;
            texts.forEach((text) => {
                if (text.textContent === newValue) return;
                text.textContent = newValue;
            })
        });
    });

    xcontainerPlaceback.forEach((callback) => callback());
}