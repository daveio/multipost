require "test_helper"

class PlatformTest < ActiveSupport::TestCase
  test "platform validity" do
    platform = Platform.new(
      name: "newplatform",
      character_limit: 280
    )
    assert platform.valid?
  end

  test "platform requires name" do
    platform = Platform.new(character_limit: 280)
    assert_not platform.valid?
    assert_includes platform.errors[:name], "can't be blank"
  end

  test "platform requires character_limit" do
    platform = Platform.new(name: "newplatform")
    assert_not platform.valid?
    assert_includes platform.errors[:character_limit], "can't be blank"
  end

  test "platform requires positive character_limit" do
    platform = Platform.new(name: "newplatform", character_limit: 0)
    assert_not platform.valid?
    assert_includes platform.errors[:character_limit], "must be greater than 0"
  end

  test "platform name must be unique" do
    existing_platform = platforms(:bluesky)
    platform = Platform.new(name: existing_platform.name, character_limit: 280)
    assert_not platform.valid?
    assert_includes platform.errors[:name], "has already been taken"
  end

  test "default_platforms creates standard platform entries" do
    # Delete existing platforms first to avoid uniqueness constraint issues
    Platform.delete_all

    platforms = Platform.default_platforms
    assert_equal 3, platforms.count

    platform_names = platforms.map(&:name)
    assert_includes platform_names, "bluesky"
    assert_includes platform_names, "mastodon"
    assert_includes platform_names, "threads"

    bluesky = Platform.find_by(name: "bluesky")
    assert_equal 300, bluesky.character_limit

    mastodon = Platform.find_by(name: "mastodon")
    assert_equal 500, mastodon.character_limit
  end

  test "default_platforms doesn't duplicate existing entries" do
    # Get the current count of platforms
    original_count = Platform.count

    # Call default_platforms which should return existing platforms
    platforms = Platform.default_platforms

    # Verify count hasn't changed
    assert_equal original_count, Platform.count

    # Verify the returned platforms match our expectations
    assert_equal 3, platforms.count
    assert_includes platforms.map(&:name), "bluesky"
    assert_includes platforms.map(&:name), "mastodon"
    assert_includes platforms.map(&:name), "threads"
  end

  test "PLATFORM_CHARACTER_LIMITS constant is defined correctly" do
    assert_equal 300, Platform::PLATFORM_CHARACTER_LIMITS["bluesky"]
    assert_equal 500, Platform::PLATFORM_CHARACTER_LIMITS["mastodon"]
    assert_equal 500, Platform::PLATFORM_CHARACTER_LIMITS["threads"]
  end
end
