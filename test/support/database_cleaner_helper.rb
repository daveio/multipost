module DatabaseCleanerHelper
  # Initialize DatabaseCleaner
  def self.setup
    # Configure DatabaseCleaner to use the correct strategy for each connection
    
    # ActiveRecord strategy
    DatabaseCleaner[:active_record].strategy = :transaction
    
    # Redis strategy (if using)
    if Object.const_defined?('Redis')
      DatabaseCleaner[:redis].strategy = :truncation
      DatabaseCleaner[:redis].url = ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
    end
    
    # Disable cache temporarily
    Rails.cache.disable if Rails.cache.respond_to?(:disable)
  end
  
  # Start DatabaseCleaner
  def self.start
    DatabaseCleaner.start
  end
  
  # Clean with DatabaseCleaner
  def self.clean
    DatabaseCleaner.clean
    
    # Re-enable cache
    Rails.cache.enable if Rails.cache.respond_to?(:enable)
  end
  
  # Configure DatabaseCleaner for system tests
  def self.setup_system_tests
    # Use truncation for system tests
    DatabaseCleaner[:active_record].strategy = :truncation
    
    # Redis cleanup (if using)
    if Object.const_defined?('Redis')
      DatabaseCleaner[:redis].strategy = :truncation
    end
  end
  
  # Configure DatabaseCleaner for parallel testing
  def self.setup_parallel_tests
    # Use truncation with pre-loaded seeds for parallel tests
    DatabaseCleaner[:active_record].strategy = :truncation, 
                                               { pre_count: true, 
                                                 reset_ids: true }
    
    # Redis cleanup (if using)
    if Object.const_defined?('Redis')
      DatabaseCleaner[:redis].strategy = :truncation
    end
  end
  
  # Configure DatabaseCleaner to use deletion for specific tests
  def self.use_deletion
    original_strategy = DatabaseCleaner[:active_record].strategy
    DatabaseCleaner[:active_record].strategy = :deletion
    yield
    DatabaseCleaner[:active_record].strategy = original_strategy
  end
end