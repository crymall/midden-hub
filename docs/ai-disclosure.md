# AI Disclosure

There's a lively ongoing discussion within the programming community about the use of AI in software development. I won't wade too deep into this beyond communicating a deep skepticism of AI as a companion, therapist, doctor, artist, or writer, and a grudging acknowledgement of its utility, judiciously-applied, in designing and implementing projects involving code.

Regardless of my opinion on the matter, however, two things are true: 1) LLMs are being used, to some extent, in nearly every enterprise software project imaginable, and 2) I'm trying to follow enterprise-standard practices in my work on Midden. Therefore, I've been playing around with Gemini and Claude's various models on this project. During the design phase, I used them as a sounding board, proposing stacks and asking them to generate architectures, design database schemas, and suggest industry-standard technologies based on my applications' needs and use cases. During developement, I would ask them to generate unit tests and other repetitive patterns, review code that I'd written, and help debug any bugs or implementation issues I encountered.

I reviewed, added, and committed my code manually, line-by-line. I chose not to adopt a fully-agentic approach, which I define as autonomous AI agents reviewing code, generating it, committing it, and making PRs in the codebase. Although this isn't necessarily the industry-standard approach, I think it's important, for a few reasons:

- I understand, am responsible for, and am able to debug the code I've written.
- I use a tiny fraction of the tokens that a fully-agentic developer uses, which both mitigates the environmental impact of my work and prepares me for the likely future where tokens are much less affordable.

All of this being said, although I worked very hard to ensure that the application is as secure as a hobby project can possibly be, please use caution with this, and any app you engage with on the Internet these days. If you're still using the same password for everything, don't. While even enterprise teams shouldn't be promising this, as a single developer, I can't make an ironclad promise that your information will be safe. 

As a side note, I've pasted a note that I've added to my global agent instuctions below. I find it to be useful on the mental health front.

`Don't compliment me for "good questions" I might ask or refer to me at all unless absolutely necessary. Please attempt to respond as matter-of-factly as possible, and remove as much tone from your voice as you can, unless I explicitly ask you to speak in a particular register.`