# Bluesky API Integration for Multipost

## Overview

This document outlines how to integrate the Bluesky API (AT Protocol) with the Multipost application. Bluesky is a decentralized social media platform built on the AT Protocol (atproto) that offers a unique approach to social media content creation and distribution.

## Prerequisites

- Understanding of the AT Protocol
- Registered Bluesky account
- Authentication credentials
- Familiarity with JSON and REST API concepts

## AT Protocol Basics

The AT Protocol (Authenticated Transfer Protocol) is the foundation of Bluesky. Key concepts:

1. **Decentralized Identifiers (DIDs)**: Unique identifiers for users that aren't tied to a specific service
2. **Personal Data Servers (PDS)**: Stores user data and content
3. **Repositories**: Each user has a personal repository containing their content
4. **Lexicons**: Schema definitions for data types in the protocol
5. **Records**: Content objects (posts, follows, likes, etc.) stored in repositories

## API Endpoints

The base URL for the Bluesky API depends on the instance but is typically:

```
https://bsky.social/xrpc/
```

### Key Endpoints

#### Authentication

```
POST /com.atproto.server.createSession
```

#### Profile Management

```
GET /app.bsky.actor.getProfile
POST /com.atproto.repo.putRecord (type: app.bsky.actor.profile)
```

#### Post Creation and Management

```
POST /com.atproto.repo.createRecord (type: app.bsky.feed.post)
POST /com.atproto.repo.deleteRecord
```

#### Social Interactions

```
POST /com.atproto.repo.createRecord (type: app.bsky.feed.like)
POST /com.atproto.repo.createRecord (type: app.bsky.feed.repost)
POST /com.atproto.repo.createRecord (type: app.bsky.graph.follow)
```

## Authentication

Bluesky uses a simple authentication approach with sessions:

```ruby
def create_session(identifier, password)
  endpoint = "#{api_base_url}/com.atproto.server.createSession"
  
  response = HTTP.post(endpoint, json: {
    identifier: identifier, # Handle or email
    password: password
  })
  
  session_data = JSON.parse(response.body.to_s)
  
  {
    did: session_data["did"],
    handle: session_data["handle"],
    access_jwt: session_data["accessJwt"],
    refresh_jwt: session_data["refreshJwt"]
  }
end
```

## Content Publishing

### Creating a Text Post

```ruby
def create_post(access_token, text, reply_to = nil)
  endpoint = "#{api_base_url}/com.atproto.repo.createRecord"
  
  # Generate a unique record key
  record_key = "#{Time.now.to_i}-#{SecureRandom.hex(4)}"
  
  # Prepare post data
  post_data = {
    text: text,
    createdAt: Time.now.utc.iso8601
  }
  
  # Add reply reference if replying to another post
  if reply_to
    post_data[:reply] = {
      root: reply_to[:root] || reply_to[:post],
      parent: reply_to[:post]
    }
  end
  
  # Full request payload
  payload = {
    repo: user_did,
    collection: "app.bsky.feed.post",
    record: post_data,
    rkey: record_key
  }
  
  # Send request
  response = HTTP.auth("Bearer #{access_token}")
                 .post(endpoint, json: payload)
  
  JSON.parse(response.body.to_s)
end
```

### Adding Images to Posts

```ruby
def create_post_with_images(access_token, text, image_paths, alt_texts = [])
  # First, upload each image to the Bluesky server
  image_blobs = image_paths.map.with_index do |path, i|
    alt_text = alt_texts[i] || "Image #{i+1}"
    upload_image(access_token, path, alt_text)
  end
  
  # Create post with image references
  endpoint = "#{api_base_url}/com.atproto.repo.createRecord"
  
  # Generate a unique record key
  record_key = "#{Time.now.to_i}-#{SecureRandom.hex(4)}"
  
  # Prepare post data with images
  post_data = {
    text: text,
    createdAt: Time.now.utc.iso8601,
    embed: {
      "$type": "app.bsky.embed.images",
      images: image_blobs
    }
  }
  
  # Full request payload
  payload = {
    repo: user_did,
    collection: "app.bsky.feed.post",
    record: post_data,
    rkey: record_key
  }
  
  # Send request
  response = HTTP.auth("Bearer #{access_token}")
                 .post(endpoint, json: payload)
  
  JSON.parse(response.body.to_s)
end

def upload_image(access_token, image_path, alt_text)
  endpoint = "#{api_base_url}/com.atproto.repo.uploadBlob"
  
  # Read image file
  file_data = File.open(image_path, 'rb').read
  
  # Upload the blob
  response = HTTP.auth("Bearer #{access_token}")
                 .headers("Content-Type" => "image/#{image_extension(image_path)}")
                 .post(endpoint, body: file_data)
  
  result = JSON.parse(response.body.to_s)
  
  # Return the image reference in the required format
  {
    alt: alt_text,
    image: result["blob"]
  }
end

def image_extension(path)
  File.extname(path).delete('.').downcase
end
```

