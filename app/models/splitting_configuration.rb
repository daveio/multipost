class SplittingConfiguration < ApplicationRecord
  belongs_to :user

  validates :name, presence: true
  validates :strategies, presence: true

  serialize :strategies, coder: JSON

  # Strategy types
  STRATEGIES = {
    semantic: "semantic",
    sentence: "sentence",
    retain_hashtags: "retain_hashtags",
    preserve_mentions: "preserve_mentions"
  }.freeze

  def strategy_names
    return [] unless strategies.present?
    strategies.map do |strategy|
      case strategy
      when STRATEGIES[:semantic] then "Semantic splitting"
      when STRATEGIES[:sentence] then "Sentence-based splitting"
      when STRATEGIES[:retain_hashtags] then "Hashtag retention"
      when STRATEGIES[:preserve_mentions] then "Mention preservation"
      else strategy.to_s.humanize
      end
    end
  end
end
