class CreateSplittingConfigurations < ActiveRecord::Migration[8.0]
  def change
    create_table :splitting_configurations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.text :strategies

      t.timestamps
    end
  end
end
