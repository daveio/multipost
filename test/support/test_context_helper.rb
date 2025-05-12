module TestContextHelper
  # Mini-DSL for organizing tests in contexts
  # 
  # Example:
  #   context "when user is logged in" do
  #     setup do
  #       # context-specific setup
  #     end
  #     
  #     test "can view dashboard" do
  #       # test case
  #     end
  #     
  #     context "with admin role" do
  #       # nested context
  #     end
  #   end
  
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    # Define a test context
    # @param name [String] name of the context
    # @param &block [Block] block containing tests and nested contexts
    def context(name, &block)
      context_class = Class.new(self) do
        # Capture parent setup/teardown methods
        parent_setup_callbacks = setup_callbacks.dup
        parent_teardown_callbacks = teardown_callbacks.dup
        
        # Reset callbacks for this context
        self._setup_callbacks = ActiveSupport::Callbacks::CallbackChain.new
        self._teardown_callbacks = ActiveSupport::Callbacks::CallbackChain.new
        
        # Re-add parent callbacks
        parent_setup_callbacks.each do |callback|
          setup(callback.filter)
        end
        
        parent_teardown_callbacks.each do |callback|
          teardown(callback.filter)
        end
        
        # Set the context name
        @context_name = name
      end
      
      # Create class variable to track test counter
      context_class.class_variable_set(:@@test_counter, 0)
      
      # Execute the block in the context of the new class
      context_class.class_eval(&block)
      
      # Define test methods on the original class with the context name prefixed
      context_class.test_methods.each do |method_name|
        test_name = method_name.sub(/^test_/, '')
        full_test_name = "#{name} #{test_name}"
        
        # Get method object from context class
        method_object = context_class.instance_method(method_name)
        
        # Define the method on the original class
        define_method("test_#{full_test_name.gsub(/[^a-z0-9]/i, '_').downcase}", ->(*args) do
          # Set up context-specific instance variables
          context_class._setup_callbacks.each { |callback| instance_eval(&callback.filter) }
          
          # Run the actual test
          method_object.bind(self).call(*args)
          
          # Run teardown callbacks
          context_class._teardown_callbacks.each { |callback| instance_eval(&callback.filter) }
        end)
      end
    end
    
    # Generate a unique method name for tests without explicit names
    # @return [String] a unique test method name
    def generate_test_name
      counter = class_variable_get(:@@test_counter)
      class_variable_set(:@@test_counter, counter + 1)
      "anonymousTest#{counter}"
    end
    
    # Define a named test in this context
    # @param name [String] name of the test
    # @param &block [Block] test implementation
    def test(name = nil, &block)
      name ||= generate_test_name
      method_name = "test_#{name.gsub(/[^a-z0-9]/i, '_').downcase}"
      define_method(method_name, &block)
    end
    
    # Track test methods defined on this class
    # @return [Array<String>] list of test method names
    def test_methods
      public_instance_methods.select { |m| m.to_s.start_with?('test_') }
    end
  end
end