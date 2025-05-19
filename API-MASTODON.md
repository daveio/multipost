# Mastodon API Integration for Multipost

## Overview

This document outlines how to integrate Mastodon's API with the Multipost application. Mastodon is a decentralized, open-source social media platform that allows integration through a well-documented REST API.

## Prerequisites

- Registered Mastodon application on a Mastodon instance
- OAuth2 client credentials
- User authorization
- Knowledge of the user's home instance

## API Endpoints

Mastodon provides a RESTful API. The base URL depends on the user's instance:

```
https://{instance_domain}/api/v1/
```

For example:
```
https://mastodon.social/api/v1/
```

## Authentication

Mastodon uses OAuth 2.0 for authentication:

### Step 1: Register an Application

```ruby
def register_mastodon_app(instance_url)
  response = HTTP.post("#{instance_url}/api/v1/apps", form: {
    client_name: "Multipost",
    redirect_uris: "https://multipost.example.com/auth/mastodon/callback",
    scopes: "read write",
    website: "https://multipost.example.com"
  })
  
  return JSON.parse(response.body.to_s)
  # Returns client_id and client_secret
end
```

### Step 2: User Authorization

```ruby
def mastodon_auth_url(instance_url, client_id)
  "#{instance_url}/oauth/authorize?client_id=#{client_id}&response_type=code&redirect_uri=https://multipost.example.com/auth/mastodon/callback&scope=read+write"
end
```

### Step 3: Token Exchange

```ruby
def exchange_token(instance_url, client_id, client_secret, auth_code)
  response = HTTP.post("#{instance_url}/oauth/token", form: {
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "authorization_code",
    code: auth_code,
    redirect_uri: "https://multipost.example.com/auth/mastodon/callback"
  })
  
  return JSON.parse(response.body.to_s)
  # Returns access_token
end
```

## Content Publishing

### Status Posts

The primary content type on Mastodon is a "status" (toot):

```ruby
def create_mastodon_status(instance_url, access_token, content, media_ids = [], options = {})
  endpoint = "#{instance_url}/api/v1/statuses"
  
  payload = {
    status: content,
    media_ids: media_ids,
    visibility: options[:visibility] || "public",
    sensitive: options[:sensitive] || false,
    spoiler_text: options[:spoiler_text] || ""
  }
  
  response = HTTP.auth("Bearer #{access_token}")
                 .post(endpoint, json: payload)
  
  return JSON.parse(response.body.to_s)
end
```

### Media Uploads

Media must be uploaded before attaching to a status:

```ruby
def upload_mastodon_media(instance_url, access_token, file_path, description = nil)
  endpoint = "#{instance_url}/api/v1/media"
  
  form_data = {
    file: HTTP::FormData::File.new(file_path)
  }
  
  form_data[:description] = description if description
  
  response = HTTP.auth("Bearer #{access_token}")
                 .post(endpoint, form: form_data)
  
  return JSON.parse(response.body.to_s)
  # Returns media_id for use in status creation
end
```

## Implementation in Multipost

### Models

Add the following to our existing models:

```ruby
# app/models/platform.rb
# Add Mastodon as a supported platform
SUPPORTED_PLATFORMS = %w[twitter mastodon bluesky facebook instagram]

# app/models/account.rb
# Store Mastodon credentials
class Account < ApplicationRecord
  # Existing code...
  
  # For Mastodon accounts, store:
  # - mastodon_instance_url
  # - mastodon_access_token
  # - mastodon_client_id
  # - mastodon_client_secret
  
  def mastodon_client
    MastodonService.new(
      instance_url: mastodon_instance_url,
      access_token: mastodon_access_token
    )
  end
end
```

### Services

Create a dedicated service for Mastodon API interactions:

```ruby
# app/services/mastodon_service.rb
class MastodonService
  attr_reader :instance_url, :access_token
  
  def initialize(instance_url:, access_token:)
    @instance_url = instance_url
    @access_token = access_token
  end
  
  def post(content, media_files = [], options = {})
    # Handle media uploads
    media_ids = media_files.map do |media|
      upload_media(media.path, media.description).fetch("id")
    end
    
    # Create status
    create_status(content, media_ids, options)
  end
  
  def verify_credentials
    response = client.get("#{instance_url}/api/v1/accounts/verify_credentials")
    response.status.success? ? JSON.parse(response.body.to_s) : nil
  end
  
  private
  
  def client
    @client ||= HTTP.auth("Bearer #{access_token}")
  end
  
  def create_status(content, media_ids = [], options = {})
    endpoint = "#{instance_url}/api/v1/statuses"
    
    payload = {
      status: content,
      media_ids: media_ids,
      visibility: options[:visibility] || "public",
      sensitive: options[:sensitive] || false,
      spoiler_text: options[:spoiler_text] || ""
    }
    
    response = client.post(endpoint, json: payload)
    JSON.parse(response.body.to_s)
  end
  
  def upload_media(file_path, description = nil)
    endpoint = "#{instance_url}/api/v1/media"
    
    form_data = {
      file: HTTP::FormData::File.new(file_path)
    }
    
    form_data[:description] = description if description
    
    response = client.post(endpoint, form: form_data)
    JSON.parse(response.body.to_s)
  end
end
```

