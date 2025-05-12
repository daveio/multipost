# Start SimpleCov at the very beginning of the test process
require "simplecov"
SimpleCov.start "rails" do
  # Add groups for better organization in the coverage report
  add_group "Services", "app/services"
  add_group "Helpers", "app/helpers"
  add_group "Jobs", "app/jobs"
  add_group "Mailers", "app/mailers"

  # Exclude certain files from coverage calculation
  add_filter "/test/"
  add_filter "/config/"
  add_filter "/vendor/"
  add_filter "/bin/"

  # Set a minimum coverage percentage
  minimum_coverage 80

  # Coverage directory
  coverage_dir "coverage"
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "database_cleaner-active_record"
require "database_cleaner-redis" if Object.const_defined?("Redis")

# Require test support files
Dir[Rails.root.join("test/support/**/*.rb")].each { |f| require f }

# Configure DatabaseCleaner
DatabaseCleanerHelper.setup

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Include test helpers
    include PostTestHelpers
    include AuthTestHelpers
    include PlatformTestHelpers
    include OpenaiTestHelpers
    include PlatformApiMockHelpers
    include Factories
    include VisualRegressionHelper
    include TestContextHelper
    include SharedExamplesHelper
    include ApiTestHelper

    # Set up DatabaseCleaner for each test
    setup do
      DatabaseCleanerHelper.start
    end

    # Clean up after each test
    teardown do
      DatabaseCleanerHelper.clean
    end
  end
end

module Devise
  module Test
    module IntegrationHelpers
      def sign_in(user)
        post user_session_path, params: { user: { email: user.email, password: "password123" } }
      end

      def sign_out(user)
        delete destroy_user_session_path
      end
    end
  end
end

class ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers
end
