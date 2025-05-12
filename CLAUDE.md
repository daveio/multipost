# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multipost is a Rails application for intelligent content sharing across multiple social media platforms. It provides AI-powered post optimization, thread creation, and content splitting capabilities to help users create the perfect content for different social platforms.

## Development Environment

### Setup

Initialize the development environment:

```bash
# Install dependencies and set up the application
bin/setup
```

### Running the Application

Run the development server:

```bash
# Start all development processes (Rails server, JS watcher, CSS watcher)
bin/dev
```

This starts the server on port 3000 by default. You can change the port by setting the PORT environment variable:

```bash
PORT=4000 bin/dev
```

## Common Commands

### Asset Building

```bash
# Build JavaScript assets
bun run build

# Build CSS assets
bun run build:css
```

### Database Operations

```bash
# Create and set up the database
bin/rails db:prepare

# Run database migrations
bin/rails db:migrate

# Reset the database and load seed data
bin/rails db:reset

# Load seed data
bin/rails db:seed
```

### Testing

```bash
# Run all tests
bin/rails test

# Run specific test file
bin/rails test test/path/to/test_file.rb

# Run specific test
bin/rails test test/path/to/test_file.rb:LINE_NUMBER

# Run system tests
bin/rails test:system
```

### Linting and Static Analysis

```bash
# Run RuboCop for code style checking
bin/rubocop

# Run Brakeman for security analysis
bin/brakeman
```

## Technical Architecture

The application is a Rails 8.0 application with the following architecture:

- **Backend**: Ruby on Rails 8.0 with SQLite database
- **Frontend**: Stimulus.js, Tailwind CSS 4.x, and Turbo
- **Asset Bundling**: Bun.js for JS and CSS bundling
- **Background Processing**: SolidQueue for job processing
- **Caching**: SolidCache for database-backed caching
- **WebSockets**: SolidCable for ActionCable implementation

### Key Components

1. **Rails 8 Features**: This project uses Rails 8, which includes new features like database-backed adapters for Rails.cache, Active Job, and Action Cable.

2. **Propshaft Asset Pipeline**: Instead of Sprockets, the application uses Propshaft for the asset pipeline.

3. **Bun.js Integration**: JavaScript and CSS bundling is handled through Bun.js.

4. **SolidQueue, SolidCache, SolidCable**: Database-backed implementations for Rails background jobs, caching, and WebSockets.

5. **Hotwire Stack**: The application uses Turbo and Stimulus for creating a SPA-like experience.

6. **Deployment**: Kamal is set up for Docker-based deployments.

## Code Organization

The standard Rails directory structure is used:

- `app/` - Contains the core application code
  - `assets/` - Images, stylesheets, and compiled assets
  - `javascript/` - JavaScript code including Stimulus controllers
  - `controllers/` - Rails controllers
  - `models/` - Active Record models
  - `views/` - ERB templates
- `bin/` - Application binaries and scripts
- `config/` - Configuration files
- `db/` - Database files and migrations
- `test/` - Test files

## Testing and Quality Assurance

The application uses Rails' built-in testing framework with parallel test execution. The test suite includes:

- Unit tests
- Controller tests
- Integration tests
- System tests using Capybara and Selenium Webdriver

## Deployment

The application can be deployed using Kamal, a tool for deploying Rails applications as Docker containers.

```bash
# Deploy using Kamal
bin/kamal deploy
```

## Additional Notes

- Uses Thruster gem to add HTTP asset caching/compression and X-Sendfile acceleration to Puma
- Ruby debugging is enabled by default in the development environment through the debug gem
- For security checks, use Brakeman via `bin/brakeman`
