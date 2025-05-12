class PlatformsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_platform, only: [ :show ]

  def index
    @platforms = Platform.all
  end

  def show
    @accounts = current_user.accounts.where(platform_id: @platform.name)
  end

  private

  def set_platform
    @platform = Platform.find(params[:id])
  end
end
