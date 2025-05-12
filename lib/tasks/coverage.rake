namespace :test do
  desc "Run tests and generate a coverage report"
  task :coverage do
    ENV["COVERAGE"] = "true"
    Rake::Task["test"].invoke
    puts "\nGenerating test coverage report..."
    # Open the coverage report in the default browser if possible
    if RbConfig::CONFIG["host_os"] =~ /darwin|mac os/
      system("open coverage/index.html")
    elsif RbConfig::CONFIG["host_os"] =~ /linux|bsd/
      system("xdg-open coverage/index.html")
    elsif RbConfig::CONFIG["host_os"] =~ /mswin|mingw|cygwin/
      system("start coverage/index.html")
    else
      puts "Coverage report generated at coverage/index.html"
    end
  end
end
