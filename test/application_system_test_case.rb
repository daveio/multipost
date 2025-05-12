require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 1400 ]

  include VisualRegressionHelper

  # Use these class variables to control Percy integration
  @@percy_enabled = ENV["PERCY_ENABLED"] == "true"
  @@screenshot_dir = Rails.root.join("tmp", "screenshots")

  setup do
    # Configure DatabaseCleaner for system tests (use truncation strategy)
    DatabaseCleanerHelper.setup_system_tests
    DatabaseCleanerHelper.start

    # Initialize Percy if enabled
    initialize_percy if @@percy_enabled

    # Create screenshot directory if it doesn't exist
    FileUtils.mkdir_p(@@screenshot_dir) unless Dir.exist?(@@screenshot_dir)
  end

  teardown do
    # Clean the database
    DatabaseCleanerHelper.clean

    # Finalize Percy if enabled
    finalize_percy if @@percy_enabled
  end

  # Override to conditionally enable Percy
  def visual_snapshot(name, options = {})
    if @@percy_enabled
      super
    else
      # Save local screenshot instead
      save_debug_screenshot(name)
    end
  end
end
