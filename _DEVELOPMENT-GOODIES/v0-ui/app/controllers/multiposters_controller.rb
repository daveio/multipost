class MultipostersController < ApplicationController
  def new
    # This action will render the form
  end

  def create
    # This action will handle the form submission
    # For now, we'll just redirect back to the form
    redirect_to new_multiposter_path, notice: "Your post has been submitted (not really, this is just a demo)."
  end
end
