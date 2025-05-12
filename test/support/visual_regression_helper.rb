module VisualRegressionHelper
  # Initialize Percy for visual regression testing
  def initialize_percy
    require "percy/capybara"
    Percy::Capybara.initialize_build
  end

  # Finalize Percy build
  def finalize_percy
    Percy::Capybara.finalize_build
  end

  # Take a screenshot for visual regression testing
  # @param name [String] the name of the screenshot
  # @param options [Hash] options to pass to Percy
  def visual_snapshot(name, options = {})
    begin
      require "percy/capybara"
      Percy::Capybara.screenshot(page, options.merge(name: name))
    rescue LoadError => e
      puts "Percy not available: #{e.message}"
    rescue StandardError => e
      puts "Percy screenshot failed: #{e.message}"
    end
  end

  # Compare a page with different themes for visual regression
  # @param name [String] the base name for screenshots
  # @param themes [Array<String>] the themes to compare
  def visual_compare_themes(name, themes = [ "latte", "frappe", "macchiato", "mocha" ])
    themes.each do |theme|
      # Apply the theme
      execute_script("document.documentElement.setAttribute('data-theme', '#{theme}')")
      sleep 0.5 # Let the transition complete

      # Take a screenshot with the theme name
      visual_snapshot("#{name} - #{theme}")
    end
  end

  # Compare a page in different screen sizes for visual regression
  # @param name [String] the base name for screenshots
  # @param sizes [Hash] the screen sizes to compare (name => [width, height])
  def visual_compare_responsive(name, sizes = {})
    default_sizes = {
      mobile: [ 375, 667 ],     # iPhone 8
      tablet: [ 768, 1024 ],    # iPad
      desktop: [ 1280, 800 ],   # Standard desktop
      widescreen: [ 1920, 1080 ] # Large desktop
    }

    sizes = default_sizes.merge(sizes)

    current_size = [ page.current_window.size[0], page.current_window.size[1] ]

    sizes.each do |size_name, dimensions|
      # Resize the window
      page.current_window.resize_to(dimensions[0], dimensions[1])
      sleep 0.5 # Let any responsive adjustments take place

      # Take a screenshot with the size name
      visual_snapshot("#{name} - #{size_name}")
    end

    # Restore original size
    page.current_window.resize_to(current_size[0], current_size[1])
  end

  # Save a local screenshot for debugging (not sent to Percy)
  # @param name [String] the name of the screenshot file
  def save_debug_screenshot(name)
    timestamp = Time.now.strftime("%Y%m%d%H%M%S")
    filename = "#{timestamp}_#{name.gsub(/[^a-z0-9]/i, '_').downcase}.png"
    path = Rails.root.join("tmp", "screenshots", filename)

    # Ensure the directory exists
    FileUtils.mkdir_p(Rails.root.join("tmp", "screenshots"))

    page.save_screenshot(path)
    puts "Debug screenshot saved to: #{path}"
  end
end
