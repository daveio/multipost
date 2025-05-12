# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create default platforms
Platform.find_or_create_by(name: 'bluesky') do |platform|
  platform.character_limit = 300
end

Platform.find_or_create_by(name: 'mastodon') do |platform|
  platform.character_limit = 500
end

Platform.find_or_create_by(name: 'threads') do |platform|
  platform.character_limit = 500
end

# Create test user if in development environment
if Rails.env.development?
  user = User.find_or_create_by(email: 'test@example.com') do |u|
    u.password = 'password'
    u.password_confirmation = 'password'
  end

  # Create test accounts
  unless user.accounts.exists?
    user.accounts.create!(
      platform_id: 'bluesky',
      username: 'test_user',
      display_name: 'Test User',
      avatar_url: 'https://placehold.co/100',
      instance_url: nil,
      access_token: 'test_token',
      refresh_token: 'test_refresh',
      expires_at: 1.year.from_now,
      is_active: true
    )

    user.accounts.create!(
      platform_id: 'mastodon',
      username: 'test_user',
      display_name: 'Test User',
      avatar_url: 'https://placehold.co/100',
      instance_url: 'mastodon.social',
      access_token: 'test_token',
      refresh_token: 'test_refresh',
      expires_at: 1.year.from_now,
      is_active: true
    )

    user.accounts.create!(
      platform_id: 'threads',
      username: 'test_user',
      display_name: 'Test User',
      avatar_url: 'https://placehold.co/100',
      instance_url: nil,
      access_token: 'test_token',
      refresh_token: 'test_refresh',
      expires_at: 1.year.from_now,
      is_active: true
    )
  end

  # Create test drafts
  unless user.drafts.exists?
    user.drafts.create!(
      content: 'This is a test draft post for Multipost. #test',
      platform_selections: [
        { id: 'bluesky', isSelected: true },
        { id: 'mastodon', isSelected: true },
        { id: 'threads', isSelected: false }
      ]
    )
  end

  # Create test splitting configurations
  unless user.splitting_configurations.exists?
    user.splitting_configurations.create!(
      name: 'Default Configuration',
      strategies: [ 'semantic', 'retain_hashtags' ]
    )

    user.splitting_configurations.create!(
      name: 'All Strategies',
      strategies: [ 'semantic', 'sentence', 'retain_hashtags', 'preserve_mentions' ]
    )
  end
end
