require "test_helper"

# This is a comprehensive example that demonstrates all the test features
# It is not an actual test, but rather a reference for how to use the test suite
class ComprehensiveTestExample < ActiveSupport::TestCase
  # Setup runs before each test
  setup do
    @user = users(:john)
    @post = posts(:john_post)
    @platform = platforms(:bluesky)
  end
  
  # Teardown runs after each test
  teardown do
    # Clean up any test-specific data
  end
  
  # Basic test
  test "basic assertion" do
    assert true
    assert_equal 1, 1
    assert_not false
    assert_includes [1, 2, 3], 2
  end
  
  # Using fixtures
  test "using fixtures" do
    user = users(:john)
    post = posts(:john_post)
    platform = platforms(:bluesky)
    
    assert_equal "john@example.com", user.email
    assert_equal "This is a standalone post by John", post.content
    assert_equal "bluesky", platform.name
  end
  
  # Using factory methods
  test "using factory methods" do
    # Create a user
    user = create_user_with(email: "factory@example.com")
    assert user.persisted?
    
    # Create a post
    post = create_post_for(user, "Factory-created post")
    assert post.persisted?
    
    # Create a thread
    thread = create_thread_for(user, 3)
    assert_equal 2, thread.thread_children.count
    
    # Create an account
    account = create_platform_account_for(user, "bluesky")
    assert account.persisted?
  end
  
  # Using mocks
  test "using openai mock" do
    mock_openai_service do
      service = OpenaiService.new
      result = service.split_post("This is a test post", "bluesky", ["semantic"])
      
      assert result[:success]
      assert_includes result.keys, :splits
    end
  end
  
  test "using platform api mocks" do
    mock_platform_apis do
      service = mock_platform_service("bluesky")
      result = service.create_post("This is a test post")
      
      assert result[:success]
      assert_includes result.keys, :post_id
    end
  end
  
  # Using database cleaner
  test "using custom database cleaning strategy" do
    DatabaseCleanerHelper.use_deletion do
      # Create some test data
      user = User.create!(email: "temp@example.com", password: "password123")
      
      # Do some assertions
      assert User.exists?(email: "temp@example.com")
    end
    
    # Data should be cleaned up after the block
    assert_not User.exists?(email: "temp@example.com")
  end
  
  # Shared examples (defined elsewhere)
  shared_examples_for "a validated model" do |model_class|
    test "requires a name" do
      model = model_class.new
      assert_not model.valid?
      assert_includes model.errors[:name], "can't be blank"
    end
  end
  
  # Using shared examples
  include_examples "a validated model", Platform
  
  # Using contexts
  context "when user is logged in" do
    setup do
      @controller = ApplicationController.new
      @controller.instance_variable_set(:@current_user, @user)
    end
    
    test "user is authenticated" do
      assert @controller.instance_variable_get(:@current_user).present?
    end
    
    # Nested context
    context "with admin role" do
      setup do
        @user.admin = true
        @user.save!
      end
      
      test "user has admin privileges" do
        assert @user.admin?
      end
    end
  end
  
  # Using API helpers
  test "using API helpers" do
    token = "test_token"
    
    # These won't actually run in this example, but demonstrate the syntax
    response = api_get("/api/posts", token)
    assert_api_response_has_keys(response, ["posts"])
    
    assert_api_requires_authentication("/api/posts")
    assert_api_enforces_authorization("/api/posts/123", token, :delete)
  end
  
  # Visual regression examples
  test "visual regression example" do
    # These won't actually run in this example, but demonstrate the syntax
    visit root_path
    visual_snapshot("Dashboard")
    visual_compare_themes("Dashboard")
    visual_compare_responsive("Dashboard")
  end
end