## Implementation in Multipost

### Models

Add the following to our existing models:

```ruby
# app/models/platform.rb
# Add Bluesky as a supported platform
SUPPORTED_PLATFORMS = %w[twitter mastodon bluesky facebook instagram]

# app/models/account.rb
# Store Bluesky credentials
class Account < ApplicationRecord
  # Existing code...
  
  # For Bluesky accounts, store:
  # - bluesky_handle (e.g., "username.bsky.social")
  # - bluesky_did (e.g., "did:plc:abcdefg")
  # - bluesky_access_jwt
  # - bluesky_refresh_jwt
  # - bluesky_jwt_expires_at
  
  def bluesky_client
    BlueskyService.new(
      did: bluesky_did,
      access_token: bluesky_access_jwt,
      refresh_token: bluesky_refresh_jwt
    )
  end
  
  def refresh_bluesky_token
    # Logic to refresh the JWT token
  end
end
```

### Services

Create a dedicated service for Bluesky API interactions:

```ruby
# app/services/bluesky_service.rb
class BlueskyService
  API_BASE_URL = "https://bsky.social/xrpc"
  
  attr_reader :did, :access_token, :refresh_token
  
  def initialize(did:, access_token:, refresh_token:)
    @did = did
    @access_token = access_token
    @refresh_token = refresh_token
  end
  
  def post(content, media_files = [], reply_to = nil)
    if media_files.any?
      create_post_with_images(content, media_files, reply_to)
    else
      create_text_post(content, reply_to)
    end
  end
  
  def verify_credentials
    endpoint = "#{API_BASE_URL}/app.bsky.actor.getProfile"
    
    response = HTTP.auth("Bearer #{access_token}")
                   .get(endpoint, params: { actor: did })
    
    response.status.success? ? JSON.parse(response.body.to_s) : nil
  end
  
  private
  
  def create_text_post(text, reply_to = nil)
    # Implementation for text posts
  end
  
  def create_post_with_images(text, media_files, reply_to = nil)
    # Implementation for posts with images
  end
  
  def refresh_session
    # Logic to refresh the JWT token
  end
end
```

### Character Counting

Bluesky has a character limit of 300 characters:

```ruby
# app/services/character_counter.rb
def bluesky_count(text)
  # Standard counting logic
  text.length
end
```

## Content Adaptation

Bluesky has specific content features to consider:

1. **Character Limit**: 300 characters per post
2. **Mentions**: @handle format
3. **Facets**: Special formatting for mentions, links, and formatting
4. **Images**: Up to 4 images per post
5. **Alt Text**: Support for image descriptions
6. **Content Warnings**: Support via labels

### Facets Implementation

Facets are how Bluesky handles rich text like links and mentions:

```ruby
def process_facets(text)
  facets = []
  
  # Process mentions (e.g., @username.bsky.social)
  mention_matches = text.scan(/@([a-zA-Z0-9.-]+)/)
  mention_matches.each do |match|
    handle = match[0]
    start_index = text.index("@#{handle}")
    end_index = start_index + handle.length + 1
    
    # Resolve the handle to a DID
    did = resolve_handle_to_did(handle)
    
    if did
      facets << {
        index: {
          byteStart: start_index,
          byteEnd: end_index
        },
        features: [
          {
            "$type": "app.bsky.richtext.facet#mention",
            did: did
          }
        ]
      }
    end
  end
  
  # Process URLs
  url_matches = text.scan(URI.regexp)
  url_matches.each do |match|
    url = match[0]
    start_index = text.index(url)
    end_index = start_index + url.length
    
    facets << {
      index: {
        byteStart: start_index,
        byteEnd: end_index
      },
      features: [
        {
          "$type": "app.bsky.richtext.facet#link",
          uri: url
        }
      ]
    }
  end
  
  facets
end

def resolve_handle_to_did(handle)
  endpoint = "#{API_BASE_URL}/com.atproto.identity.resolveHandle"
  
  response = HTTP.get(endpoint, params: { handle: handle })
  
  if response.status.success?
    JSON.parse(response.body.to_s)["did"]
  else
    nil
  end
end
```

