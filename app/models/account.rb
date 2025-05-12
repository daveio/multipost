class Account < ApplicationRecord
  belongs_to :user

  validates :platform_id, presence: true
  validates :username, presence: true
  validates :access_token, presence: true

  scope :active, -> { where(is_active: true) }

  def platform_name
    case platform_id
    when 'bluesky' then 'Bluesky'
    when 'mastodon' then 'Mastodon'
    when 'threads' then 'Threads'
    else platform_id.to_s.humanize
    end
  end
end
