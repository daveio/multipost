require "test_helper"

class OpenaiServiceTest < ActiveSupport::TestCase
  setup do
    @platform = platforms(:bluesky)
    @long_content = "This is a very long post that needs to be split into multiple parts. " * 10
    @short_content = "This is a short post that fits within the character limit."
  end

  test "mock split_post returns multiple parts for long content" do
    mock_openai_service do
      service = OpenaiService.new
      result = service.split_post(@long_content, @platform.name, [ "semantic" ])

      # Assert success
      assert result[:success]

      # Should have multiple parts
      assert result[:splits].count > 1

      # Each part should include the thread position marker (e.g., "1/3")
      result[:splits].each_with_index do |split, index|
        assert_match(/#{index + 1}\/\d+/, split["content"])
        assert split["character_count"] <= @platform.character_limit
      end

      # Should include reasoning
      assert result[:reasoning].present?
    end
  end

  test "mock split_post returns single part for short content" do
    mock_openai_service do
      service = OpenaiService.new
      result = service.split_post(@short_content, @platform.name, [ "semantic" ])

      # Assert success
      assert result[:success]

      # Should have just one part
      assert_equal 1, result[:splits].count

      # Part should include the thread position marker (e.g., "1/1")
      assert_match(/1\/1/, result[:splits].first["content"])

      # Should include reasoning
      assert result[:reasoning].present?
    end
  end

  test "mock split_post handles error cases" do
    mock_openai_service do
      service = OpenaiService.new

      # Missing content
      result = service.split_post("", @platform.name, [ "semantic" ])
      assert_not result[:success]
      assert_equal "Content is required", result[:error]

      # Missing platform
      result = service.split_post(@short_content, "", [ "semantic" ])
      assert_not result[:success]
      assert_equal "Platform is required", result[:error]

      # Invalid platform
      result = service.split_post(@short_content, "nonexistent_platform", [ "semantic" ])
      assert_not result[:success]
      assert_equal "Invalid platform", result[:error]

      # Simulated API error
      result = service.split_post("TRIGGER_ERROR in this content", @platform.name, [ "semantic" ])
      assert_not result[:success]
      assert_equal "Simulated API error", result[:error]
    end
  end

  test "mock optimize_post returns optimized content" do
    mock_openai_service do
      service = OpenaiService.new
      result = service.optimize_post(@short_content, @platform.name)

      # Assert success
      assert result[:success]

      # Should return optimized content
      assert result[:optimized_content].present?

      # Optimized content should be within character limit
      assert result[:optimized_content].length <= @platform.character_limit

      # Should include reasoning
      assert result[:reasoning].present?
    end
  end

  test "mock optimize_post truncates long content" do
    mock_openai_service do
      service = OpenaiService.new
      result = service.optimize_post(@long_content, @platform.name)

      # Assert success
      assert result[:success]

      # Should return truncated content
      assert result[:optimized_content].present?
      assert result[:optimized_content].length <= @platform.character_limit

      # Should end with ellipsis if truncated
      assert_match(/\.\.\.\z/, result[:optimized_content]) if @long_content.length > @platform.character_limit

      # Should include reasoning
      assert result[:reasoning].present?
    end
  end

  test "mock optimize_post handles error cases" do
    mock_openai_service do
      service = OpenaiService.new

      # Missing content
      result = service.optimize_post("", @platform.name)
      assert_not result[:success]
      assert_equal "Content is required", result[:error]

      # Missing platform
      result = service.optimize_post(@short_content, "")
      assert_not result[:success]
      assert_equal "Platform is required", result[:error]

      # Invalid platform
      result = service.optimize_post(@short_content, "nonexistent_platform")
      assert_not result[:success]
      assert_equal "Invalid platform", result[:error]

      # Simulated API error
      result = service.optimize_post("TRIGGER_ERROR in this content", @platform.name)
      assert_not result[:success]
      assert_equal "Simulated API error", result[:error]
    end
  end
end
