# Mossos-Express

This is the back-end code for API for 'mossos.in' webapp. 
Built using Node.js, Express.js, PostgreSQL, Prisma and served using NGINX on Digital Ocean.

# Project Status
No longer maintained.

# Setup

#### Requirements:

`node` and `npm` / `yarn`

#### Installation:

`npm i`

`prisma generate`

Use the appropriate `generate*.js` to create keys for encryption and authentication

#### Run development server:

`npm run dev`

#### Visit app:

`http://localhost:4000/`

# Reflection

I started Mossos.in which focused on serving fresh home-made food by home-chefs & small food business. This was a 3 month long project built while also working on the front-end and business side of things. Project goals included using technologies learned up until this point and also familiarizing myself with better or alternative technologies if the time constraints permitted.

LoopBack lets you create the API within a matter of minutes! While that is indeed magic, I wanted to work beneath the abstraction and be more flexible with Express for simplicity. Also as MongoDB is very flexible, I decided to go with PostgreSQL as the data was related. I chose Prisma over Knex.js to explore.

One of the main challenges I ran into was authentication, which is the same for the front-end. So I researched more into that and settled with JWT. Since I wanted to dig into auth myself, I decided not to rely on third party services to understand it completely. Another was setting up the server myself rather than using AWS, to get more understanding of how things work on bare-metal.

Where are the tests? This was more of a rapid ship-feedback-iterate project than a proper one. As a solo dev working on many things, due to many constraints, I had to table tests and focus more on functionality and features. Indeed, would've loved if there was a team!

At the end of the day, technologies and tools that save you time win, but getting to know what lies underneath the abstraction gives you more clarity. Bonus, you also get to learn by diving into it. Express over LoopBack, Digital Ocean over AWS, self-auth over hosted auth but it was all fun!
