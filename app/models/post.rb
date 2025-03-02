# trunk-ignore(brakeman/BRAKE0019)
class Post < ApplicationRecord
  # Mass assignment protection is implemented via Strong Parameters in PostsController
end
