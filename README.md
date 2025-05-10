Multipost is a web app which allows a user to crosspost to multiple social networks at the same time, and adjusts the post for each network.

## Platform

- Nuxt, latest version.
  - All dependencies should be their latest version where possible, or the most recent version possible.
  - Feel free to add Nuxt add-ons.
- JWT-based authentication.
- An API which the frontend uses.
  - Also allow the API to be called outside the frontend.
  - API uses the same JWT authentication as the frontend.

### Code Style and Libraries

- Do use TypeScript.
- Do not use React.
  - Do not use React components.
  - Do not use React libraries.
  - Do not use JSX or TSX.
- Do things the Vue way, instead of forcing TSX, React, and React components on Nuxt.
- Do not use shadcn.
  - Use DaisyUI instead.
  - Use the Catppuccin theming from:
    - [https://github.com/catppuccin/daisyui](https://github.com/catppuccin/daisyui)
    - [https://github.com/catppuccin/tailwindcss](https://github.com/catppuccin/tailwindcss)
  - Use the Catppuccin color palette.
  - Use the Catppuccin icon set.
- The following libraries may be helpful, but feel free to use others if they are more appropriate:
  - [https://github.com/nuxt/auth](https://github.com/nuxt/auth)
  - [https://github.com/nuxt/api](https://github.com/nuxt/api)

## Social Networks

Priority 1 is the highest priority. Priority 2 is less important than priority 1 and more important than priority 3, and so on.

### Priority 1: Core Networks

- Bluesky
- Mastodon (with custom instance)
- Threads
- Nostr

### Priority 2: Photo Sharing

- Instagram
- Pixelfed (with custom instance)

### Priority 3: Additional Social Networks

- Facebook

### Priority 4: Macroblogging

- Tumblr
- Pillowfort
- Dreamwidth

## Features

- Crosspost to multiple social networks at the same time.
  - Also allow multiple accounts per social network.
  - Also allow multiple instances for Mastodon and Pixelfed, with the option for multiple accounts per instance.
- Allow photos to be attached.
  - Adjust and convert the photos according to the requirements of the social networks.
  - Adjust and convert for each network separately unless the requirements are the same.
  - Require photos for **Photo Sharing** networks.
- Allow videos to be attached.
  - Transcode the videos according to the requirements of the social networks.
    - Transcode for each network separately unless the requirements are the same.

### Character Count

This is an important feature.

- Find the maximum character count for each social network.
  - On Mastodon this varies by instance. Fetch the character count from the instance(s) in use.
- Use AI to split the text into multiple posts while keeping the meaning of the post.
  - We can use Cloudflare or Vercel for AI functionality, I'm also open to other options.
  - Configure both and allow them to be switched between in the config file and/or environment variables.
- Add threading information (`🧵 x/y` where `x` is the current post and `y` is the total number of posts).

## Design

### Visual References

Inspired by Buffer and Hootsuite's posting interfaces, adapted with the Catppuccin color palette for a modern, cohesive look.

### Style Guide

- Design System: DaisyUI with Tailwind CSS v4
- Theme: Catppuccin color palette (implemented via [catppuccin/daisyui](https://github.com/catppuccin/daisyui) and [catppuccin/tailwindcss](https://github.com/catppuccin/tailwindcss))
- Layout: Clean, organized posting interface with clear platform selection and preview capabilities
- Components: Modern form elements, platform-specific preview cards, media upload area with conversion status indicators
