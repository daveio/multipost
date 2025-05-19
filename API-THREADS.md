# Threads API Integration for Multipost

## Overview

This document outlines how to integrate the Threads API with the Multipost application. Threads is Meta's text-based social media platform built as an extension of Instagram, designed for public conversations.

## Prerequisites

- Instagram Business or Creator account
- Facebook Developer account
- Meta app with required permissions
- Valid access tokens

## API Status and Access

As of the latest information, Meta has not yet released a public API for Threads. However, there are indications that an API is in development and may be released in the future. This document outlines the expected integration approach based on how Instagram's API works and Meta's standard practices.

## Expected Authentication

Since Threads is built on Instagram's infrastructure, authentication is likely to use the same OAuth 2.0 flow as Instagram:

1. Direct users to Facebook Login dialog
2. Receive authorization code
3. Exchange for access token
4. Use token for API requests

### Anticipated Required Permissions

- `threads_content_publish`: Create and publish Threads content
- `threads_manage_comments`: Manage comments on Threads posts
- `threads_manage_insights`: Access post performance metrics

## Content Publishing (Expected Endpoints)

Based on Instagram's API structure, we expect Threads API to follow similar patterns:

### Thread Posts

```ruby
# Example of potential Thread post creation (speculative)
def create_thread_post(user_id, content, reply_to_id = nil)
  endpoint = "https://graph.facebook.com/v18.0/#{user_id}/threads"
  
  payload = {
    message: content,
    access_token: access_token
  }
  
  # If replying to another thread
  payload[:reply_to_id] = reply_to_id if reply_to_id
  
  response = HTTP.post(endpoint, form: payload)
  return JSON.parse(response.body.to_s)
end
```

### Thread with Media

```ruby
# Example of potential Thread with media (speculative)
def create_thread_with_media(user_id, content, media_url)
  endpoint = "https://graph.facebook.com/v18.0/#{user_id}/threads"
  
  payload = {
    message: content,
    media_url: media_url,
    access_token: access_token
  }
  
  response = HTTP.post(endpoint, form: payload)
  return JSON.parse(response.body.to_s)
end
```

## Interim Approach: Workaround Solutions

Until an official API is available, Multipost can implement one of these approaches:

### 1. Instagram Integration as Proxy

Because Threads and Instagram share account infrastructure, posting to Instagram with appropriate formatting can sometimes result in cross-posting to Threads.

```ruby
# Use Instagram posting with special formatting
def post_to_threads_via_instagram(account, content, media_files = [])
  instagram_service = InstagramService.new(account)
  
  # Post to Instagram with formatting optimized for Threads
  result = instagram_service.post(content, media_files)
  
  # Track that we attempted to post to Threads via Instagram
  log_threads_cross_post_attempt(account, result["id"])
  
  return result
end
```

### 2. Email-to-Post Integration

If Meta offers an email-to-post feature for Threads, integrate with that:

```ruby
def post_to_threads_via_email(account, content, media_files = [])
  # Create email with content and media
  # Send to Threads posting email address
end
```

### 3. Notification-Only Mode

Until the API is available, implement a notification-only mode:

```ruby
def notify_for_manual_threads_posting(account, content, media_files = [])
  # Generate a formatted version of the post
  formatted_content = prepare_threads_content(content)
  
  # Send notification to user
  UserMailer.threads_post_reminder(
    account.user,
    formatted_content,
    media_files
  ).deliver_later
  
  return { status: "notification_sent" }
end
```

## Expected Implementation in Multipost

When the API becomes available, we should implement the following:

### Models

```ruby
# app/models/platform.rb
# Add Threads as a supported platform
SUPPORTED_PLATFORMS = %w[twitter mastodon bluesky facebook instagram threads]

# app/models/account.rb
# Store Threads credentials (likely shared with Instagram)
class Account < ApplicationRecord
  # Existing code...
  
  # For Threads accounts, potentially use:
  # - instagram_user_id (same as Threads ID)
  # - threads_access_token (may be the same as Instagram)
  
  def threads_enabled?
    # Logic to check if this Instagram account has Threads enabled
  end
end
```

