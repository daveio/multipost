class Draft < ApplicationRecord
  belongs_to :user
  has_many :media_files, as: :uploadable, dependent: :destroy

  validates :content, presence: true

  serialize :platform_selections, coder: JSON

  def selected_platforms
    return [] unless platform_selections.present?
    platform_selections.select { |p| p['isSelected'] }.map { |p| p['id'] }
  end

  def to_post
    post = user.posts.new(
      content: content,
      platform_selections: platform_selections
    )

    # Copy media files to the post
    media_files.each do |media|
      post.media_files.build(
        name: media.name,
        file_type: media.file_type,
        size: media.size,
        url: media.url,
        preview_url: media.preview_url
      )
    end

    post
  end
end
