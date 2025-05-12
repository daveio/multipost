require "test_helper"

class PlatformServicesTest < ActiveSupport::TestCase
  test "mock bluesky service creates posts" do
    mock_platform_apis do
      service = mock_platform_service('bluesky')
      content = "This is a test post to Bluesky"
      
      response = service.create_post(content)
      
      assert response[:success]
      assert_match(/at:\/\/did:plc:/, response[:post_id])
      assert_match(/https:\/\/bsky\.app\/profile\//, response[:url])
      
      # Check that post was stored in the mock
      posts = service.get_posts
      assert_equal 1, posts.size
      assert_equal content, posts.first[:text]
    end
  end
  
  test "mock bluesky service handles errors" do
    mock_platform_apis do
      service = mock_platform_service('bluesky')
      
      # Test with blank content
      response = service.create_post("")
      assert_not response[:success]
      assert_match(/Content can't be blank/, response[:error])
      
      # Test with TRIGGER_ERROR keyword
      response = service.create_post("TRIGGER_ERROR in this post")
      assert_not response[:success]
      assert_match(/Simulated API error/, response[:error])
      
      # Test with too long content
      platform = platforms(:bluesky)
      too_long_content = "x" * (platform.character_limit + 1)
      response = service.create_post(too_long_content)
      assert_not response[:success]
      assert_match(/exceeds the maximum length/, response[:error])
    end
  end
  
  test "mock mastodon service creates posts" do
    mock_platform_apis do
      service = mock_platform_service('mastodon')
      content = "This is a test post to Mastodon"
      
      response = service.create_post(content)
      
      assert response[:success]
      assert response[:post_id].present?
      assert_match(/https:\/\/mastodon\.social\/@test_user\//, response[:url])
      
      # Check that post was stored in the mock
      posts = service.get_posts
      assert_equal 1, posts.size
      assert_equal content, posts.first[:content]
      assert_equal 'public', posts.first[:visibility]
    end
  end
  
  test "mock mastodon service handles media uploads" do
    mock_platform_apis do
      service = mock_platform_service('mastodon')
      content = "Post with media"
      
      # Create a mock media file
      media_file = MediaFile.new(
        name: "test_image.jpg",
        file_type: "image/jpeg",
        size: 10240,
        url: "/uploads/test_image.jpg"
      )
      
      response = service.create_post(content, [media_file])
      
      assert response[:success]
      posts = service.get_posts
      assert_equal 1, posts.size
      assert_equal 1, posts.first[:media_ids].size
    end
  end
  
  test "mock mastodon service handles errors" do
    mock_platform_apis do
      service = mock_platform_service('mastodon')
      
      # Test with blank content
      response = service.create_post("")
      assert_not response[:success]
      assert_match(/Content can't be blank/, response[:error])
      
      # Test with TRIGGER_ERROR keyword
      response = service.create_post("TRIGGER_ERROR in this post")
      assert_not response[:success]
      assert_match(/Simulated API error/, response[:error])
      
      # Test with media error
      media_file = MediaFile.new(
        name: "TRIGGER_ERROR_image.jpg",
        file_type: "image/jpeg",
        size: 10240,
        url: "/uploads/error_image.jpg"
      )
      
      response = service.create_post("Test with problematic media", [media_file])
      assert_not response[:success]
      assert_match(/Simulated media upload error/, response[:error])
    end
  end
  
  test "mock threads service creates posts" do
    mock_platform_apis do
      service = mock_platform_service('threads')
      content = "This is a test post to Threads"
      
      response = service.create_post(content)
      
      assert response[:success]
      assert response[:post_id].present?
      assert_match(/https:\/\/threads\.net\/test_user\/post\//, response[:url])
      
      # Check that post was stored in the mock
      posts = service.get_posts
      assert_equal 1, posts.size
      assert_equal content, posts.first[:text]
    end
  end
  
  test "mock threads service creates replies" do
    mock_platform_apis do
      service = mock_platform_service('threads')
      
      # Create parent post
      parent_response = service.create_post("Parent post")
      assert parent_response[:success]
      
      # Create reply
      reply_response = service.create_post("Reply post", [], parent_response[:post_id])
      assert reply_response[:success]
      
      # Check reply relationship
      posts = service.get_posts
      assert_equal 2, posts.size
      assert_equal parent_response[:post_id], posts.last[:reply_to_id]
    end
  end
  
  test "mock threads service handles errors" do
    mock_platform_apis do
      service = mock_platform_service('threads')
      
      # Test with blank content
      response = service.create_post("")
      assert_not response[:success]
      assert_match(/Content can't be blank/, response[:error])
      
      # Test with TRIGGER_ERROR keyword
      response = service.create_post("TRIGGER_ERROR in this post")
      assert_not response[:success]
      assert_match(/Simulated API error/, response[:error])
    end
  end
end