### Services

Create a dedicated service for Threads API interactions:

```ruby
# app/services/threads_service.rb
class ThreadsService
  attr_reader :account
  
  def initialize(account)
    @account = account
  end
  
  def post(content, media_files = [], reply_to_id = nil)
    if media_files.any?
      post_with_media(content, media_files, reply_to_id)
    else
      post_text_only(content, reply_to_id)
    end
  end
  
  private
  
  def post_text_only(content, reply_to_id = nil)
    # Implementation for posting text-only thread
  end
  
  def post_with_media(content, media_files, reply_to_id = nil)
    # Implementation for posting thread with media
  end
end
```

## Content Adaptation

Based on what we know about Threads, consider:

1. **Character Limit**: Threads has a 500 character limit
2. **Mention Format**: @username
3. **Hashtag Support**: Standard #hashtag format
4. **Media Support**: 
   - Images: JPG, PNG
   - Videos: MP4
   - Multiple media attachments

### Character Counting

```ruby
# app/services/character_counter.rb
def threads_count(text)
  # Basic count
  text.length
end
```

## Rate Limits

Expected rate limits (based on Instagram patterns):

- API calls: Likely around 200 per user per hour
- Post creation: Likely around 25 per user per day

Multipost should implement protective measures:

```ruby
# app/services/threads_service.rb
def within_rate_limits?
  # Check Redis/database for recent API calls
  recent_calls = ThreadsApiCall.where(account: account)
                               .where('created_at > ?', 1.hour.ago)
                               .count
                               
  recent_posts = ThreadsApiCall.where(account: account)
                               .where('created_at > ?', 1.day.ago)
                               .where(endpoint: 'threads')
                               .count
                               
  recent_calls < 200 && recent_posts < 25
end
```

## Error Handling

Expected error scenarios:

1. **Authentication errors**: Prompt user to reconnect account
2. **Rate limits**: Implement backoff and retry logic
3. **Content policy violations**: Notify user with specific details
4. **Server errors**: Implement retry with backoff

```ruby
def handle_threads_error(response)
  case response.code
  when 400
    if response.body.include?("invalid_token")
      # Token expired, refresh token
    else
      # Content issue
    end
  when 429
    # Rate limited, retry later
  when 500..599
    # Server error, retry with backoff
  end
end
```

## Testing Strategy

Given the API is not yet available:

1. Build a **simulation mode** that mocks API responses
2. Create **flexible abstractions** that can adapt when the real API launches
3. Prepare **integration tests** with placeholder assertions
4. Document **manual test procedures** for when the API becomes available

```ruby
# Simulator for testing before API is available
class ThreadsApiSimulator
  def post(content, media_files = [])
    {
      "id" => "simulated_threads_post_#{SecureRandom.hex(8)}",
      "permalink_url" => "https://threads.net/simulated/post",
      "created_at" => Time.current.iso8601
    }
  end
end
```

## Monitoring Plan

When the API becomes available:

1. Set up **monitoring** for API uptime and response times
2. Track **success rates** of posts
3. Monitor **rate limit** usage
4. Create **alerts** for API changes or deprecations

## Future Opportunities

When the API is released, consider:

1. **Content analytics** integration
2. **Scheduled posts** functionality 
3. **Automatic thread creation** for longer content
4. **Reply management** for engagement
5. **Content repurposing** optimized for Threads format

## Resources

- [Meta for Developers](https://developers.facebook.com/)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Meta Platform Terms](https://developers.facebook.com/terms/)
- [Threads Help Center](https://help.threads.net/)

## API Availability Updates

This document will be updated when Meta releases the official Threads API. In the meantime, Multipost should:

1. Design the platform integration with flexible abstractions
2. Monitor Meta developer announcements for API updates
3. Implement the interim workaround approaches
4. Prepare for rapid integration when the API becomes available