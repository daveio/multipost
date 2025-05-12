class CreateAccounts < ActiveRecord::Migration[8.0]
  def change
    create_table :accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :platform_id
      t.string :username
      t.string :display_name
      t.string :avatar_url
      t.string :instance_url
      t.string :access_token
      t.string :refresh_token
      t.datetime :expires_at
      t.boolean :is_active

      t.timestamps
    end
  end
end
