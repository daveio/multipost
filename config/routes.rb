Rails.application.routes.draw do
  get "pages/index"
  get "pages/home"
  get "pages/about"
  get "pages/terms"
  get "pages/privacy"
  get "pages/team"
  get "pages/contact"
  get "pages/faq"
  get "pages/pricing"
  get "pages/features"
  get "pages/news"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "pages#home"
end
