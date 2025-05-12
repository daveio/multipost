require "test_helper"

class MediaFileTest < ActiveSupport::TestCase
  test "media file validity" do
    media_file = MediaFile.new(
      name: "test_image.jpg",
      file_type: "image/jpeg",
      size: 10240,
      url: "/uploads/test_image.jpg",
      preview_url: "/uploads/thumbnails/test_image.jpg",
      created_by: users(:john)
    )
    assert media_file.valid?
  end

  test "media file requires name" do
    media_file = MediaFile.new(file_type: "image/jpeg", size: 10240, url: "/uploads/test.jpg")
    assert_not media_file.valid?
    assert_includes media_file.errors[:name], "can't be blank"
  end

  test "media file requires file_type" do
    media_file = MediaFile.new(name: "test.jpg", size: 10240, url: "/uploads/test.jpg")
    assert_not media_file.valid?
    assert_includes media_file.errors[:file_type], "can't be blank"
  end

  test "media file requires size" do
    media_file = MediaFile.new(name: "test.jpg", file_type: "image/jpeg", url: "/uploads/test.jpg")
    assert_not media_file.valid?
    assert_includes media_file.errors[:size], "can't be blank"
  end

  test "media file requires url" do
    media_file = MediaFile.new(name: "test.jpg", file_type: "image/jpeg", size: 10240)
    assert_not media_file.valid?
    assert_includes media_file.errors[:url], "can't be blank"
  end

  test "media file size must be greater than 0" do
    media_file = MediaFile.new(
      name: "test.jpg",
      file_type: "image/jpeg",
      size: 0,
      url: "/uploads/test.jpg"
    )
    assert_not media_file.valid?
    assert_includes media_file.errors[:size], "must be greater than 0"
  end

  test "media file belongs to uploadable polymorphically" do
    post_media = media_files(:john_post_image)
    assert_equal posts(:john_post), post_media.uploadable
    assert_equal "Post", post_media.uploadable_type

    draft_media = media_files(:john_draft_video)
    assert_equal drafts(:john_draft), draft_media.uploadable
    assert_equal "Draft", draft_media.uploadable_type
  end

  test "media file belongs to created_by user" do
    media_file = media_files(:john_post_image)
    assert_equal users(:john), media_file.created_by
  end

  test "uploadable is optional" do
    media_file = media_files(:unassociated_image)
    assert_nil media_file.uploadable
    assert media_file.valid?
  end

  test "created_by is optional" do
    media_file = MediaFile.new(
      name: "test.jpg",
      file_type: "image/jpeg",
      size: 10240,
      url: "/uploads/test.jpg"
    )
    assert media_file.valid?
    assert_nil media_file.created_by
  end

  test "image? returns true for image files" do
    image_file = media_files(:john_post_image)
    assert image_file.image?
  end

  test "image? returns false for non-image files" do
    video_file = media_files(:john_draft_video)
    assert_not video_file.image?
  end

  test "video? returns true for video files" do
    video_file = media_files(:john_draft_video)
    assert video_file.video?
  end

  test "video? returns false for non-video files" do
    image_file = media_files(:john_post_image)
    assert_not image_file.video?
  end

  test "audio? returns true for audio files" do
    audio_file = MediaFile.new(file_type: "audio/mp3")
    assert audio_file.audio?
  end

  test "audio? returns false for non-audio files" do
    image_file = media_files(:john_post_image)
    assert_not image_file.audio?
  end

  test "file_extension returns correct extension" do
    image_file = media_files(:john_post_image)
    assert_equal ".jpg", image_file.file_extension

    png_file = media_files(:jane_post_image)
    assert_equal ".png", png_file.file_extension

    video_file = media_files(:john_draft_video)
    assert_equal ".mp4", video_file.file_extension
  end

  test "humanized_size returns human-readable size" do
    small_file = MediaFile.new(size: 1024)
    assert_equal "1 KB", small_file.humanized_size

    medium_file = media_files(:john_post_image)  # 51200 bytes = 50 KB
    assert_equal "50 KB", medium_file.humanized_size

    large_file = media_files(:john_draft_video)  # 1048576 bytes = 1 MB
    assert_equal "1 MB", large_file.humanized_size
  end
end
