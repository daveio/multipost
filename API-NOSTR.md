# Nostr API Integration for Multipost

## Overview

This document outlines how to integrate the Nostr protocol with the Multipost application. Nostr (Notes and Other Stuff Transmitted by Relays) is a simple, open protocol that enables a truly censorship-resistant and global social network.

## Prerequisites

- Understanding of Nostr protocol and relay system
- Cryptographic key pair for user authentication
- Connection to Nostr relays
- Ruby environment with necessary cryptographic libraries

## Nostr Protocol Basics

Nostr is a simple protocol based on these fundamental concepts:

1. **Public Key Cryptography**: Users are identified by their public key
2. **Events**: All content is sent as "events" (JSON objects) signed by user keys
3. **Relays**: Servers that accept and redistribute events
4. **Subscriptions**: Method for clients to filter and receive relevant events
5. **NIPs (Nostr Implementation Possibilities)**: Protocol extension specifications

## Key Concepts

### Nostr Identifiers

- **Public Key**: 32-byte public key displayed as a hex string (npub...)
- **Private Key**: 32-byte private key (nsec...) used to sign events
- **NIP-05 Identifier**: Human-readable identifier verified through DNS

### Event Types

Nostr uses numeric event kinds to distinguish content:

- **Kind 0**: User metadata (profile)
- **Kind 1**: Short text note (standard post)
- **Kind 3**: Contact list (follows)
- **Kind 7**: Reaction (like, etc.)
- **Kind 42**: Channel creation
- **Kind 1984**: Reporting
- Many other kinds defined in various NIPs

## Implementation Approach

Unlike traditional REST APIs, Nostr requires implementing the protocol directly:

### Client Authentication

```ruby
require 'schnorr'
require 'securerandom'
require 'bitcoin'

class NostrClient
  attr_reader :private_key, :public_key
  
  def initialize(private_key = nil)
    if private_key
      @private_key = private_key
    else
      # Generate a new keypair
      @private_key = SecureRandom.hex(32)
    end
    
    # Derive public key from private key
    @public_key = Bitcoin::Key.new(priv_key: @private_key).pubkey
  end
  
  # Additional methods...
end
```

### Creating and Signing Events

```ruby
def create_event(kind, content, tags = [])
  event = {
    kind: kind,
    created_at: Time.now.to_i,
    tags: tags,
    content: content,
    pubkey: @public_key
  }
  
  # Calculate event ID (SHA256 hash of the canonical event format)
  event_data = [
    0,
    event[:pubkey],
    event[:created_at],
    event[:kind],
    event[:tags],
    event[:content]
  ]
  event_id = Digest::SHA256.hexdigest(JSON.generate(event_data))
  event[:id] = event_id
  
  # Sign the event
  signature = Schnorr.sign(event_id, @private_key).encode
  event[:sig] = signature
  
  event
end
```

### Connecting to Relays

```ruby
require 'faye/websocket'
require 'eventmachine'

def connect_to_relay(relay_url)
  EM.run {
    ws = Faye::WebSocket::Client.new(relay_url)
    
    ws.on :open do |event|
      puts "Connected to relay: #{relay_url}"
      # Subscribe to events or send events
    end
    
    ws.on :message do |event|
      data = JSON.parse(event.data)
      handle_message(data)
    end
    
    ws.on :close do |event|
      puts "Connection closed: #{event.code}, #{event.reason}"
      ws = nil
    end
  }
end
```

### Sending Events to Relays

```ruby
def publish_event(relay_ws, event)
  message = ["EVENT", event]
  relay_ws.send(JSON.generate(message))
end
```

### Subscribing to Events

```ruby
def subscribe_to_events(relay_ws, filters)
  subscription_id = SecureRandom.hex(4)
  message = ["REQ", subscription_id, filters]
  relay_ws.send(JSON.generate(message))
  subscription_id
end
```

## Integration in Multipost

### Models

Add the following to our existing models:

```ruby
# app/models/platform.rb
# Add Nostr as a supported platform
SUPPORTED_PLATFORMS = %w[twitter mastodon bluesky facebook instagram nostr]

# app/models/account.rb
# Store Nostr credentials
class Account < ApplicationRecord
  # Existing code...
  
  # For Nostr accounts, store:
  # - nostr_private_key (encrypted)
  # - nostr_public_key
  # - nostr_nip05_identifier (optional)
  # - nostr_relays (JSON array of relay URLs)
  
  def nostr_client
    NostrService.new(
      private_key: decrypt_nostr_private_key,
      relays: JSON.parse(nostr_relays || '[]')
    )
  end
  
  private
  
  def decrypt_nostr_private_key
    # Logic to decrypt the private key from the database
  end
end
```

