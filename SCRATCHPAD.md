# Active Notes

## Sample Post

> Blake's 7 (1978): The BBC's criminally underappreciated sci-fi masterpiece that makes Game of Thrones look tame. Created by Terry Nation (Daleks), this series follows convicted criminals stealing an alien ship to fight the totalitarian Federation. What made it revolutionary? Main characters die permanently, heroes aren't heroic, and the politics feel uncomfortably real. Kerr Avon (Paul Darrow) became the breakout star—a brilliant, cynical anti-hero whose emotional detachment masked glimpses of humanity. The show influenced everything from BSG to The Expanse, featuring early representation with diverse casting and fully realized female characters. The series finale remains one of TV's most shocking endings. Available on streaming platforms—give it three episodes. Fair warning: don't get attached to anyone.

## Future Features

- Add animated thread navigation indicators
- Add emoji-based thread mood tagging system
- Add media transcoding for different platform requirements
- Add playful loading animations with platform-specific mascots
- Add subtle micro-interactions for improved user engagement
- Add subtle micro-interactions for thread navigation
- Build account management system for multiple accounts per platform
- Create a configurable notification system for post sharing status
- Create a mood-based content recommendation system
- Create a personalized thread recommendation engine
- Create a thread complexity score visualization
- Create an elegant onboarding tutorial with interactive walkthrough
- Create an optional progressive webapp with an interface adjusted for mobile devices.
  - Don’t change the normal desktop interface.
- Develop a collaborative thread editing mode
- Develop a color-coded platform compatibility indicator
- Develop a shareable config export/import feature
- Develop an accessibility-focused keyboard navigation mode
- Implement a playful ‘thread mood’ color-coding system
- Implement a thread preview sharing widget with one-click social share
- Implement a ‘Copy Thread Preview’ feature
- Implement a ‘Preview Across Platforms’ visual simulator
- Implement an intelligent content preview optimization tool
- Implement responsive design breakpoints for better mobile and tablet UI
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

## Threading Indicator Fixes

- Whenever threading indicatorrs are used, make sure two newlines are used beforehand.

### Good

```plaintext
Blake's 7 featured early representation with diverse casting and strong female characters. Its finale is one of TV's most shocking. Available on streaming platforms—give it three episodes. Fair warning: don't get attached to anyone.

🧵 2 of 3
```

### Bad

```plaintext
Blake's 7 featured early representation with diverse casting and strong female characters. Its finale is one of TV's most shocking. Available on streaming platforms—give it three episodes. Fair warning: don't get attached to anyone. 🧵 2 of 3
```

- Update the tests if neceesary, run them, and make sure they pass.
  - If they don't, fix the code or the tests until they do.
- Document all of your changes, design, code, and tests, in `README.md`.
