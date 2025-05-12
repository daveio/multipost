class ImageProcessor
  require 'fileutils'

  # Process an uploaded image, creating a preview version
  # @param uploaded_file [ActionDispatch::Http::UploadedFile] The uploaded file
  # @return [Hash] The paths to the original and preview files
  def self.process(uploaded_file)
    # Generate a unique filename
    extension = File.extname(uploaded_file.original_filename).downcase
    filename = "#{SecureRandom.uuid}#{extension}"
    relative_dir = File.join('uploads')

    # Create paths
    upload_dir = Rails.root.join('public', relative_dir)
    original_path = File.join(upload_dir, filename)
    preview_path = File.join(upload_dir, "preview_#{filename}")

    # Ensure directory exists
    FileUtils.mkdir_p(upload_dir) unless File.directory?(upload_dir)

    # Save the original file
    File.open(original_path, 'wb') do |file|
      file.write(uploaded_file.read)
    end

    # Create URL paths
    original_url = "/#{relative_dir}/#{filename}"
    preview_url = nil

    # Check if it's an image
    if uploaded_file.content_type.start_with?('image/')
      # Create a preview version
      create_preview(original_path, preview_path)
      preview_url = "/#{relative_dir}/preview_#{filename}"
    end

    {
      original_url: original_url,
      preview_url: preview_url,
      original_path: original_path,
      preview_path: preview_url ? preview_path : nil
    }
  end

  # Resize an image for a specific platform
  # @param media_file [MediaFile] The media file to resize
  # @param max_dimension [Integer] The maximum width or height (optional)
  # @param max_filesize [Integer] The maximum file size in bytes (optional)
  # @return [MediaFile] The processed media file (may be the same file if no processing was needed)
  def self.resize(media_file, max_dimension: nil, max_filesize: nil)
    return media_file unless media_file.file_type.start_with?('image/')

    # Get the file path from the URL
    file_path = Rails.root.join('public', media_file.url.sub(/^\//, ''))
    return media_file unless File.exist?(file_path)

    # Generate a unique filename for the processed version
    extension = File.extname(file_path)
    filename = "#{File.basename(file_path, extension)}_processed#{extension}"
    processed_path = File.join(File.dirname(file_path), filename)

    # Check if we need to resize
    needs_resize = false

    # Check dimensions if max_dimension is specified
    if max_dimension
      # In a real implementation, use ImageMagick/libvips to check dimensions
      # For this example, we'll assume we need to resize
      needs_resize = true
    end

    # Check file size if max_filesize is specified
    if max_filesize && File.size(file_path) > max_filesize
      needs_resize = true
    end

    if needs_resize
      # Process the image
      process_image(file_path, processed_path, max_dimension, max_filesize)

      # Update the media file's URL and return it
      processed_url = "/#{media_file.url.sub(/^\//, '').split('/')[0...-1].join('/')}/#{filename}"
      media_file.url = processed_url
      media_file.save
    end

    media_file
  end

  # Delete a file and its preview
  # @param url [String] The URL path of the file to delete
  # @return [Boolean] True if the file was successfully deleted
  def self.delete(url)
    return false unless url.present?

    # Convert URL to file path
    file_path = Rails.root.join('public', url.sub(/^\//, ''))

    # Check if it's a preview or processed
    is_preview = File.basename(url).start_with?('preview_')
    is_processed = File.basename(url).include?('_processed')

    # Calculate related paths
    base_name = File.basename(file_path)
    dir_name = File.dirname(file_path)

    if is_preview || is_processed
      # If this is a preview or processed version, clean up the original
      original_name = base_name.sub('preview_', '').sub('_processed', '')
      original_path = File.join(dir_name, original_name)

      # Delete the original if it exists
      File.delete(original_path) if File.exist?(original_path)
    else
      # This is an original file, clean up any preview or processed versions
      preview_name = "preview_#{base_name}"
      preview_path = File.join(dir_name, preview_name)

      # Get the name without extension for finding processed versions
      name_without_ext = File.basename(base_name, File.extname(base_name))
      processed_glob = File.join(dir_name, "#{name_without_ext}_processed*")

      # Delete preview if it exists
      File.delete(preview_path) if File.exist?(preview_path)

      # Delete any processed versions
      Dir.glob(processed_glob).each do |processed_file|
        File.delete(processed_file)
      end
    end

    # Delete the file itself
    deleted = false
    if File.exist?(file_path)
      File.delete(file_path)
      deleted = true
    end

    deleted
  end

  private

  # Create a preview version of the image
  # @param original_path [String] Path to the original image
  # @param preview_path [String] Path where the preview should be saved
  def self.create_preview(original_path, preview_path)
    # In a real implementation, you would use ImageMagick or similar
    # For now, we'll create a simple copy as a placeholder
    FileUtils.cp(original_path, preview_path)

    # In a real implementation, the code would look like:
    # `convert #{original_path} -resize 300x300^ -gravity center -extent 300x300 #{preview_path}`
  end

  # Process an image to meet dimension and file size requirements
  # @param input_path [String] Path to the input image
  # @param output_path [String] Path where the processed image should be saved
  # @param max_dimension [Integer] Maximum width or height
  # @param max_filesize [Integer] Maximum file size in bytes
  def self.process_image(input_path, output_path, max_dimension, max_filesize)
    # In a real implementation, you would use ImageMagick or similar
    # For now, we'll create a simple copy as a placeholder
    FileUtils.cp(input_path, output_path)

    # In a real implementation, the code would look like:
    # if max_dimension
    #   `convert #{input_path} -resize #{max_dimension}x#{max_dimension}> #{output_path}`
    # else
    #   FileUtils.cp(input_path, output_path)
    # end

    # If max_filesize is specified, we'd need to compress further if needed
    # if max_filesize && File.size(output_path) > max_filesize
    #   quality = 95
    #   while File.size(output_path) > max_filesize && quality > 60
    #     quality -= 5
    #     `convert #{input_path} -resize #{max_dimension}x#{max_dimension}> -quality #{quality} #{output_path}`
    #   end
    # end
  end
end