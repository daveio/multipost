require "test_helper"

class SplittingConfigurationsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get splitting_configurations_index_url
    assert_response :success
  end

  test "should get show" do
    get splitting_configurations_show_url
    assert_response :success
  end

  test "should get new" do
    get splitting_configurations_new_url
    assert_response :success
  end

  test "should get create" do
    get splitting_configurations_create_url
    assert_response :success
  end

  test "should get edit" do
    get splitting_configurations_edit_url
    assert_response :success
  end

  test "should get update" do
    get splitting_configurations_update_url
    assert_response :success
  end

  test "should get destroy" do
    get splitting_configurations_destroy_url
    assert_response :success
  end
end
