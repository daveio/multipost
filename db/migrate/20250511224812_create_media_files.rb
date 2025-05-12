class CreateMediaFiles < ActiveRecord::Migration[8.0]
  def change
    create_table :media_files do |t|
      t.string :name
      t.string :file_type
      t.integer :size
      t.string :url
      t.string :preview_url
      t.references :uploadable, polymorphic: true, null: true

      t.timestamps
    end
  end
end
