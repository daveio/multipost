# Anthropic Claude API Service

This service provides a wrapper around the Anthropic Claude API for generating AI responses.

## Setup

1. Add your Anthropic API key to your `.env` file:

   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   ```

2. Make sure you have the `httparty` gem in your Gemfile:

   ```ruby
   gem 'httparty'
   ```

3. Run `bundle install`

## Usage Examples

### Basic Text Completion

```ruby
# Create a new service instance
claude = AnthropicService.new

# Generate text with a simple prompt
response = claude.complete("What is the capital of France?")

# Access the response content
puts response.dig('content', 0, 'text')
```

### Using a System Prompt

```ruby
# Create a service with specific model and max tokens
claude = AnthropicService.new(model: 'claude-3-haiku-20240307', max_tokens: 500)

# Use a system prompt for additional context
system_prompt = "You are a helpful assistant that specializes in geography."
response = claude.complete(
  "What are the top 5 tourist destinations in Japan?",
  system_prompt: system_prompt
)
```

### Streaming Response

```ruby
claude = AnthropicService.new

claude.stream("Tell me a short story about a robot") do |chunk|
  # Print each text delta as it arrives
  if chunk['type'] == 'content_block_delta' && chunk['delta']['type'] == 'text_delta'
    print chunk['delta']['text']
  end
end
```

### Multi-turn Conversation

```ruby
claude = AnthropicService.new

messages = [
  { role: 'user', content: "Hello, who are you?" },
  { role: 'assistant', content: "I'm Claude, an AI assistant created by Anthropic." },
  { role: 'user', content: "What can you help me with today?" }
]

response = claude.chat(messages)
```
