require "test_helper"

class Api::MediaFilesApiTest < ActionDispatch::IntegrationTest
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
    @media_file = media_files(:john_post_image)
    @media_file_path = Rails.root.join("test/fixtures/files/test_image.jpg")
  end
  
  test "POST /api/media_files uploads a new media file" do
    # Create a test file for upload
    file = fixture_file_upload(@media_file_path, "image/jpeg")
    
    assert_difference("MediaFile.count") do
      post "/api/media_files", params: { file: file }, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_includes json_response.keys, "id"
    assert_includes json_response.keys, "url"
    assert_includes json_response.keys, "preview_url"
    assert_equal "image/jpeg", json_response["file_type"]
    assert_equal @user.id, json_response["created_by_id"]
  end
  
  test "GET /api/media_files returns a list of media files" do
    get "/api/media_files", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    
    assert_response :success
    assert_equal "application/json; charset=utf-8", response.content_type
    
    json_response = JSON.parse(response.body)
    assert_includes json_response.keys, "media_files"
    assert_kind_of Array, json_response["media_files"]
  end
  
  test "GET /api/media_files/:id returns a specific media file" do
    get "/api/media_files/#{@media_file.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    
    assert_response :success
    assert_equal "application/json; charset=utf-8", response.content_type
    
    json_response = JSON.parse(response.body)
    assert_equal @media_file.id, json_response["id"]
    assert_equal @media_file.name, json_response["name"]
    assert_equal @media_file.url, json_response["url"]
  end
  
  test "POST /api/media_files validates file type" do
    # Create a test file with an invalid type
    invalid_file = fixture_file_upload(@media_file_path, "application/octet-stream")
    
    assert_no_difference("MediaFile.count") do
      post "/api/media_files", params: { file: invalid_file }, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["errors"].keys, "file_type"
  end
  
  test "POST /api/media_files validates file size" do
    # Mock a large file that exceeds the size limit
    # This requires stubbing the file size calculation
    file = fixture_file_upload(@media_file_path, "image/jpeg")
    
    # Stub the file size calculation to return a large size
    MediaFile.any_instance.stubs(:calculate_file_size).returns(20.megabytes)
    
    assert_no_difference("MediaFile.count") do
      post "/api/media_files", params: { file: file }, headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_includes json_response["errors"].keys, "size"
  ensure
    MediaFile.any_instance.unstub(:calculate_file_size)
  end
  
  test "DELETE /api/media_files/:id deletes a media file" do
    assert_difference("MediaFile.count", -1) do
      delete "/api/media_files/#{@media_file.id}", headers: {
        "Authorization" => @auth_token,
        "Accept" => "application/json"
      }
    end
    
    assert_response :success
    assert_equal({ "success" => true }.to_json, response.body)
    assert_raises(ActiveRecord::RecordNotFound) { @media_file.reload }
  end
  
  test "API requires authentication" do
    # Try without authentication
    get "/api/media_files", headers: { "Accept" => "application/json" }
    assert_response :unauthorized
    
    get "/api/media_files/#{@media_file.id}", headers: { "Accept" => "application/json" }
    assert_response :unauthorized
    
    file = fixture_file_upload(@media_file_path, "image/jpeg")
    post "/api/media_files", params: { file: file }, headers: { "Accept" => "application/json" }
    assert_response :unauthorized
  end
  
  test "API enforces authorization" do
    # Create another user
    other_user = create_user_with(email: "other@example.com")
    other_post = create_post_for(other_user, "Post by other user")
    other_media = create_media_file_for(other_post, "other_user_image.jpg", other_user)
    
    # Try to access another user's media file
    get "/api/media_files/#{other_media.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    assert_response :forbidden
    
    # Try to delete another user's media file
    delete "/api/media_files/#{other_media.id}", headers: {
      "Authorization" => @auth_token,
      "Accept" => "application/json"
    }
    assert_response :forbidden
  end
end