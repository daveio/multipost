# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multipost is a Rails application for intelligent content sharing across multiple social media platforms. It provides AI-powered post optimization, thread creation, and content splitting capabilities to help users create the perfect content for different social platforms.

### Technology Stack

- **Backend**: Ruby on Rails 8.0 with SQLite database
- **Frontend**: Stimulus.js, Tailwind CSS, and Turbo
- **Asset Bundling**: Bun.js for JS and CSS bundling
- **Background Processing**: SolidQueue for job processing
- **Caching**: SolidCache for database-backed caching
- **WebSockets**: SolidCable for ActionCable implementation
- **Authentication**: Devise

## Common Commands

### Development

```bash
# Set up the development environment
bin/setup

# Start the development server (Rails, JS watcher, CSS watcher)
bin/dev

# Start with a custom port
PORT=4000 bin/dev

# Build JavaScript
bun run build:js

# Build CSS
bun run build:css
```

### Testing

```bash
# Run all tests
bin/rails test

# Run a specific test file
bin/rails test test/models/user_test.rb

# Run a specific test (by line number)
bin/rails test test/models/user_test.rb:10

# Run system tests
bin/rails test:system

# Run tests with coverage report
bin/rails test:coverage

# Run visual regression tests with Percy
bin/rails test:visual

# Run visual regression tests locally
bin/rails test:visual_local
```

### Linting and Static Analysis

```bash
# Run RuboCop for Ruby code style checking
bin/rubocop

# Run Brakeman for security analysis
bin/brakeman

# Run Biome for JavaScript linting
npx @biomejs/biome check app/javascript
```

### Deployment

```bash
# Deploy using Kamal
bin/kamal deploy
```

## Architecture

### Backend

The application follows the standard Rails MVC architecture:

- **Models**: Represent database tables and business logic
- **Controllers**: Handle HTTP requests and responses
- **Views**: Render HTML using ERB templates

### Key Models

The application is likely to have these key models:

- **User**: Authentication and user data
- **Post**: Content to be shared across platforms
- **Platform**: Supported social media platforms
- **Account**: User's credentials for each platform
- **MediaFile**: Images and other media attached to posts
- **Draft**: Saved but not published content
- **SplittingConfiguration**: Rules for splitting posts across platforms

### Frontend

- Uses Rails' Hotwire stack with Turbo and Stimulus
- CSS is handled with Tailwind CSS and PostCSS
- JavaScript is bundled with Bun

### Database

- Uses SQLite database
- Leverages SolidQueue, SolidCache, and SolidCable for background processing, caching, and WebSockets

### Dependencies

- See Gemfile for Ruby dependencies
- See package.json for JavaScript dependencies

## Code Style Guidelines

- Ruby code follows RuboCop guidelines defined in .rubocop.yml
- JavaScript code follows Biome linting rules
- Ruby version: 3.4.3
- Use double quotes for string literals
- Follow Rails naming conventions
