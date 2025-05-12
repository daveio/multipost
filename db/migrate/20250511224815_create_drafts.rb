class CreateDrafts < ActiveRecord::Migration[8.0]
  def change
    create_table :drafts do |t|
      t.references :user, null: false, foreign_key: true
      t.text :content
      t.text :platform_selections
      t.boolean :is_thread, default: false

      t.timestamps
    end
  end
end
