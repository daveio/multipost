require "test_helper"

class Api::PlatformsApiTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @auth_token = get_auth_token(@user)
    @platform = platforms(:bluesky)
  end
  
  # Test for API authentication and authorization using helper methods
  test "API endpoints require authentication" do
    assert_api_requires_authentication("/api/platforms")
    assert_api_requires_authentication("/api/platforms/#{@platform.id}")
  end
  
  test "GET /api/platforms returns all platforms" do
    json_response = api_get("/api/platforms", @auth_token)
    
    assert_response :success
    assert_api_response_has_keys(json_response, ["platforms"])
    assert_equal Platform.count, json_response["platforms"].size
  end
  
  test "GET /api/platforms/:id returns a specific platform" do
    json_response = api_get("/api/platforms/#{@platform.id}", @auth_token)
    
    assert_response :success
    assert_api_response_has_keys(json_response, ["id", "name", "character_limit"])
    assert_api_response_matches(json_response, {
      id: @platform.id,
      name: @platform.name,
      character_limit: @platform.character_limit
    })
  end
  
  test "GET /api/platforms/:id/accounts returns connected accounts" do
    json_response = api_get("/api/platforms/#{@platform.id}/accounts", @auth_token)
    
    assert_response :success
    assert_api_response_has_keys(json_response, ["accounts"])
    
    # User's accounts for this platform should be included
    account_ids = json_response["accounts"].map { |a| a["id"] }
    user_accounts = @user.accounts.where(platform_id: @platform.name, is_active: true)
    
    user_accounts.each do |account|
      assert_includes account_ids, account.id
    end
  end
  
  # Advanced test with shared examples
  shared_examples_for "platform API endpoint" do |endpoint|
    test "#{endpoint} returns platform details with character limit" do
      json_response = api_get("/api/platforms/#{endpoint}", @auth_token)
      
      assert_response :success
      assert_api_response_has_keys(json_response, ["name", "character_limit"])
      assert json_response["character_limit"] > 0, "Character limit should be a positive number"
    end
  end
  
  # Use shared examples for different platforms
  include_examples "platform API endpoint", "bluesky"
  include_examples "platform API endpoint", "mastodon"
  include_examples "platform API endpoint", "threads"
  
  # Context-based tests for different API scenarios
  context "with platform validation" do
    setup do
      @admin_user = create_user_with(email: "admin@example.com")
      @admin_token = get_auth_token(@admin_user)
    end
    
    test "can validate content length for platform" do
      json_response = api_post("/api/platforms/validate", @auth_token, {
        content: "Test content",
        platform_id: @platform.name
      })
      
      assert_response :success
      assert_api_response_has_keys(json_response, ["valid", "character_count", "remaining"])
      assert_equal true, json_response["valid"]
    end
    
    test "reports invalid content length" do
      # Create content that exceeds the platform's character limit
      long_content = "a" * (@platform.character_limit + 10)
      
      json_response = api_post("/api/platforms/validate", @auth_token, {
        content: long_content,
        platform_id: @platform.name
      })
      
      assert_response :success
      assert_api_response_has_keys(json_response, ["valid", "character_count", "remaining"])
      assert_equal false, json_response["valid"]
      assert json_response["remaining"] < 0, "Remaining characters should be negative for too-long content"
    end
    
    # Admin-only functionality tests
    test "regular users cannot create new platforms" do
      api_post("/api/platforms", @auth_token, {
        platform: {
          name: "new_platform",
          character_limit: 500
        }
      })
      
      assert_response :forbidden
    end
    
    test "admin users can create new platforms" do
      # Make the admin user an admin
      @admin_user.update(admin: true)
      
      assert_difference("Platform.count") do
        api_post("/api/platforms", @admin_token, {
          platform: {
            name: "new_platform",
            character_limit: 500
          }
        })
      end
      
      assert_response :success
    end
  end
  
  context "with error handling" do
    test "handles not found errors" do
      api_get("/api/platforms/nonexistent", @auth_token)
      assert_response :not_found
      
      json_response = JSON.parse(response.body)
      assert_api_response_has_keys(json_response, ["error"])
    end
    
    test "handles validation errors" do
      # Make the user an admin for this test
      @user.update(admin: true)
      
      api_post("/api/platforms", @auth_token, {
        platform: {
          name: "",
          character_limit: 0
        }
      })
      
      assert_response :unprocessable_entity
      json_response = JSON.parse(response.body)
      assert_api_has_validation_errors(json_response, ["name", "character_limit"])
    end
  end
end