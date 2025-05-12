class MediaFile < ApplicationRecord
  belongs_to :uploadable, polymorphic: true, optional: true
  belongs_to :created_by, class_name: 'User', optional: true

  validates :name, presence: true
  validates :file_type, presence: true
  validates :size, presence: true, numericality: { greater_than: 0 }
  validates :url, presence: true

  def image?
    file_type.to_s.start_with?('image/')
  end

  def video?
    file_type.to_s.start_with?('video/')
  end

  def audio?
    file_type.to_s.start_with?('audio/')
  end

  def file_extension
    File.extname(name).downcase
  end

  def humanized_size
    ActiveSupport::NumberHelper.number_to_human_size(size)
  end
end