class DraftsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_draft, only: [:show, :edit, :update, :destroy]
  before_action :set_platforms, only: [:new, :edit, :create, :update]

  def index
    @drafts = current_user.drafts.order(updated_at: :desc)
  end

  def show
  end

  def new
    @draft = current_user.drafts.new
  end

  def create
    @draft = current_user.drafts.new(draft_params)

    if @draft.save
      redirect_to drafts_path, notice: 'Draft was successfully saved.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @draft.update(draft_params)
      redirect_to drafts_path, notice: 'Draft was successfully updated.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @draft.destroy
    redirect_to drafts_path, notice: 'Draft was successfully deleted.'
  end

  private

  def set_draft
    @draft = current_user.drafts.find(params[:id])
  end

  def set_platforms
    @platforms = Platform.all
  end

  def draft_params
    params.require(:draft).permit(:content, :platform_selections, :is_thread)
  end
end
