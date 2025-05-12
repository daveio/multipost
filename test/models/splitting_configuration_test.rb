require "test_helper"

class SplittingConfigurationTest < ActiveSupport::TestCase
  test "configuration validity" do
    config = SplittingConfiguration.new(
      user: users(:john),
      name: "Test Configuration",
      strategies: ['semantic', 'retain_hashtags'].to_json
    )
    assert config.valid?
  end

  test "configuration requires name" do
    config = SplittingConfiguration.new(
      user: users(:john),
      strategies: ['semantic'].to_json
    )
    assert_not config.valid?
    assert_includes config.errors[:name], "can't be blank"
  end

  test "configuration requires strategies" do
    config = SplittingConfiguration.new(
      user: users(:john),
      name: "Test Configuration"
    )
    assert_not config.valid?
    assert_includes config.errors[:strategies], "can't be blank"
  end

  test "configuration requires user" do
    config = SplittingConfiguration.new(
      name: "Test Configuration",
      strategies: ['semantic'].to_json
    )
    assert_not config.valid?
    assert_includes config.errors[:user], "must exist"
  end

  test "configuration belongs to user" do
    config = splitting_configurations(:john_semantic_config)
    assert_equal users(:john), config.user
  end

  test "STRATEGIES constant contains correct values" do
    assert_equal 'semantic', SplittingConfiguration::STRATEGIES[:semantic]
    assert_equal 'sentence', SplittingConfiguration::STRATEGIES[:sentence]
    assert_equal 'retain_hashtags', SplittingConfiguration::STRATEGIES[:retain_hashtags]
    assert_equal 'preserve_mentions', SplittingConfiguration::STRATEGIES[:preserve_mentions]
  end

  test "strategy_names returns empty array when strategies is empty" do
    config = SplittingConfiguration.new(strategies: [].to_json)
    assert_empty config.strategy_names
  end

  test "strategy_names returns human-readable strategy names" do
    config = splitting_configurations(:john_complex_config)
    strategy_names = config.strategy_names

    assert_equal 3, strategy_names.size
    assert_includes strategy_names, "Semantic splitting"
    assert_includes strategy_names, "Hashtag retention"
    assert_includes strategy_names, "Mention preservation"
  end

  test "strategy_names handles unknown strategy types" do
    config = SplittingConfiguration.new(
      user: users(:john),
      name: "Custom Config",
      strategies: ['custom_strategy'].to_json
    )

    assert_equal ["Custom strategy"], config.strategy_names
  end

  test "serializes strategies as JSON" do
    config = splitting_configurations(:john_complex_config)
    strategies = config.strategies

    assert_instance_of Array, strategies
    assert_equal 3, strategies.size
    assert_includes strategies, 'semantic'
    assert_includes strategies, 'retain_hashtags'
    assert_includes strategies, 'preserve_mentions'
  end
end
