namespace :test do
  desc "Run visual regression tests with Percy"
  task :visual do
    ENV["PERCY_ENABLED"] = "true"
    Rake::Task["test:system"].invoke
  end

  desc "Run visual regression tests locally and save screenshots"
  task :visual_local do
    ENV["PERCY_ENABLED"] = "false"
    Rake::Task["test:system"].invoke

    puts "\nLocal screenshots saved to: #{Rails.root.join('tmp', 'screenshots')}"
  end
end
