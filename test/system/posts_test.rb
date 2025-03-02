require "application_system_test_case"

class PostsTest < ApplicationSystemTestCase
  setup do
    @post = posts(:one)
  end

  test "visiting the index" do
    visit posts_url
    assert_selector "h1", text: "Posts"
  end

  test "should create post" do
    visit posts_url
    click_on "New post"

    fill_in "Bluesky", with: @post.bluesky
    fill_in "Dreamwidth", with: @post.dreamwidth
    fill_in "Facebook", with: @post.facebook
    fill_in "Mastodon", with: @post.mastodon
    fill_in "Pillowfort", with: @post.pillowfort
    check "Ready" if @post.ready
    fill_in "Text", with: @post.text
    fill_in "Threads", with: @post.threads
    fill_in "Tumblr", with: @post.tumblr
    fill_in "X", with: @post.x
    click_on "Create Post"

    assert_text "Post was successfully created"
    click_on "Back"
  end

  test "should update Post" do
    visit post_url(@post)
    click_on "Edit this post", match: :first

    fill_in "Bluesky", with: @post.bluesky
    fill_in "Dreamwidth", with: @post.dreamwidth
    fill_in "Facebook", with: @post.facebook
    fill_in "Mastodon", with: @post.mastodon
    fill_in "Pillowfort", with: @post.pillowfort
    check "Ready" if @post.ready
    fill_in "Text", with: @post.text
    fill_in "Threads", with: @post.threads
    fill_in "Tumblr", with: @post.tumblr
    fill_in "X", with: @post.x
    click_on "Update Post"

    assert_text "Post was successfully updated"
    click_on "Back"
  end

  test "should destroy Post" do
    visit post_url(@post)
    click_on "Destroy this post", match: :first

    assert_text "Post was successfully destroyed"
  end
end
