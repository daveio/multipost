Rails.application.routes.draw do
  devise_for :users

  # Application routes
  resources :accounts
  resources :posts do
    collection do
      post :split
      post :optimize
    end
    member do
      post :retry
    end
  end
  resources :drafts
  resources :platforms, only: [ :index, :show ]
  resources :splitting_configurations

  # Media uploads
  resources :media_files, only: [ :create, :destroy ]
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "home#index"
end