### Character Counting

Mastodon instances have configurable character limits, typically 500 characters:

```ruby
# app/services/character_counter.rb
def mastodon_count(text, instance_url = nil)
  # Default to 500 if we can't fetch instance info
  max_chars = 500
  
  # Try to get instance-specific limit if URL is provided
  if instance_url
    begin
      response = HTTP.get("#{instance_url}/api/v1/instance")
      if response.status.success?
        instance_info = JSON.parse(response.body.to_s)
        max_chars = instance_info.dig("configuration", "statuses", "max_characters") || max_chars
      end
    rescue => e
      # Log error but continue with default
      Rails.logger.error("Failed to fetch Mastodon instance info: #{e.message}")
    end
  end
  
  # Standard counting logic
  text.length
end
```

## Content Adaptation

Mastodon has specific content features to consider:

1. **Visibility Options**: public, unlisted, private, direct
2. **Content Warnings**: Using spoiler_text for sensitive content
3. **Custom Emojis**: `:emoji_name:` syntax for custom emojis
4. **Mentions**: `@username@instance.domain` format
5. **Hashtags**: Standard `#hashtag` format

## Media Support

Mastodon supports the following media formats:

1. **Images**: JPG, PNG, GIF (including animated GIFs)
2. **Video**: MP4, M4V, MOV, WebM
3. **Audio**: MP3, OGG, WAV

Files are subject to size limits configured per instance (typically 40MB max).

## Rate Limits

Rate limits vary by instance but typically include:

- API requests: ~300 per 5 minutes
- Status creation: ~30 per 30 minutes
- Media uploads: ~30 per 30 minutes

Implement rate limit handling:

```ruby
# app/services/mastodon_service.rb
def handle_rate_limits(response)
  if response.status.code == 429
    # Parse retry headers
    reset_at = response.headers["X-RateLimit-Reset"]
    retry_after = reset_at ? Time.parse(reset_at) - Time.now : 60
    
    # Log and raise specific error
    Rails.logger.warn("Mastodon rate limit hit, retry after #{retry_after}s")
    raise MastodonRateLimitError.new(retry_after: retry_after)
  end
end
```

## Error Handling

Common Mastodon API errors:

1. **Authentication errors (401)**: Refresh or request new token
2. **Validation errors (422)**: Parse and display to user
3. **Rate limits (429)**: Implement backoff and retry
4. **Server errors (500+)**: Retry with exponential backoff

```ruby
# app/services/mastodon_service.rb
def handle_error(response)
  case response.status.code
  when 401
    raise MastodonAuthError, "Authentication failed"
  when 422
    errors = JSON.parse(response.body.to_s)["error"]
    raise MastodonValidationError.new(errors: errors)
  when 429
    handle_rate_limits(response)
  when 500..599
    raise MastodonServerError, "Server error occurred"
  end
end
```

## Testing

For testing Mastodon integration:

1. **Create a test account** on a development instance
2. **Use VCR/WebMock** to record and playback API interactions
3. **Set up a local Mastodon instance** for comprehensive testing

## Security Considerations

1. **Token Storage**: Encrypt access tokens in the database
2. **Scopes**: Request minimal necessary scopes (read, write) 
3. **Instance Verification**: Validate instance URLs before connecting

## Advanced Features

### Streaming API Support

Mastodon offers a WebSocket streaming API for real-time updates:

```ruby
# For future implementation - real-time notifications
def connect_to_stream(access_token)
  # Connect to user stream for notifications
end
```

### Scheduled Posts

```ruby
# For scheduled posts
def schedule_status(content, media_ids = [], scheduled_at)
  endpoint = "#{instance_url}/api/v1/statuses"
  
  payload = {
    status: content,
    media_ids: media_ids,
    scheduled_at: scheduled_at.iso8601
  }
  
  response = client.post(endpoint, json: payload)
  JSON.parse(response.body.to_s)
end
```

## Resources

- [Mastodon API Documentation](https://docs.joinmastodon.org/api/)
- [Mastodon GitHub Repository](https://github.com/mastodon/mastodon)
- [OAuth 2.0 Authorization Framework](https://oauth.net/2/)
- [HTTP Signatures](https://docs.joinmastodon.org/spec/security/#http-signatures)