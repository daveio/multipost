require "test_helper"

class DraftsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get drafts_index_url
    assert_response :success
  end

  test "should get show" do
    get drafts_show_url
    assert_response :success
  end

  test "should get new" do
    get drafts_new_url
    assert_response :success
  end

  test "should get create" do
    get drafts_create_url
    assert_response :success
  end

  test "should get edit" do
    get drafts_edit_url
    assert_response :success
  end

  test "should get update" do
    get drafts_update_url
    assert_response :success
  end

  test "should get destroy" do
    get drafts_destroy_url
    assert_response :success
  end
end
