# Instagram API Integration for Multipost

## Overview

This document outlines how to integrate the Instagram Graph API with the Multipost application. Instagram's API allows posting content, managing interactions, and retrieving analytics.

## Prerequisites

- Instagram Business or Creator account
- Facebook Developer account
- Meta app with Instagram Graph API enabled
- Valid access tokens with appropriate permissions

## API Endpoints

The Instagram Graph API is part of the Facebook Graph API ecosystem, with the base URL:

```
https://graph.facebook.com/v18.0/
```

### Authentication

Instagram API authentication is handled through the Facebook OAuth 2.0 flow:

1. Direct users to Facebook Login dialog
2. Receive authorization code 
3. Exchange for access token
4. Use token for API requests

### Required Permissions for Posting

- `instagram_basic`: Read user profile info
- `instagram_content_publish`: Create and publish content
- `instagram_manage_comments`: Manage comments on posts
- `instagram_manage_insights`: Access post performance metrics

## Content Publishing

Instagram supports several content types that Multipost can leverage:

### Feed Posts

```ruby
# Example API interaction for creating a feed post
def create_instagram_feed_post(user_instagram_id, image_url, caption)
  # Step 1: Create a container for the post
  container_response = HTTP.post(
    "https://graph.facebook.com/v18.0/#{user_instagram_id}/media",
    form: {
      image_url: image_url,
      caption: caption,
      access_token: instagram_access_token
    }
  )
  
  container_id = JSON.parse(container_response.body.to_s)["id"]
  
  # Step 2: Publish the container to Instagram
  publish_response = HTTP.post(
    "https://graph.facebook.com/v18.0/#{user_instagram_id}/media_publish",
    form: {
      creation_id: container_id,
      access_token: instagram_access_token
    }
  )
  
  return JSON.parse(publish_response.body.to_s)
end
```

### Stories

```ruby
def create_instagram_story(user_instagram_id, image_url)
  # Similar two-step process as feed posts
  # 1. Create media container
  # 2. Publish the container
end
```

### Carousels

```ruby
def create_instagram_carousel(user_instagram_id, media_ids, caption)
  # Create a carousel container with multiple media IDs
  # Then publish the container
end
```

## Implementation in Multipost

### Models

Add the following to our existing models:

```ruby
# app/models/platform.rb
# Add Instagram as a supported platform
SUPPORTED_PLATFORMS = %w[twitter mastodon bluesky facebook instagram]

# app/models/account.rb
# Store Instagram credentials
class Account < ApplicationRecord
  # Existing code...
  
  # For Instagram accounts, store:
  # - instagram_user_id
  # - instagram_access_token
  # - instagram_token_expires_at
  
  def instagram_token_valid?
    instagram_token_expires_at.present? && instagram_token_expires_at > Time.current
  end
  
  def refresh_instagram_token
    # Logic to refresh the Instagram access token
  end
end
```

### Services

Create a dedicated service for Instagram API interactions:

```ruby
# app/services/instagram_service.rb
class InstagramService
  attr_reader :account
  
  def initialize(account)
    @account = account
  end
  
  def post(content, media_files = [])
    if media_files.any?
      if media_files.length > 1
        post_carousel(content, media_files)
      else
        post_single_media(content, media_files.first)
      end
    else
      # Instagram doesn't support text-only posts
      raise InstagramError, "Instagram requires at least one media file"
    end
  end
  
  private
  
  def post_single_media(content, media_file)
    # Implementation for posting a single media
  end
  
  def post_carousel(content, media_files)
    # Implementation for posting multiple media
  end
end
```

### Content Adaptation

Instagram has specific content requirements that Multipost needs to handle:

1. **Caption Length**: Up to 2,200 characters
2. **Hashtags**: Support for hashtags in the caption
3. **Media Formats**: 
   - Photos: JPG, PNG
   - Videos: MP4, MOV
   - Aspect ratios: 1:1, 4:5, 16:9

### Character Counting

Instagram counts emojis as 2 characters in most cases, which should be handled in our character counting service:

```ruby
# app/services/character_counter.rb
def instagram_count(text)
  # Basic count
  count = text.length
  
  # Adjust for emojis (most count as 2 characters)
  emoji_count = text.scan(/[\u{1F300}-\u{1F6FF}]/).count
  
  count + emoji_count
end
```

## Rate Limits

Instagram imposes the following rate limits:

- 200 API calls per user per hour
- 25 POST requests per user per day for content publishing

Multipost should implement rate limiting protections:

```ruby
# app/services/instagram_service.rb
def within_rate_limits?
  # Check Redis/database for recent API calls
  recent_calls = InstagramApiCall.where(account: account)
                                 .where('created_at > ?', 1.hour.ago)
                                 .count
                                 
  recent_posts = InstagramApiCall.where(account: account)
                                 .where('created_at > ?', 1.day.ago)
                                 .where(endpoint: 'media_publish')
                                 .count
                                 
  recent_calls < 200 && recent_posts < 25
end
```

## Error Handling

Common Instagram API errors and how to handle them:

1. **Authentication errors (400, 401)**: Prompt user to reconnect account
2. **Rate limits (429)**: Implement exponential backoff and retry logic
3. **Content policy violations (400)**: Notify user with specific violation details
4. **Server errors (500+)**: Implement retry with backoff

```ruby
def handle_instagram_error(response)
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

## Testing

For testing Instagram integration:

1. **Use Meta's Graph API Explorer** for manual testing
2. **Create a sandboxed Instagram test account** for development
3. **Mock API responses** in test suite

## Security Considerations

1. **Token Storage**: Encrypt Instagram access tokens in the database
2. **Content Permissions**: Ensure user content permissions are appropriate for cross-posting
3. **Error Logs**: Sanitize logs to prevent token exposure

## Future Enhancements

1. **Instagram Insights**: Retrieve and display post performance metrics
2. **Comment Management**: Allow users to view and respond to comments from within Multipost
3. **Scheduling**: Support for scheduled posts using delayed jobs

## Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Meta for Developers Portal](https://developers.facebook.com/)
- [Instagram Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [API Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)