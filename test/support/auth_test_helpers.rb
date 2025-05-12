module AuthTestHelpers
  # Helper for signing in a user in controller and integration tests
  # @param user [User] the user to sign in
  def sign_in_user(user = users(:john))
    # For controller tests (Devise Test Helpers)
    if respond_to?(:sign_in)
      sign_in user
    # For integration tests (manual sign-in)
    else
      post user_session_path, params: {
        user: {
          email: user.email,
          password: "password123"
        }
      }
      follow_redirect! if response.redirect?
    end
  end

  # Helper for signing out a user in controller and integration tests
  def sign_out_user
    # For controller tests (Devise Test Helpers)
    if respond_to?(:sign_out)
      sign_out :user
    # For integration tests (manual sign-out)
    else
      delete destroy_user_session_path
      follow_redirect! if response.redirect?
    end
  end

  # Helper that asserts that a user is signed in
  def assert_user_signed_in
    if @controller
      # Controller tests
      assert session[:user_id].present? || controller.current_user.present?,
        "Expected user to be signed in, but no user was found in the session or current_user"
    else
      # Integration tests - check for redirect to login
      get root_path
      assert_response :success,
        "Expected to access a protected page, but was redirected to #{response.redirect_url}"
    end
  end

  # Helper that asserts that a user is signed out
  def assert_user_signed_out
    if @controller
      # Controller tests
      assert_nil session[:user_id], "Expected user to be signed out, but user_id found in session"
      assert_nil controller.current_user, "Expected current_user to be nil, but it was present"
    else
      # Integration tests - check for redirect to login
      get root_path
      assert_redirected_to new_user_session_path,
        "Expected to be redirected to login page, but was not redirected"
    end
  end

  # Helper to create a user with given attributes
  # @param attributes [Hash] attributes for the new user
  # @return [User] the created user
  def create_user(attributes = {})
    default_attributes = {
      email: "user_#{Time.now.to_i}@example.com",
      password: "password123",
      password_confirmation: "password123"
    }

    User.create!(default_attributes.merge(attributes))
  end

  # Helper that performs user registration
  # @param attributes [Hash] attributes for the new user
  # @return [User] the created user
  def register_user(attributes = {})
    default_attributes = {
      email: "user_#{Time.now.to_i}@example.com",
      password: "password123",
      password_confirmation: "password123"
    }

    user_attributes = default_attributes.merge(attributes)

    post user_registration_path, params: { user: user_attributes }

    User.find_by(email: user_attributes[:email])
  end
end
