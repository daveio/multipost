# Multipost Test Suite

This document provides a comprehensive guide to the Multipost test suite.

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Test Helpers](#test-helpers)
6. [Fixtures and Factories](#fixtures-and-factories)
7. [Mocks and Stubs](#mocks-and-stubs)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Database Cleanliness](#database-cleanliness)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

The Multipost test suite uses Rails' built-in testing framework along with several enhancements to provide comprehensive test coverage. The suite is designed to be:

- **Fast**: Tests run in parallel when possible
- **Isolated**: Tests do not depend on each other
- **Comprehensive**: All key functionality is covered
- **Maintainable**: Organized with contexts, shared examples, and helpers

## Test Types

The test suite includes several types of tests:

### Unit Tests

Unit tests verify that individual components work as expected in isolation. These include:

- **Model Tests**: Testing validations, associations, and methods
- **Helper Tests**: Testing helper methods
- **Service Tests**: Testing service objects like `OpenaiService`

### Integration Tests

Integration tests verify that components work together correctly:

- **Controller Tests**: Testing controller actions, responses, and redirects
- **API Tests**: Testing API endpoints and responses

### System Tests

System tests verify the application's functionality from a user's perspective:

- **Feature Tests**: Testing user workflows
- **Visual Regression Tests**: Testing UI appearance and consistency

## Test Structure

The test suite follows this structure:

```
test/
├── fixtures/            # Test data fixtures
├── models/              # Model tests
├── controllers/         # Controller tests
├── integration/         # Integration tests
│   └── api/             # API-specific integration tests
├── system/              # System tests
├── support/             # Test helpers and support files
└── README.md            # This file
```

## Running Tests

The test suite can be run in several ways:

```bash
# Run all tests
bin/rails test

# Run specific test types
bin/rails test:models
bin/rails test:controllers
bin/rails test:system

# Run specific test files
bin/rails test test/models/user_test.rb

# Run specific tests
bin/rails test test/models/user_test.rb:42

# Run with coverage report
bin/rails test:coverage

# Run visual regression tests
bin/rails test:visual           # With Percy (requires API token)
bin/rails test:visual_local     # Local screenshots only
```

## Test Helpers

The test suite includes several helpers to simplify test writing:

### Post Test Helpers

Helpers for creating and testing posts:

```ruby
create_post(attributes = {}, user = users(:john))
create_thread(post_count = 3, user = users(:john))
attach_media(uploadable, file_type = 'image/jpeg', user = nil)
assert_post_attributes(post, expected_attributes)
assert_post_includes_platform(post, platform_id)
assert_thread_size(post, expected_thread_size)
```

### Auth Test Helpers

Helpers for authentication testing:

```ruby
sign_in_user(user = users(:john))
sign_out_user
assert_user_signed_in
assert_user_signed_out
create_user(attributes = {})
register_user(attributes = {})
```

### Platform Test Helpers

Helpers for platform testing:

```ruby
create_platform(attributes = {})
create_account(user = users(:john), platform_id = "bluesky", attributes = {})
create_splitting_configuration(user = users(:john), name = nil, strategies = ["semantic"])
assert_valid_platform(platform)
assert_valid_account(account, platform_id = nil)
active_accounts_for(user, platform_id)
```

### API Test Helpers

Helpers for API testing:

```ruby
get_auth_token(user, password = "password123")
api_get(endpoint, token, params = {})
api_post(endpoint, token, params = {})
api_patch(endpoint, token, params = {})
api_delete(endpoint, token)
assert_api_response_has_keys(response, keys)
assert_api_response_matches(response, attributes)
assert_api_has_validation_errors(response, fields)
assert_api_requires_authentication(endpoint, method = :get, params = {})
assert_api_enforces_authorization(endpoint, token, method = :get, params = {})
```

### OpenAI Test Helpers

Helpers for mocking OpenAI:

```ruby
mock_openai_service do
  # Test code that uses OpenAI
end
```

### Platform API Mock Helpers

Helpers for mocking social media platform APIs:

```ruby
mock_platform_apis do
  # Test code that uses platform APIs
end

mock_platform_service(platform_name, account = nil)
```

### Visual Regression Helpers

Helpers for visual regression testing:

```ruby
visual_snapshot(name, options = {})
visual_compare_themes(name, themes = ['latte', 'frappe', 'macchiato', 'mocha'])
visual_compare_responsive(name, sizes = {})
save_debug_screenshot(name)
```

### Test Context Helpers

Helpers for organizing tests:

```ruby
context "with specific state" do
  setup do
    # Context-specific setup
  end
  
  test "behaves correctly" do
    # Test code
  end
end
```

### Shared Example Helpers

Helpers for sharing test behavior:

```ruby
shared_examples_for "common behavior" do |param|
  test "behaves in standard way" do
    # Test code using param
  end
end

include_examples "common behavior", value
```

## Fixtures and Factories

The test suite uses both fixtures and factories:

### Fixtures

Fixtures are YAML files in `test/fixtures/` that define baseline test data for every test.

### Factories

Factory methods provide more flexible ways to create test data:

```ruby
create_user_with(attributes = {})
create_platform_account_for(user, platform_name, attributes = {})
create_post_for(user, content, attributes = {})
create_thread_for(user, post_count = 3, attributes = {})
create_media_file_for(uploadable, filename = "test_image.jpg", user = nil, attributes = {})
create_draft_for(user, content, attributes = {})
create_splitting_config_for(user, name, strategies = ['semantic'], attributes = {})
```

## Mocks and Stubs

The test suite includes mocks for external services:

### OpenAI Mock

The `MockOpenaiService` class provides predictable responses for OpenAI API calls during testing.

### Platform API Mocks

The following mocks are available for platform APIs:

- `MockBlueskyService`
- `MockMastodonService`
- `MockThreadsService`

## Visual Regression Testing

Visual regression testing captures screenshots of the UI and compares them to detect unintended visual changes:

### Percy Integration

Percy integration is available for cloud-based visual comparison:

```bash
export PERCY_TOKEN=your_token_here
bin/rails test:visual
```

### Local Screenshots

Local screenshots can be captured without Percy:

```bash
bin/rails test:visual_local
```

Screenshots are saved to `tmp/screenshots/`.

## Database Cleanliness

The test suite uses DatabaseCleaner to ensure test isolation:

### Strategies

- **Transaction**: Used for model and controller tests (fast)
- **Truncation**: Used for system tests (handles JavaScript)
- **Deletion**: Available for special cases

### Customizing Cleaning Strategy

```ruby
DatabaseCleanerHelper.use_deletion do
  # Test code that requires deletion strategy
end
```

## Best Practices

When writing tests, follow these best practices:

### General

- **Isolated Tests**: Each test should be independent
- **Clear Assertions**: Make clear what you're testing
- **Fast Tests**: Keep tests fast to maintain productivity
- **Complete Coverage**: Aim for high code coverage

### Model Tests

- Test validations
- Test associations
- Test scopes
- Test instance methods
- Test class methods

### Controller Tests

- Test successful responses
- Test error handling
- Test redirects
- Test authentication and authorization

### System Tests

- Test critical user flows
- Test edge cases
- Test UI elements

### API Tests

- Test authentication
- Test authorization
- Test response format
- Test error handling

## Troubleshooting

### Common Issues

#### Tests Pass Locally But Fail in CI

- Check for time-dependent tests
- Check for order-dependent tests
- Check for environment-specific tests

#### Slow Tests

- Use profiling to identify slow tests
- Use DatabaseCleaner transaction strategy when possible
- Avoid unnecessary database operations

#### Flaky Tests

- Check for race conditions
- Use proper waiting mechanisms in system tests
- Avoid time-dependent assertions

### Getting Help

If you encounter issues with the test suite, please:

1. Check this documentation
2. Review existing test files for examples
3. Contact the development team if you need further assistance