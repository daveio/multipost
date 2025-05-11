# Active Notes

## Sample Post

> Blake's 7 (1978): The BBC's criminally underappreciated sci-fi masterpiece that makes Game of Thrones look tame. Created by Terry Nation (Daleks), this series follows convicted criminals stealing an alien ship to fight the totalitarian Federation. What made it revolutionary? Main characters die permanently, heroes aren't heroic, and the politics feel uncomfortably real. Kerr Avon (Paul Darrow) became the breakout star—a brilliant, cynical anti-hero whose emotional detachment masked glimpses of humanity. The show influenced everything from BSG to The Expanse, featuring early representation with diverse casting and fully realized female characters. The series finale remains one of TV's most shocking endings. Available on streaming platforms—give it three episodes. Fair warning: don't get attached to anyone.

## Future Features

- Add a 'Connection Health' widget showing real-time API integration status
- Add a playful 'Character Count Mood Indicator' that changes emoji based on remaining characters
- Add a playful 'Content Chameleon' feature that suggests platform-specific emoji and tone adjustments
- Add a secret 'Synthwave Mode' with everything visually ridiculous
- Add animated thread navigation indicators
- Add emoji-based thread mood tagging system
- Add media transcoding for different platform requirements
- Add playful loading animations with platform-specific mascots
- Add subtle micro-interactions for improved user engagement
- Add subtle micro-interactions for thread navigation
- Build account management system for multiple accounts per platform
- Create a 'Copy Formatting' button with smart clipboard integration
- Create a configurable notification system for post sharing status
- Create a mood-based content recommendation system
- Create a personalized thread recommendation engine
- Create a thread complexity score visualization
- Create an elegant onboarding tutorial with interactive walkthrough
- Create an intuitive 'Platform Compatibility Wizard' with step-by-step UI guidance
- Create an optional progressive webapp with an interface adjusted for mobile devices
  - Don't change the normal desktop interface
- Design a subtle toast notification system for API connection events
- Develop a 'Cross-Platform Preview' modal showing how the post will look on different social networks
- Develop a 'Social Media Energy Meter' showing content engagement potential
- Develop a collaborative thread editing mode
- Develop a color-coded platform compatibility indicator
- Develop a real-time 'Connection Health' widget with animated status indicators
- Develop a shareable config export/import feature
- Develop an accessibility-focused keyboard navigation mode
- Gamify the platform with achievement badges for successful cross-platform posts
- Implement a 'Copy Thread Preview' feature
- Implement a 'Preview Across Platforms' visual simulator
- Implement a dynamic platform icon animation when hovering over platform switches
- Implement a personalized platform recommendation engine based on content type
- Implement a playful 'thread mood' color-coding system
- Implement a thread preview sharing widget with one-click social share
- Implement an AI-powered 'Post Optimization Suggestions' tooltip with real-time feedback
- Implement an intelligent content preview optimization tool
- Implement responsive design breakpoints for better mobile and tablet UI
- Implement a 'Social Media Energy Dashboard' with animated engagement visualizations
- Integrate with actual social media APIs (Bluesky, Mastodon, Threads, Nostr)

## Review Pass

- Run a review pass over the whole codebase.
  - Look for bugs.
    - Fix any bugs you find.
  - Remove any dead or unreachable code or files.
  - Add extensive documentation in a `README.md`.
    - This should contain detailed information about absolutely everything in the app.
    - An AI model should be able to recreate the app ONLY by reading the `README.md`.
      - It should be able to get information about both the design and the logic.
      - It should only need to read the `README.md` - not have to look at any code.
      - Assume API keys are still provided externally.
      - Do not assume that you will be the model reading it.

## Tests

- Update the Vitest tests for the app.
  - Integrate them with Vite, which we are using already.
  - Run the tests.
  - Refine the tests until they pass.
    - If they surface any problems, fix those problems.
  - Keep the tests updated as we make changes and add features.
  - Document everything you do in `README.md`.
    - Also include how to run the tests.

## Theming

- Use the `catppuccin` theme framework for the look and feel of the site.
- Implementation details can be found in:
  - The `@catppuccin/palette` `npm` package.
  - Elsewhere in the [`catppuccin`](https://github.com/catppuccin) GitHub organisation.
  - Feel free to install the `@catppuccin/palette` package from `npm` and reference it directly or indirectly for the colours.
- Implement the four theme options:
  - Light theme:
    - `latte`
  - Dark theme:
    - `frappé`
    - `macchiato`
    - `mocha`
- Create a switcher utility in the top right which will let us switch between the four of them.
  - Categorise the list by light or dark theme.
  - Ensure the theme switcher works properly.
- Make sure that we are left with a visually appealing result in all four theme modes.
  - Previous attempts to implement a dark theme looked extremely unattractive and were almost unusable.
- Default to dark mode.
  - Use `Catppuccin Frappé` as the default dark mode.
  - Take a screenshot and ensure everything looks right.
- Update any appropriate tests and ensure they pass.
- Document all theme-related work, config, and changes extensively in the `README.md`.
