require "test_helper"

class DraftTest < ActiveSupport::TestCase
  test "draft validity" do
    draft = Draft.new(
      user: users(:john),
      content: "This is a draft post content"
    )
    assert draft.valid?
  end

  test "draft requires content" do
    draft = Draft.new(user: users(:john))
    assert_not draft.valid?
    assert_includes draft.errors[:content], "can't be blank"
  end

  test "draft requires user" do
    draft = Draft.new(content: "This is a draft post content")
    assert_not draft.valid?
    assert_includes draft.errors[:user], "must exist"
  end

  test "draft belongs to user" do
    draft = drafts(:john_draft)
    assert_equal users(:john), draft.user
  end

  test "draft has many media_files" do
    draft = drafts(:john_draft)
    assert_includes draft.media_files, media_files(:john_draft_video)
  end

  test "selected_platforms returns array of selected platform ids" do
    draft = drafts(:john_draft)
    assert_equal [ "bluesky", "mastodon" ], draft.selected_platforms
  end

  test "selected_platforms returns empty array when platform_selections is empty" do
    draft = drafts(:john_empty_draft)
    assert_empty draft.selected_platforms
  end

  test "to_post creates a new post with the draft's content and selections" do
    draft = drafts(:john_draft)
    post = draft.to_post

    # Verify the post is a new unpersisted record
    assert post.new_record?

    # Verify attributes were copied correctly
    assert_equal draft.user, post.user
    assert_equal draft.content, post.content
    assert_equal draft.platform_selections, post.platform_selections

    # Verify the post is valid and can be saved
    assert post.valid?
  end

  test "to_post copies media files to the new post" do
    draft = drafts(:john_draft)
    post = draft.to_post

    # Verify media files were copied
    assert_equal 1, post.media_files.size

    # Verify media file attributes
    draft_media = draft.media_files.first
    post_media = post.media_files.first

    assert_equal draft_media.name, post_media.name
    assert_equal draft_media.file_type, post_media.file_type
    assert_equal draft_media.size, post_media.size
    assert_equal draft_media.url, post_media.url
    assert_equal draft_media.preview_url, post_media.preview_url

    # Verify the post media file is a new unpersisted record
    assert post_media.new_record?
  end

  test "draft media_files are destroyed when draft is destroyed" do
    draft = drafts(:john_draft)
    media_file_id = media_files(:john_draft_video).id

    assert MediaFile.exists?(media_file_id)
    draft.destroy
    assert_not MediaFile.exists?(media_file_id)
  end
end
