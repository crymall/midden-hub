# [Midden](https://midden.reedgaines.com/)

### Midden
**noun** /ˈmɪdən/

1. A dung heap.
2. A refuse heap usually near a dwelling.
3. (**archaeology**) An accumulation, deposit, or soil derived from occupation debris, rubbish, or other by-products of human activity, such as bone, shell, ash, or decayed organic materials; or a pile or mound of such materials, often prehistoric.

*Excerpt from the Wiktionary entry for “midden”*

## About

Midden is a showcase of my capability as a technologist. This is for recruiters (*look! I'm a full-stack web developer!*), for friends (*hey! Here are some cool tools you can use!*), and for my own education. Working on Midden, and all its sub-apps, keeps me sharp and up-to-date.

Inside this repo, you'll find two separate applications: [**Midden**](https://midden.reedgaines.com/), which is a personal mono-app/hub of links to my work, and [**Canteen**](https://canteen.reedgaines.com/), which is a minimalist (yet technologically-sophisticated) recipe storage/sharing app. These apps, and all apps I'll make in the future for this project, have a shared UI sensibility and shared role-based authentication. Currently, everything is offered for free and open-source, but should anything become particularly popular or valuable, I'm not above setting up a Patreon or a Ko-fi in the future.

If you're interested in the technology behind/architecture of the app, please click [here](./docs/architecture.md) for a detailed breakdown. If you're interested in who I am, or would like to connect with me about my work, head on over to my [website](https://reedgaines.com/).

## Disclosure

There's a lively ongoing discussion within the programming community about the use of AI in software development. I won't wade too deep into this beyond communicating a deep skepticism of AI as a companion, therapist, doctor, artist, or writer, and a grudging acknowledgement of its utility, judiciously-applied, in designing and implementing projects involving code.

Regardless of my opinion on the matter, however, two things are true: LLMs are being used, to some extent, in nearly every enterprise software project imaginable, and I'm trying to follow enterprise-standard practices in my work on Midden. Therefore, I've been playing around with Gemini's 3.1 Pro model. During the design phase, I used it as a sounding board, proposing architectures and stacks and asking it to generate architectures and suggest industry-standard technologies based on my applications' needs and use cases. During developement, I would ask it to generate unit tests and other repetitive patterns, review code that I'd written, and help debug any bugs or implementation issues I encountered.

I reviewed, added, and committed my code manually, line-by-line. I chose not to adopt a fully-agentic approach, which I define as autonomous AI agents reviewing code, generating it, committing it, and making PRs in the codebase. Although this isn't necessarily the industry-standard approach, I think it's important, for a few reasons:

- I understand, am responsible for, and am able to debug the code I've written.
- I use a tiny fraction of the tokens that a fully-agentic developer uses, which both mitigates the environmental impact of my work and prepares me for the likely future where tokens are much less affordable.
- Over-engagement with agentic AI is bad for my mental health.

As a side note to that last point, I've pasted a note that I've added to "Instructions for Gemini" below, which it uses as global context for every conversation. I find it to be very useful on the mental health front.

```
Don't complement me for "good questions" I might ask or refer to me at all unless explicitly necessary. Please attempt to respond as matter-of-factly as possible, and remove as much tone from your voice as you can, unless I explicitly ask you to speak in a particular register. 
```

## License

Below is the standard MIT license.

Copyright © 2026 Joseph Gaines

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

