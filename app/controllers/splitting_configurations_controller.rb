class SplittingConfigurationsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_config, only: [ :show, :edit, :update, :destroy ]

  def index
    @configs = current_user.splitting_configurations.order(created_at: :desc)
  end

  def show
  end

  def new
    @config = current_user.splitting_configurations.new
  end

  def create
    @config = current_user.splitting_configurations.new(config_params)

    if @config.save
      redirect_to splitting_configurations_path, notice: "Configuration was successfully saved."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @config.update(config_params)
      redirect_to splitting_configurations_path, notice: "Configuration was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @config.destroy
    redirect_to splitting_configurations_path, notice: "Configuration was successfully deleted."
  end

  private

  def set_config
    @config = current_user.splitting_configurations.find(params[:id])
  end

  def config_params
    # Handle the strategies array
    params_to_process = params.require(:config).permit(:name, strategies: [])

    # If the strategies array is present, convert it to JSON
    if params_to_process[:strategies].present?
      params_to_process[:strategies] = params_to_process[:strategies].reject(&:blank?)
    else
      # Default to semantic splitting if none selected
      params_to_process[:strategies] = [ "semantic" ]
    end

    params_to_process
  end
end
