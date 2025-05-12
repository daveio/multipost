require "test_helper"

class Api::PostsApiTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    
    # Get a valid authentication token for the user
    post "/users/sign_in.json", params: {
      user: {
        email: @user.email,
        password: "password123"
      }
    }
    
    @auth_token = response.headers["Authorization"]
    @post = posts(:john_post)
  end
  
  test "GET /api/posts returns a list of posts" do
    get "/api/posts", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    
    assert_response :success
    assert_equal "application/json; charset=utf-8", response.content_type
    
    json_response = JSON.parse(response.body)
    assert_includes json_response.keys, "posts"
    assert_kind_of Array, json_response["posts"]
  end
  
  test "GET /api/posts/:id returns a specific post" do
    get "/api/posts/#{@post.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    
    assert_response :success
    assert_equal "application/json; charset=utf-8", response.content_type
    
    json_response = JSON.parse(response.body)
    assert_equal @post.id, json_response["id"]
    assert_equal @post.content, json_response["content"]
  end
  
  test "POST /api/posts creates a new post" do
    post_params = {
      post: {
        content: "New post from API test",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json
      }
    }
    
    assert_difference("Post.count") do
      post "/api/posts", params: post_params, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "New post from API test", json_response["content"]
    assert_equal @user.id, json_response["user_id"]
  end
  
  test "POST /api/posts with invalid params returns errors" do
    post_params = {
      post: {
        content: "",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json
      }
    }
    
    assert_no_difference("Post.count") do
      post "/api/posts", params: post_params, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["errors"].keys, "content"
  end
  
  test "PATCH /api/posts/:id updates a post" do
    update_params = {
      post: {
        content: "Updated post content"
      }
    }
    
    patch "/api/posts/#{@post.id}", params: update_params, headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "Updated post content", json_response["content"]
    
    # Verify the post was updated in the database
    @post.reload
    assert_equal "Updated post content", @post.content
  end
  
  test "DELETE /api/posts/:id deletes a post" do
    assert_difference("Post.count", -1) do
      delete "/api/posts/#{@post.id}", headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :success
    assert_equal({ "success" => true }.to_json, response.body)
    assert_raises(ActiveRecord::RecordNotFound) { @post.reload }
  end
  
  test "POST /api/posts/split splits a post" do
    # Mock the OpenAI service
    mock_openai_service do
      split_params = {
        content: "This is a long post that needs to be split into multiple parts for better readability across platforms. It should be appropriately formatted and maintain the original meaning while respecting character limits.",
        platform_id: "bluesky",
        strategies: ["semantic"]
      }
      
      post "/api/posts/split", params: split_params, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
      
      assert_response :success
      json_response = JSON.parse(response.body)
      assert_includes json_response.keys, "splits"
      assert_kind_of Array, json_response["splits"]
      assert json_response["splits"].size > 1
      assert_includes json_response.keys, "reasoning"
    end
  end
  
  test "POST /api/posts/optimize optimizes a post" do
    # Mock the OpenAI service
    mock_openai_service do
      optimize_params = {
        content: "This is a post that needs to be optimized for better engagement and readability on social media platforms.",
        platform_id: "bluesky"
      }
      
      post "/api/posts/optimize", params: optimize_params, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
      
      assert_response :success
      json_response = JSON.parse(response.body)
      assert_includes json_response.keys, "optimized_content"
      assert_includes json_response.keys, "reasoning"
    end
  end
  
  test "API requires authentication" do
    # Try without authentication
    get "/api/posts", headers: { "Accept" => "application/json" }
    assert_response :unauthorized
    
    get "/api/posts/#{@post.id}", headers: { "Accept" => "application/json" }
    assert_response :unauthorized
    
    post_params = {
      post: {
        content: "New post from API test",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json
      }
    }
    
    post "/api/posts", params: post_params, headers: { "Accept" => "application/json" }
    assert_response :unauthorized
  end
  
  test "API enforces authorization" do
    # Create another user
    other_user = create_user_with(email: "other@example.com")
    other_post = create_post_for(other_user, "Post by other user")
    
    # Try to access another user's post
    get "/api/posts/#{other_post.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    assert_response :forbidden
    
    # Try to update another user's post
    update_params = {
      post: {
        content: "Trying to update another user's post"
      }
    }
    
    patch "/api/posts/#{other_post.id}", params: update_params, headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    assert_response :forbidden
    
    # Try to delete another user's post
    delete "/api/posts/#{other_post.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    assert_response :forbidden
  end
end