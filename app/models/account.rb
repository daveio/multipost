# frozen_string_literal: true

# trunk-ignore(brakeman/BRAKE0019)
class Account < ApplicationRecord
  include Rodauth::Rails.model
  enum :status, { unverified: 1, verified: 2, closed: 3 }
end
