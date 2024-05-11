# i18next-ai-keyscan

![Statements](https://img.shields.io/badge/statements-91.54%25-brightgreen.svg?style=flat)
![Branches](https://img.shields.io/badge/branches-93.93%25-brightgreen.svg?style=flat)
![Functions](https://img.shields.io/badge/functions-80%25-yellow.svg?style=flat)
![Lines](https://img.shields.io/badge/lines-91.54%25-brightgreen.svg?style=flat)


An **unofficial** [i18next](https://www.i18next.com/) CLI utility to extract labels from any source code, in any format
with the help of OpenAI.

Converts
````jsx
// src/app.jsx
function App(){
    const [t] = useTransition();
    return (<div>t("main:title-"+"page")</div>);
}
// src/component/home.jsx
function Home(){
    const [t] = useTransition();
    const myTranlsation = t;
    return (<div>myTranlsation("home:welcome")</div>);
}
````
to

````json
{
  "main:title-page":  true,
  "home:welcome":  true
}
````


### Getting Started

````bash
npm i -g i18next-ai-keyscan

# MacOS (optional)
# export OPENAI_API_KEY='your-api-key-here'

# Windows (optional)
# setx OPENAI_API_KEY "your-api-key-here"
````

### Clone any repository containing locize/i18next-react source code.
````bash
cd /tmp && git clone https://github.com/locize/react-tutorial
````
````bash
# Gets a cost prediction to process all files ending with .js in ``/tmp/react-tutorial``
i18next-ai-keyscan --target /tmp/react-tutorial --filter .*\.js$ --dry-run

# Scans all files ending with .js in ``/tmp/react-tutorial`` (absolute path)
i18next-ai-keyscan --target /tmp/react-tutorial --filter .*\.js$ --output /tmp/labels.json --chunk-length 12000 --verbose

# Scans all files ending with .js in ``./react-tutorial`` (relative path)
i18next-ai-keyscan --target ./react-tutorial --filter .*\.js$ --output ./labels.json --chunk-length 12000 --verbose

# Scans all files ending with .js in ``./react-tutorial`` (relative path) providing a custom prompt
# Note: summary is the key selected key of the provided custom-prompts.json
i18next-ai-keyscan --target ./react-tutorial --filter .*\.js$ --output ./labels.json --chunk-length 12000 --verbose --prompts-file ./examples/custom-propmpts.json --prompt summary
````

#### Roadmap
- [x] Scan recursively all files and prompt OpenAI
- [x] Regex filter on files
- [x] Provide custom prompt chains
- [x] File splitting into chunks for fitting OpenAI max token limitation
- [ ] Respect OpenAI rate limiting + Parallelization
- [ ] Web GUI
- [ ] Provide more output options and support creation of drop in [locize](https://www.locize.app/) translation files.