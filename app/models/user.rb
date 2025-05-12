class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :accounts, dependent: :destroy
  has_many :drafts, dependent: :destroy
  has_many :posts, dependent: :destroy
  has_many :splitting_configurations, dependent: :destroy

  def platform_accounts(platform_id)
    accounts.where(platform_id: platform_id, is_active: true)
  end
end
