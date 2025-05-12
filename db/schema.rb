# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_05_11_224826) do
  create_table "accounts", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "platform_id"
    t.string "username"
    t.string "display_name"
    t.string "avatar_url"
    t.string "instance_url"
    t.string "access_token"
    t.string "refresh_token"
    t.datetime "expires_at"
    t.boolean "is_active"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_accounts_on_user_id"
  end

  create_table "drafts", force: :cascade do |t|
    t.integer "user_id", null: false
    t.text "content"
    t.text "platform_selections"
    t.boolean "is_thread", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_drafts_on_user_id"
  end

  create_table "media_files", force: :cascade do |t|
    t.string "name"
    t.string "file_type"
    t.integer "size"
    t.string "url"
    t.string "preview_url"
    t.string "uploadable_type"
    t.integer "uploadable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["uploadable_type", "uploadable_id"], name: "index_media_files_on_uploadable"
  end

  create_table "platforms", force: :cascade do |t|
    t.string "name"
    t.integer "character_limit"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "posts", force: :cascade do |t|
    t.integer "user_id", null: false
    t.text "content"
    t.string "status", default: "pending"
    t.integer "thread_index", default: 0
    t.integer "thread_parent_id"
    t.text "platform_selections"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["thread_parent_id"], name: "index_posts_on_thread_parent_id"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "splitting_configurations", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "name"
    t.text "strategies"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_splitting_configurations_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "accounts", "users"
  add_foreign_key "drafts", "users"
  add_foreign_key "posts", "posts", column: "thread_parent_id"
  add_foreign_key "posts", "users"
  add_foreign_key "splitting_configurations", "users"
end
