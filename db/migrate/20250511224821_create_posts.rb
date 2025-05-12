class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.references :user, null: false, foreign_key: true
      t.text :content
      t.string :status, default: 'pending'
      t.integer :thread_index, default: 0
      t.references :thread_parent, null: true, foreign_key: { to_table: :posts }
      t.text :platform_selections

      t.timestamps
    end
  end
end
