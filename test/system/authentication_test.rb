require "application_system_test_case"

class AuthenticationTest < ApplicationSystemTestCase
  test "visitor can sign up" do
    visit new_user_registration_path
    
    # Fill in registration form
    fill_in "Email", with: "newuser@example.com"
    fill_in "Password", with: "password123"
    fill_in "Password confirmation", with: "password123"
    
    # Submit form
    click_on "Sign up"
    
    # Verify success
    assert_text "Welcome! You have signed up successfully."
    assert_selector "h1", text: "Dashboard"
    
    # Verify we're logged in
    assert_text "newuser@example.com"
  end
  
  test "user can sign in" do
    user = users(:john)
    
    visit new_user_session_path
    
    fill_in "Email", with: user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
    
    assert_text "Signed in successfully."
    assert_selector "h1", text: "Dashboard"
  end
  
  test "user can sign out" do
    # First sign in
    user = users(:john)
    visit new_user_session_path
    fill_in "Email", with: user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
    assert_text "Signed in successfully."
    
    # Now sign out
    click_on "Sign out"
    
    # Verify we're signed out and redirected to login
    assert_text "Signed out successfully."
    assert_current_path new_user_session_path
  end
  
  test "user cannot sign in with incorrect password" do
    user = users(:john)
    
    visit new_user_session_path
    
    fill_in "Email", with: user.email
    fill_in "Password", with: "wrong_password"
    click_on "Log in"
    
    assert_text "Invalid Email or password."
    assert_current_path new_user_session_path
  end
  
  test "user can recover password" do
    user = users(:john)
    
    visit new_user_session_path
    click_on "Forgot your password?"
    
    assert_current_path new_user_password_path
    
    fill_in "Email", with: user.email
    click_on "Send me reset password instructions"
    
    assert_text "You will receive an email with instructions on how to reset your password"
  end
  
  test "unauthenticated user is redirected to login" do
    # Try to access protected path without logging in
    visit posts_path
    
    # Should be redirected to login
    assert_current_path new_user_session_path
    assert_text "You need to sign in or sign up before continuing."
  end
  
  test "user can update account information" do
    # First sign in
    user = users(:john)
    visit new_user_session_path
    fill_in "Email", with: user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
    
    # Navigate to edit account page
    visit edit_user_registration_path
    
    # Update information
    fill_in "Email", with: "john_updated@example.com"
    fill_in "Current password", with: "password123"
    click_on "Update"
    
    assert_text "Your account has been updated successfully."
  end
  
  test "user can delete account" do
    # First sign in
    user = users(:john)
    visit new_user_session_path
    fill_in "Email", with: user.email
    fill_in "Password", with: "password123"
    click_on "Log in"
    
    # Navigate to edit account page
    visit edit_user_registration_path
    
    # Delete account - using JS confirm
    accept_confirm do
      click_on "Cancel my account"
    end
    
    assert_text "Your account has been successfully cancelled."
    assert_current_path new_user_session_path
  end
end