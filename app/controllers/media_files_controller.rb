class MediaFilesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_media_file, only: [ :destroy ]

  def create
    # Check file presence
    unless params[:file].present?
      return render json: { success: false, errors: [ "File is required" ] }, status: :bad_request
    end

    # Process the uploaded file
    file_data = ImageProcessor.process(params[:file])

    # Create the media file record
    @media_file = MediaFile.new(
      name: params[:file].original_filename,
      file_type: params[:file].content_type,
      size: params[:file].size,
      url: file_data[:original_url],
      preview_url: file_data[:preview_url],
      created_by: current_user
    )

    # Associate with draft or post if specified
    if params[:draft_id].present?
      draft = current_user.drafts.find_by(id: params[:draft_id])
      @media_file.uploadable = draft if draft
    elsif params[:post_id].present?
      post = current_user.posts.find_by(id: params[:post_id])
      @media_file.uploadable = post if post
    end

    if @media_file.save
      render json: {
        success: true,
        media_file: {
          id: @media_file.id,
          name: @media_file.name,
          url: @media_file.url,
          preview_url: @media_file.preview_url,
          file_type: @media_file.file_type,
          size: @media_file.size,
          humanized_size: @media_file.humanized_size
        }
      }
    else
      # Delete uploaded files if record creation fails
      ImageProcessor.delete(file_data[:original_url]) if file_data[:original_url].present?

      render json: { success: false, errors: @media_file.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Ensure the file belongs to the current user
    if can_manage_media_file?
      # Delete the actual files
      ImageProcessor.delete(@media_file.url) if @media_file.url.present?

      # Remove the database record
      @media_file.destroy
      render json: { success: true }
    else
      render json: { success: false, error: "Not authorized" }, status: :unauthorized
    end
  end

  private

  def set_media_file
    @media_file = MediaFile.find(params[:id])
  end

  # Check if current user can manage this media file
  def can_manage_media_file?
    return false unless @media_file

    if @media_file.uploadable.nil?
      # Orphaned media file, check if it was previously owned by this user
      return true if @media_file.created_by_id == current_user.id
    else
      # Media file associated with an object
      case @media_file.uploadable
      when Draft
        return @media_file.uploadable.user_id == current_user.id
      when Post
        return @media_file.uploadable.user_id == current_user.id
      end
    end

    false
  end
end
