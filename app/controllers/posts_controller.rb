class PostsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_post, only: [ :show, :edit, :update, :destroy ]
  before_action :set_platforms, only: [ :new, :edit, :create, :update ]

  def index
    @posts = current_user.posts.root_posts.order(created_at: :desc)
  end

  def show
  end

  def new
    @post = current_user.posts.new
    @draft_id = params[:draft_id]

    if @draft_id.present?
      draft = current_user.drafts.find_by(id: @draft_id)
      if draft
        @post = draft.to_post
      end
    end
  end

  def create
    @post = current_user.posts.new(post_params)
    scheduled_at = params[:scheduled_at].present? ? Time.zone.parse(params[:scheduled_at]) : nil
    staggered = params[:staggered] == "1"
    stagger_interval = params[:stagger_interval].present? ? params[:stagger_interval].to_i : 30

    if @post.save
      # Delete draft if this post was created from a draft
      if params[:from_draft_id].present?
        draft = current_user.drafts.find_by(id: params[:from_draft_id])
        draft.destroy if draft.present?
      end

      # Use publishing service to publish the post
      if scheduled_at.present? && scheduled_at > Time.current
        scheduling_options = {
          staggered: staggered,
          stagger_interval: stagger_interval
        }

        if PublishingService.schedule_post(@post, scheduled_at, scheduling_options)
          message = "Post was scheduled for #{I18n.l(scheduled_at, format: :long)}."
          message += " Publishing will be staggered across platforms." if staggered
          redirect_to posts_path, notice: message
        else
          redirect_to posts_path, alert: "Failed to schedule post. Please try again."
        end
      else
        if PublishingService.publish_post(@post)
          redirect_to posts_path, notice: "Post is being published."
        else
          redirect_to posts_path, alert: "Failed to publish post. Please try again."
        end
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @post.update(post_params)
      redirect_to posts_path, notice: "Post was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @post.destroy
    redirect_to posts_path, notice: "Post was successfully deleted."
  end

  def split
    content = params[:content]
    platform_id = params[:platform_id]
    strategies = params[:strategies] || [ "semantic" ]

    if content.present? && platform_id.present?
      openai_service = OpenaiService.new
      result = openai_service.split_post(content, platform_id, strategies)

      if result[:success]
        render json: {
          success: true,
          splits: result[:splits],
          reasoning: result[:reasoning]
        }
      else
        render json: { success: false, error: result[:error] }, status: :unprocessable_entity
      end
    else
      render json: { success: false, error: "Missing required parameters" }, status: :bad_request
    end
  end

  def optimize
    content = params[:content]
    platform_id = params[:platform_id]

    if content.present? && platform_id.present?
      openai_service = OpenaiService.new
      result = openai_service.optimize_post(content, platform_id)

      if result[:success]
        render json: {
          success: true,
          optimized_content: result[:optimized_content],
          reasoning: result[:reasoning]
        }
      else
        render json: { success: false, error: result[:error] }, status: :unprocessable_entity
      end
    else
      render json: { success: false, error: "Missing required parameters" }, status: :bad_request
    end
  end

  def retry
    @post = current_user.posts.find(params[:id])

    if @post.status != "failed"
      redirect_to posts_path, alert: "Only failed posts can be retried."
      return
    end

    if PublishingService.retry_post(@post)
      redirect_to posts_path, notice: "Post is being republished."
    else
      redirect_to posts_path, alert: "Failed to retry post. Please try again."
    end
  end

  private

  def set_post
    @post = current_user.posts.find(params[:id])
  end

  def set_platforms
    @platforms = Platform.all
  end

  def post_params
    params.require(:post).permit(:content, :thread_parent_id, :thread_index, :platform_selections)
  end
end
