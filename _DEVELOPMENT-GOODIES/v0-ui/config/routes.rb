Rails.application.routes.draw do
  get '/multipost', to: 'multiposters#new', as: 'new_multiposter'
  post '/multipost', to: 'multiposters#create'
end
