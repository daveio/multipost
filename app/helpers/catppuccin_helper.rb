# typed: false
# frozen_string_literal: true

# Provides access to Catppuccin theme colors and theme switching functionality
module CatppuccinHelper
  # Returns the current Catppuccin flavor (e.g., :frappe, :latte)
  def current_catppuccin_flavor
    CatppuccinColors.current_flavor
  end

  # Get a Catppuccin color value by name
  # @param name [Symbol, String] color name (e.g., :blue, "green")
  # @param flavor [Symbol, nil] optional flavor to use, otherwise uses current flavor
  # @return [String] hex color value
  def catppuccin_color(name, flavor = nil)
    CatppuccinColors.color(name, flavor)
  end

  # Returns all available Catppuccin flavors
  # @return [Array<Symbol>] array of flavor names
  def catppuccin_flavors
    CatppuccinColors.flavors
  end

  # Generates HTML attributes for theme switching
  # @param html_options [Hash] additional HTML attributes
  # @return [Hash] HTML attributes with data attributes for theme switching
  def theme_switch_attributes(html_options = {})
    html_options.merge(
      {
        'data-theme-toggle': "true",
        'data-light-theme': "latte",
        'data-dark-theme': "frappe"
      }
    )
  end
end
