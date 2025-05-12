module SharedExamplesHelper
  # Mini-DSL for shared examples
  #
  # Example:
  #   shared_examples_for "a paginated collection" do |model_class|
  #     test "has pagination links" do
  #       # test logic
  #     end
  #   end
  #
  #   include_examples "a paginated collection", Post

  def self.included(base)
    base.extend(ClassMethods)

    # Initialize shared examples registry
    @@shared_examples = {}
  end

  # Class methods to be extended onto the test class
  module ClassMethods
    # Define shared examples
    # @param name [String] name of the shared example
    # @param &block [Block] block containing shared tests
    def shared_examples_for(name, &block)
      @@shared_examples[name.to_s] = block
    end

    # Include shared examples in the current context
    # @param name [String] name of the shared example to include
    # @param args [Array] arguments to pass to the shared example block
    def include_examples(name, *args)
      block = @@shared_examples[name.to_s]
      raise "Shared example '#{name}' not found" unless block

      # Create a unique name for this inclusion
      unique_suffix = "#{self.name}_#{name}".gsub(/[^a-z0-9]/i, "_").downcase

      # Create a module with the shared examples
      shared_module = Module.new
      shared_module.define_singleton_method(:included) do |base|
        base.class_eval do
          # Execute the shared example block with arguments
          instance_exec(*args, &block)

          # Rename test methods to avoid conflicts
          public_instance_methods.select { |m| m.to_s.start_with?("test_") }.each do |method_name|
            alias_method "#{method_name}_#{unique_suffix}", method_name
            undef_method method_name
          end
        end
      end

      # Include the module in the current class
      include shared_module
    end
  end
end
