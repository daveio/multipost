class Post < ApplicationRecord
  belongs_to :user
  belongs_to :thread_parent, class_name: 'Post', optional: true
  has_many :thread_children, class_name: 'Post', foreign_key: 'thread_parent_id', dependent: :nullify
  has_many :media_files, as: :uploadable, dependent: :destroy

  validates :content, presence: true

  serialize :platform_selections, coder: JSON

  scope :root_posts, -> { where(thread_parent_id: nil) }
  scope :published, -> { where(status: 'published') }
  scope :pending, -> { where(status: 'pending') }
  scope :failed, -> { where(status: 'failed') }

  def thread?
    thread_parent_id.present? || thread_children.exists?
  end

  def thread_position
    thread? ? "#{thread_index + 1}/#{thread_size}" : nil
  end

  def thread_size
    if thread_parent_id.present?
      thread_parent.thread_children.count + 1
    else
      thread_children.count + 1
    end
  end

  def thread_root
    thread_parent_id.present? ? thread_parent : self
  end

  def selected_platforms
    return [] unless platform_selections.present?
    platform_selections.select { |p| p['isSelected'] }.map { |p| p['id'] }
  end
end
