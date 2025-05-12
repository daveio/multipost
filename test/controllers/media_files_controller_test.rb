require "test_helper"

class MediaFilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @media_file = media_files(:john_post_image)
    sign_in @user
  end

  test "should create media file" do
    # Create a test file
    file = fixture_file_upload('files/test_image.jpg', 'image/jpeg')

    assert_difference("MediaFile.count") do
      post media_files_path, params: { file: file }, as: :json
    end
    assert_response :success
    assert_equal "application/json", @response.media_type
  end

  test "should destroy media file" do
    assert_difference("MediaFile.count", -1) do
      delete media_file_path(@media_file), as: :json
    end
    assert_response :success
  end

  test "requires authentication" do
    sign_out @user
    post media_files_path, params: { file: fixture_file_upload('files/test_image.jpg', 'image/jpeg') }, as: :json
    assert_redirected_to new_user_session_path
  end
end
