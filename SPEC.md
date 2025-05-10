# Multipost

Multipost is a web app which allows a user to crosspost to multiple social networks at the same time, and adjusts the post for each network.

The frontend will not talk to social networks or AI services directly. Instead, it will use the API provided by the backend, which will handle all communication with third-party endpoints.

## Platform

- All dependencies should be their latest version where possible, or the most recent version possible.
- JWT-based authentication.
- An API which the frontend uses.
  - Also allow the API to be called outside the frontend.
  - API uses the same JWT authentication as the frontend.

### Code Style and Libraries

- DO use TypeScript.
- DO use the Catppuccin theming from:
  - [https://github.com/catppuccin/tailwindcss](https://github.com/catppuccin/tailwindcss)
  - DO use the Catppuccin color palette.

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

- Theme: Catppuccin color palette, dark mode (Latté variant) and light mode
- Layout: Clean, organized posting interface with clear platform selection and preview capabilities
- Components: Modern form elements, platform-specific preview cards, media upload area with conversion status indicators
