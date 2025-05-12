module PlatformTestHelpers
  # Create a platform with the given attributes
  # @param attributes [Hash] attributes for the platform
  # @return [Platform] the created platform
  def create_platform(attributes = {})
    default_attributes = {
      name: "test_platform_#{Time.now.to_i}",
      character_limit: 280
    }

    Platform.create!(default_attributes.merge(attributes))
  end

  # Create an account for a user on a specific platform
  # @param user [User] the user who owns the account
  # @param platform_id [String] the platform ID
  # @param attributes [Hash] additional attributes for the account
  # @return [Account] the created account
  def create_account(user = users(:john), platform_id = "bluesky", attributes = {})
    default_attributes = {
      username: "#{user.email.split('@').first}_#{platform_id}",
      display_name: user.email.split("@").first.titleize,
      access_token: "#{platform_id}_token_#{Time.now.to_i}",
      is_active: true
    }

    user.accounts.create!(
      { platform_id: platform_id }.merge(default_attributes).merge(attributes)
    )
  end

  # Create a splitting configuration for a user
  # @param user [User] the user who owns the configuration
  # @param name [String] the configuration name
  # @param strategies [Array] the strategies to use
  # @return [SplittingConfiguration] the created configuration
  def create_splitting_configuration(user = users(:john), name = nil, strategies = [ "semantic" ])
    name ||= "Test Config #{Time.now.to_i}"

    user.splitting_configurations.create!(
      name: name,
      strategies: strategies.to_json
    )
  end

  # Helper to assert platform is properly set up
  # @param platform [Platform] the platform to check
  def assert_valid_platform(platform)
    assert platform.valid?, "Expected platform to be valid, but it had errors: #{platform.errors.full_messages.join(', ')}"
    assert platform.name.present?, "Platform name should be present"
    assert platform.character_limit.positive?, "Platform character limit should be positive"
  end

  # Helper to assert account is properly set up
  # @param account [Account] the account to check
  # @param platform_id [String] the expected platform ID
  def assert_valid_account(account, platform_id = nil)
    assert account.valid?, "Expected account to be valid, but it had errors: #{account.errors.full_messages.join(', ')}"
    assert account.username.present?, "Account username should be present"
    assert account.access_token.present?, "Account access token should be present"

    if platform_id
      assert_equal platform_id, account.platform_id,
        "Expected account to be for platform #{platform_id}, but it was for #{account.platform_id}"
    end
  end

  # Helper to get active accounts for a user on a platform
  # @param user [User] the user to check
  # @param platform_id [String] the platform ID
  # @return [ActiveRecord::Relation] the accounts
  def active_accounts_for(user, platform_id)
    user.accounts.where(platform_id: platform_id, is_active: true)
  end
end