### Services

Create a dedicated service for Nostr protocol interactions:

```ruby
# app/services/nostr_service.rb
class NostrService
  attr_reader :private_key, :public_key, :relays
  
  def initialize(private_key:, relays: [])
    @private_key = private_key
    # Derive public key from private key
    @public_key = derive_public_key(private_key)
    @relays = relays.empty? ? default_relays : relays
    @relay_connections = {}
  end
  
  def post(content, media_files = [], reply_to = nil)
    # Initialize EventMachine if not running
    start_event_machine unless EM.reactor_running?
    
    # Connect to relays if not connected
    connect_to_relays
    
    # Create text note event
    event = create_text_note(content, media_files, reply_to)
    
    # Send event to all connected relays
    broadcast_event(event)
  end
  
  private
  
  def default_relays
    [
      "wss://relay.damus.io",
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://nostr.mom",
      "wss://relay.current.fyi"
    ]
  end
  
  def start_event_machine
    Thread.new { EM.run } unless EM.reactor_running?
    sleep 0.1 until EM.reactor_running?
  end
  
  def connect_to_relays
    relays.each do |relay_url|
      next if @relay_connections[relay_url]&.open?
      
      @relay_connections[relay_url] = Faye::WebSocket::Client.new(relay_url)
      
      @relay_connections[relay_url].on :open do |event|
        Rails.logger.info "Connected to Nostr relay: #{relay_url}"
      end
      
      @relay_connections[relay_url].on :message do |event|
        handle_relay_message(relay_url, JSON.parse(event.data))
      end
      
      @relay_connections[relay_url].on :close do |event|
        Rails.logger.info "Disconnected from Nostr relay: #{relay_url}"
        @relay_connections[relay_url] = nil
      end
    end
  end
  
  def create_text_note(content, media_files = [], reply_to = nil)
    tags = []
    
    # Handle media files by uploading to NIP-94 compatible service
    # and adding image tags
    if media_files.any?
      media_files.each do |media|
        # Upload image and add image tag
        image_url = upload_to_nostr_image_service(media)
        tags << ["image", image_url, media.description]
      end
    end
    
    # Add reply tags if replying to another note
    if reply_to
      tags << ["e", reply_to[:id], reply_to[:relay], "reply"]
      tags << ["p", reply_to[:pubkey]]
    end
    
    # Create event
    event = {
      kind: 1, # text note
      created_at: Time.now.to_i,
      tags: tags,
      content: content,
      pubkey: @public_key
    }
    
    # Calculate event ID
    serialized = [
      0,
      event[:pubkey],
      event[:created_at],
      event[:kind], 
      event[:tags],
      event[:content]
    ]
    event_id = Digest::SHA256.hexdigest(JSON.generate(serialized))
    event[:id] = event_id
    
    # Sign the event
    event[:sig] = sign_event(event_id)
    
    event
  end
  
  def broadcast_event(event)
    message = ["EVENT", event]
    json_message = JSON.generate(message)
    
    @relay_connections.each do |url, conn|
      if conn&.open?
        conn.send(json_message)
      end
    end
    
    event
  end
  
  # Other required methods
  def derive_public_key(private_key)
    # Logic to derive public key from private key
  end
  
  def sign_event(event_id)
    # Logic to sign event with private key
  end
  
  def upload_to_nostr_image_service(media)
    # Logic to upload image to a NIP-94 compatible service
  end
  
  def handle_relay_message(relay_url, message)
    # Logic to handle incoming messages from relays
  end
end
```

## Character Counting

Nostr does not have a strict character limit, but it's good practice to enforce some limits:

```ruby
# app/services/character_counter.rb
def nostr_count(text)
  # Standard counting logic
  text.length
end
```

## Content Adaptation

Nostr has specific content features to consider:

1. **NIP-10**: Thread support via specific tags
2. **NIP-08**: Mentions using #[index] and p-tags  
3. **NIP-19**: Human-readable identifiers (npub, note)
4. **NIP-36**: Sensitive content
5. **NIP-94**: File attachments

### Mentions and Hashtags

```ruby
def process_nostr_content(text)
  processed_content = text.dup
  tags = []
  
  # Process mentions (@npub1...)
  mention_matches = text.scan(/@(npub1[a-zA-Z0-9]+)/)
  mention_matches.each_with_index do |match, index|
    npub = match[0]
    # Convert from npub to hex format
    hex_pubkey = decode_npub_to_hex(npub)
    
    # Add p-tag and replace with #[index]
    tags << ["p", hex_pubkey]
    processed_content.gsub!("@#{npub}", "#[#{tags.length - 1}]")
  end
  
  # Process hashtags
  hashtag_matches = text.scan(/#(\w+)/)
  hashtag_matches.each do |match|
    hashtag = match[0]
    tags << ["t", hashtag]
  end
  
  [processed_content, tags]
end
```

