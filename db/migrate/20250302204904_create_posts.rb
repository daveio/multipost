class CreatePosts < ActiveRecord::Migration[8.0]
  def change
    create_table :posts do |t|
      t.text :text
      t.text :mastodon
      t.text :bluesky
      t.text :threads
      t.text :x
      t.text :facebook
      t.text :tumblr
      t.text :dreamwidth
      t.text :pillowfort
      t.boolean :ready

      t.timestamps
    end
  end
end
