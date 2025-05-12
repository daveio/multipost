require "test_helper"

class PostsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @post = posts(:john_post)
    sign_in @user
  end

  test "should get index" do
    get posts_path
    assert_response :success
  end

  test "should get show" do
    get post_path(@post)
    assert_response :success
  end

  test "should get new" do
    get new_post_path
    assert_response :success
  end

  test "should create post" do
    assert_difference("Post.count") do
      post posts_path, params: {
        post: {
          content: "New post content",
          platform_selections: [{ id: "bluesky", isSelected: true }].to_json
        }
      }
    end
    assert_redirected_to post_path(Post.last)
  end

  test "should get edit" do
    get edit_post_path(@post)
    assert_response :success
  end

  test "should update post" do
    patch post_path(@post), params: {
      post: {
        content: "Updated post content"
      }
    }
    assert_redirected_to post_path(@post)
    @post.reload
    assert_equal "Updated post content", @post.content
  end

  test "should destroy post" do
    assert_difference("Post.count", -1) do
      delete post_path(@post)
    end
    assert_redirected_to posts_path
  end

  test "should split post" do
    post split_posts_path, params: {
      content: "This is a long post that needs to be split into multiple parts.",
      platform_id: "bluesky",
      strategies: ["semantic"]
    }, as: :json
    assert_response :success
    assert_equal "application/json", @response.media_type
  end

  test "should optimize post" do
    post optimize_posts_path, params: {
      content: "This post needs to be optimized",
      platform_id: "bluesky"
    }, as: :json
    assert_response :success
    assert_equal "application/json", @response.media_type
  end

  test "requires authentication" do
    sign_out @user
    get posts_path
    assert_redirected_to new_user_session_path
  end
end