## Content Types and NIP Support

For a complete integration, support these NIPs:

1. **NIP-01**: Basic protocol
2. **NIP-02**: Contact List
3. **NIP-08**: Mentions
4. **NIP-10**: Thread replies
5. **NIP-19**: bech32-encoded entities
6. **NIP-25**: Reactions
7. **NIP-36**: Sensitive content warnings
8. **NIP-42**: Authentication
9. **NIP-94**: File attachments

## Error Handling

Unlike centralized APIs, Nostr error handling focuses on relay issues:

```ruby
def handle_relay_errors
  # Retry strategy for failed relay connections
  @relays.each do |relay_url|
    if @failed_relays.include?(relay_url)
      next if Time.now - @failed_relays[relay_url] < backoff_period(relay_url)
      
      # Attempt to reconnect
      @relay_connections[relay_url] = connect_to_relay(relay_url)
    end
  end
end

def backoff_period(relay_url)
  # Exponential backoff based on failure count
  failure_count = @relay_failures[relay_url] || 0
  initial_backoff = 5 # seconds
  
  # Exponential backoff with maximum
  [initial_backoff * (2 ** failure_count), 300].min
end
```

## Event Success Verification

Since relays don't provide immediate confirmation, verify events are distributed:

```ruby
def verify_event_propagation(event_id, timeout = 30)
  successful_relays = []
  subscription_id = SecureRandom.hex(8)
  
  # Subscribe to the specific event across relays
  @relay_connections.each do |url, conn|
    next unless conn&.open?
    
    filter = {
      ids: [event_id],
      limit: 1
    }
    
    message = ["REQ", subscription_id, filter]
    conn.send(JSON.generate(message))
  end
  
  # Wait for responses with timeout
  start_time = Time.now
  
  while Time.now - start_time < timeout && successful_relays.length < 3
    # Process incoming messages that match our subscription
    # Add relays to successful_relays when they confirm the event
    sleep 0.1
  end
  
  # Close subscription
  @relay_connections.each do |url, conn|
    next unless conn&.open?
    message = ["CLOSE", subscription_id]
    conn.send(JSON.generate(message))
  end
  
  successful_relays
end
```

## Testing

For testing Nostr integration:

1. **Use test private keys** with low entropy for test environments
2. **Mock WebSocket connections** in unit tests
3. **Record and replay WebSocket messages** for integration tests
4. **Set up a local relay** for comprehensive testing

## Security Considerations

Nostr involves direct cryptographic operations, requiring careful security:

1. **Private Key Storage**: Use secure encryption for private key storage
2. **Key Generation**: Ensure proper entropy for key generation
3. **Signing**: Validate all signatures before broadcasting
4. **Relay Selection**: Allow users to configure trusted relays

## Future Enhancements

1. **NIP-05 Verification**: Support for human-readable identifiers
2. **NIP-57**: Lightning Zaps for tips and payments
3. **NIP-65**: Relay List Metadata
4. **NIP-51**: Lists (muting, pinned notes, bookmarks)
5. **Event Deletion**: Support for NIP-09 event deletion

## Ruby Libraries

Several community-developed Ruby gems exist for working with Nostr:

1. **nostr_ruby**: Ruby client for the Nostr protocol
2. **schnorr**: For cryptographic signatures
3. **faye-websocket**: For WebSocket connections to relays

Example using a potential Ruby gem:

```ruby
require 'nostr_ruby'

# Initialize client with private key
client = NostrRuby::Client.new(private_key: your_private_key)

# Add relays
client.add_relay("wss://relay.damus.io")
client.add_relay("wss://nos.lol")

# Create and publish a text note
event = client.create_text_note(content: "Hello from Multipost!")
client.broadcast_event(event)

# Create a reply to another note
reply_event = client.create_text_note(
  content: "This is a reply",
  reply_to: {
    event_id: "original_event_id",
    pubkey: "original_pubkey"
  }
)
client.broadcast_event(reply_event)
```

## Resources

- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NIPs Directory](https://github.com/nostr-protocol/nips)
- [Nostr.how - Guides and Documentation](https://nostr.how)
- [Awesome Nostr - Resource List](https://github.com/aljazceru/awesome-nostr)
- [Nostr Development Kit](https://github.com/nostr-dev-kit)

## Recommended Relays

For initial implementation, these reliable relays are recommended:

- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol
- wss://relay.current.fyi
- wss://nostr.mom

Allow users to customize their relay list for optimal performance and content reach.