## Rate Limits

Bluesky imposes rate limits, but they aren't publicly documented in detail. Implement rate limiting protections:

```ruby
# app/services/bluesky_service.rb
def check_rate_limit(response)
  if response.status.code == 429
    # Parse rate limit headers if available
    reset_after = response.headers["RateLimit-Reset"] || 60
    
    # Log and raise specific error
    Rails.logger.warn("Bluesky rate limit hit, retry after #{reset_after}s")
    raise BlueskyRateLimitError.new(retry_after: reset_after.to_i)
  end
end
```

## Error Handling

Common Bluesky API errors:

1. **Authentication errors (401)**: Refresh token or prompt for re-login
2. **Validation errors (400)**: Display specific error to user
3. **Rate limits (429)**: Implement backoff and retry
4. **Server errors (500+)**: Retry with exponential backoff

```ruby
# app/services/bluesky_service.rb
def handle_error(response)
  case response.status.code
  when 400
    errors = JSON.parse(response.body.to_s)["error"]
    raise BlueskyValidationError.new(errors: errors)
  when 401
    # Try refreshing the token
    refreshed = refresh_session
    raise BlueskyAuthError, "Authentication failed" unless refreshed
  when 429
    check_rate_limit(response)
  when 500..599
    raise BlueskyServerError, "Server error occurred"
  end
end
```

## Testing

For testing Bluesky integration:

1. **Create a test account** on Bluesky
2. **Use VCR/WebMock** to record and playback API interactions
3. **Write comprehensive unit tests** for the service

## Security Considerations

1. **Token Storage**: Encrypt JWT tokens in the database
2. **Token Rotation**: Implement JWT refresh logic to minimize long-lived tokens
3. **Error Handling**: Ensure errors don't expose sensitive information

## Advanced Features

### Threading Support

For creating thread-style posts:

```ruby
def create_thread(posts)
  # First post has no parent
  first_post = posts.shift
  first_post_result = create_post(first_post[:text], first_post[:media])
  
  # Track the thread for reply references
  thread_root = {
    uri: first_post_result["uri"],
    cid: first_post_result["cid"]
  }
  
  # Previous post is the parent of the next post
  parent = thread_root
  
  # Create remaining posts as replies
  posts.each do |post|
    reply_to = {
      root: thread_root,
      parent: parent
    }
    
    result = create_post(post[:text], post[:media], reply_to)
    
    # Update parent for next post
    parent = {
      uri: result["uri"],
      cid: result["cid"]
    }
  end
end
```

### Content Moderation Labels

For adding content warnings or labels to posts:

```ruby
def create_post_with_label(text, label_type, media_files = [])
  # Standard post creation with labels added
  # Labels might include: "nsfw", "nudity", "sexual", etc.
end
```

## Resources

- [AT Protocol Documentation](https://atproto.com/docs)
- [Bluesky Lexicon Documentation](https://atproto.com/lexicons)
- [Bluesky Developer Community](https://github.com/bluesky-social/)
- [AT Protocol Examples Repository](https://github.com/bluesky-social/atproto)

## Ruby Libraries

Several community-developed Ruby gems exist for working with the AT Protocol:

1. **atproto**: A Ruby client for the AT Protocol
2. **bluesky-api**: Ruby wrapper for Bluesky API endpoints
3. **bsky-ruby**: Simple client for posting to Bluesky

Example using a potential Ruby gem:

```ruby
# Using a hypothetical gem
require 'atproto'

client = ATProto::Client.new(
  handle: "username.bsky.social",
  password: "your_password"
)

# Create a post
client.create_post(text: "Hello from Multipost!")

# Create a post with images
client.create_post(
  text: "Check out these images!",
  images: [
    { path: "/path/to/image1.jpg", alt: "Description of image 1" },
    { path: "/path/to/image2.jpg", alt: "Description of image 2" }
  ]
)
```

Note: Evaluate available gems for stability and maintenance before incorporating into Multipost.