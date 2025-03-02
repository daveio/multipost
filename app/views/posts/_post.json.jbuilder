json.extract! post, :id, :text, :mastodon, :bluesky, :threads, :x, :facebook, :tumblr, :dreamwidth, :pillowfort, :ready, :created_at, :updated_at
json.url post_url(post, format: :json)
