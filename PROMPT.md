I want you to build ONLY the frontend for the spec described in the attached paste. Use the `@nuxt/ui` UI kit. Make it very visually appealing but functional, with plenty of real time feedback, especially when it comes to character count. Optimise it for desktop use, not mobile, but make it work on mobile too. I also want you to create a README which explains all of the backend endpoints which are required - what they need to return, their paths, details about them. Everything I will need to implement the backend myself, and/or get AI to work on it without any other insight into the codebase, just the README and **nothing** else. Assume the backend will speak GraphQL and JSON. Create a mock backend and allow it to use it when configured to do so, so that it can be browsed in development before we've had a chance to write the backend.

# Multipost

Multipost is a web app which allows a user to crosspost to multiple social networks at the same time, and adjusts the post for each network.

## Platform

- Nuxt, latest version.
  - Create a new Nuxt project using `bun create nuxt@latest`.
    - Enable the `ui` module.
    - Enable the `fonts` module.
    - Enable the `icon` module.
    - Enable the `image` module.
    - Enable the `eslint` module.
    - Enable the `scripts` module.
    - Enable the `test-utils` module.
  - All dependencies should be their latest version where possible, or the most recent version possible.
  - Feel free to add Nuxt modules.
- JWT-based authentication.
- An API which the frontend uses.
  - Also allow the API to be called outside the frontend.
  - API uses the same JWT authentication as the frontend.

### Running the app

Start the dev server with `bun run dev`.

### `package.json`

```json
{
  "name": "multipost-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/eslint": "1.3.0",
    "@nuxt/fonts": "0.11.3",
    "@nuxt/icon": "1.12.0",
    "@nuxt/image": "1.10.0",
    "@nuxt/scripts": "0.11.6",
    "@nuxt/test-utils": "3.18.0",
    "@nuxt/ui": "3.1.1",
    "@unhead/vue": "^2.0.8",
    "eslint": "^9.26.0",
    "nuxt": "^3.17.2",
    "typescript": "^5.8.3",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1"
  },
  "trustedDependencies": ["@parcel/watcher", "@tailwindcss/oxide", "esbuild", "sharp", "unrs-resolver", "vue-demi"],
  "packageManager": "bun@1.2.13"
}
```

### Code Style and Libraries

- DO use TypeScript.
- Do use the [https://github.com/nuxt/ui](https://github.com/nuxt/ui) UI kit.
- DO use the Catppuccin theming from:
  - [https://github.com/catppuccin/daisyui](https://github.com/catppuccin/daisyui)
  - [https://github.com/catppuccin/tailwindcss](https://github.com/catppuccin/tailwindcss)
  - DO use the Catppuccin color palette.
- The following libraries may be helpful, but feel free to use others if they are more appropriate:
  - [https://nuxt.com/modules/fonts](https://nuxt.com/modules/fonts)
  - [https://nuxt.com/modules/icon](https://nuxt.com/modules/icon)
  - [https://nuxt.com/modules/image](https://nuxt.com/modules/image)

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
- Theme: Catppuccin color palette, dark mode (Latté variant) and light mode
- Layout: Clean, organized posting interface with clear platform selection and preview capabilities
- Components: Modern form elements, platform-specific preview cards, media upload area with conversion status indicators
