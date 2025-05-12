module ApiTestHelper
  # Get an authentication token for a user
  # @param user [User] the user to authenticate
  # @param password [String] the user's password
  # @return [String] the authentication token
  def get_auth_token(user, password = "password123")
    post "/users/sign_in.json", params: {
      user: {
        email: user.email,
        password: password
      }
    }

    response.headers["Authorization"]
  end

  # Make a GET request to an API endpoint
  # @param endpoint [String] the API endpoint
  # @param token [String] the authentication token
  # @param params [Hash] optional query parameters
  # @return [Hash] the JSON response
  def api_get(endpoint, token, params = {})
    get endpoint, params: params, headers: {
      "Authorization" => token,
      "Accept" => "application/json"
    }

    JSON.parse(response.body) if response.body.present? && response.content_type.include?("application/json")
  end

  # Make a POST request to an API endpoint
  # @param endpoint [String] the API endpoint
  # @param token [String] the authentication token
  # @param params [Hash] the request parameters
  # @return [Hash] the JSON response
  def api_post(endpoint, token, params = {})
    post endpoint, params: params, headers: {
      "Authorization" => token,
      "Accept" => "application/json"
    }

    JSON.parse(response.body) if response.body.present? && response.content_type.include?("application/json")
  end

  # Make a PATCH request to an API endpoint
  # @param endpoint [String] the API endpoint
  # @param token [String] the authentication token
  # @param params [Hash] the request parameters
  # @return [Hash] the JSON response
  def api_patch(endpoint, token, params = {})
    patch endpoint, params: params, headers: {
      "Authorization" => token,
      "Accept" => "application/json"
    }

    JSON.parse(response.body) if response.body.present? && response.content_type.include?("application/json")
  end

  # Make a DELETE request to an API endpoint
  # @param endpoint [String] the API endpoint
  # @param token [String] the authentication token
  # @return [Hash] the JSON response
  def api_delete(endpoint, token)
    delete endpoint, headers: {
      "Authorization" => token,
      "Accept" => "application/json"
    }

    JSON.parse(response.body) if response.body.present? && response.content_type.include?("application/json")
  end

  # Assert that an API response contains the expected keys
  # @param response [Hash] the JSON response
  # @param keys [Array<String>] the expected keys
  def assert_api_response_has_keys(response, keys)
    keys.each do |key|
      assert_includes response.keys, key, "Response is missing expected key: #{key}"
    end
  end

  # Assert that an API response matches the expected attributes
  # @param response [Hash] the JSON response
  # @param attributes [Hash] the expected attributes
  def assert_api_response_matches(response, attributes)
    attributes.each do |key, value|
      assert_equal value, response[key.to_s], "Response attribute #{key} does not match expected value"
    end
  end

  # Assert that an API response contains validation errors
  # @param response [Hash] the JSON response
  # @param fields [Array<String>] the fields expected to have errors
  def assert_api_has_validation_errors(response, fields)
    assert_includes response.keys, "errors", "Response does not contain errors key"

    fields.each do |field|
      assert_includes response["errors"].keys, field, "Response is missing validation error for field: #{field}"
    end
  end

  # Assert that an API endpoint is protected
  # @param endpoint [String] the API endpoint
  # @param method [Symbol] the HTTP method (:get, :post, :patch, :delete)
  # @param params [Hash] optional request parameters
  def assert_api_requires_authentication(endpoint, method = :get, params = {})
    case method
    when :get
      get endpoint, params: params, headers: { "Accept" => "application/json" }
    when :post
      post endpoint, params: params, headers: { "Accept" => "application/json" }
    when :patch
      patch endpoint, params: params, headers: { "Accept" => "application/json" }
    when :delete
      delete endpoint, headers: { "Accept" => "application/json" }
    end

    assert_response :unauthorized, "API endpoint #{method.to_s.upcase} #{endpoint} is not protected"
  end

  # Assert that an API endpoint enforces authorization
  # @param endpoint [String] the API endpoint
  # @param token [String] a valid token for a non-authorized user
  # @param method [Symbol] the HTTP method (:get, :post, :patch, :delete)
  # @param params [Hash] optional request parameters
  def assert_api_enforces_authorization(endpoint, token, method = :get, params = {})
    case method
    when :get
      get endpoint, params: params, headers: {
        "Authorization" => token,
        "Accept" => "application/json"
      }
    when :post
      post endpoint, params: params, headers: {
        "Authorization" => token,
        "Accept" => "application/json"
      }
    when :patch
      patch endpoint, params: params, headers: {
        "Authorization" => token,
        "Accept" => "application/json"
      }
    when :delete
      delete endpoint, headers: {
        "Authorization" => token,
        "Accept" => "application/json"
      }
    end

    assert_response :forbidden, "API endpoint #{method.to_s.upcase} #{endpoint} does not enforce authorization"
  end
end
