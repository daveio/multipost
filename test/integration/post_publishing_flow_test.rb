require "test_helper"

class PostPublishingFlowTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    sign_in @user
  end

  test "can create and publish a post" do
    # Step 1: Navigate to new post page
    get new_post_path
    assert_response :success
    assert_select "h1", "New Post"

    # Step 2: Submit post form
    assert_difference("Post.count") do
      post posts_path, params: {
        post: {
          content: "Integration test post content",
          platform_selections: [{ id: "bluesky", isSelected: true }].to_json
        }
      }
    end

    # Step 3: Follow redirect to show page
    follow_redirect!
    assert_response :success
    assert_select "p", "Integration test post content"
    
    # Save the new post for later steps
    @post = Post.last
  end

  test "can create a post with image attachment" do
    # Create test file
    test_image = fixture_file_upload('files/test_image.jpg', 'image/jpeg')

    # Step 1: Upload media first
    assert_difference("MediaFile.count") do
      post media_files_path, params: { file: test_image }, as: :json
    end
    assert_response :success
    
    # Extract media file ID from response
    media_response = JSON.parse(@response.body)
    media_id = media_response["id"]

    # Step 2: Submit post with media attachment
    assert_difference("Post.count") do
      post posts_path, params: {
        post: {
          content: "Post with image attachment",
          platform_selections: [{ id: "bluesky", isSelected: true }].to_json,
          media_file_ids: [media_id]
        }
      }
    end

    # Step 3: Verify post and attachment relationship
    follow_redirect!
    assert_response :success
    
    # New post should have the media file attached
    @post = Post.last
    assert_equal 1, @post.media_files.count
  end

  test "can create a thread from multiple posts" do
    # Step 1: Create thread parent
    post posts_path, params: {
      post: {
        content: "Thread parent post",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json,
        thread_mode: "1"
      }
    }
    parent_post = Post.last
    
    # Step 2: Create first thread child
    post posts_path, params: {
      post: {
        content: "Thread child 1",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json,
        thread_parent_id: parent_post.id,
        thread_index: 1
      }
    }
    
    # Step 3: Create second thread child
    post posts_path, params: {
      post: {
        content: "Thread child 2",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json,
        thread_parent_id: parent_post.id,
        thread_index: 2
      }
    }
    
    # Step 4: Verify thread structure
    get post_path(parent_post)
    assert_response :success
    
    # Should see all three posts
    assert_select ".post-content", "Thread parent post"
    assert_select ".thread-post", 3
    
    # Parent post should have two children
    parent_post.reload
    assert_equal 2, parent_post.thread_children.count
  end

  test "can convert draft to post" do
    # Step 1: Create draft
    post drafts_path, params: {
      draft: {
        content: "Draft to be published",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json
      }
    }
    follow_redirect!
    
    draft = Draft.last
    
    # Step 2: Convert draft to post
    assert_difference("Post.count") do
      post posts_path, params: {
        post: {
          content: draft.content,
          platform_selections: draft.platform_selections,
          from_draft_id: draft.id
        }
      }
    end
    
    # Step 3: Verify post was created
    follow_redirect!
    assert_response :success
    assert_select "p", "Draft to be published"
    
    # Verify draft was deleted (if that's app behavior) or check status
    get drafts_path
    assert_response :success
    assert_no_match(/Draft to be published/, @response.body)
  end

  test "post creation fails with invalid data" do
    # Try to create a post with empty content
    post posts_path, params: {
      post: {
        content: "",
        platform_selections: [{ id: "bluesky", isSelected: true }].to_json
      }
    }
    
    # Should not redirect, but render new template with errors
    assert_response :unprocessable_entity
    assert_select ".alert", /Content can't be blank/
  end
end