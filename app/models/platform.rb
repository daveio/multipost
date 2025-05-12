class Platform < ApplicationRecord
  validates :name, presence: true, uniqueness: true
  validates :character_limit, presence: true, numericality: { greater_than: 0 }

  # Define default platform character limits
  PLATFORM_CHARACTER_LIMITS = {
    "bluesky" => 300,
    "mastodon" => 500,
    "threads" => 500,
    "nostr" => 5000
  }.freeze

  def self.default_platforms
    PLATFORM_CHARACTER_LIMITS.map do |platform_id, limit|
      find_or_create_by(name: platform_id) do |platform|
        platform.character_limit = limit
      end
    end
  end
end
