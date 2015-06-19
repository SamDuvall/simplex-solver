require 'mina/multistage'
require 'mina/git'
require 'mina/rvm'

set :application, "simplex"
set :deploy_to, "/var/www/simplex"
set :repository, 'git@github.com:SamDuvall/simplex-solver.git'
set :branch, 'master'

set :user, 'www'
set :forward_agent, true
set :rvm_path, '/usr/local/rvm/scripts/rvm'
set :shared_paths, ['config/config.yml', 'log', 'node_modules']

# Temporary Fix - https://github.com/mina-deploy/mina/issues/99
set :term_mode, :nil

task :environment do
  invoke :'rvm:use[2.1.5]'
end

task :setup => :environment do
  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/log"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/log"]

  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/config"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/config"]

  queue! %[mkdir -p "#{deploy_to}/#{shared_path}/pids/"]
  queue! %[chmod g+rx,u+rwx "#{deploy_to}/#{shared_path}/pids"]

  queue! %[touch "#{deploy_to}/#{shared_path}/config/config.yml"]
  queue %[echo "-----> Be sure to edit 'shared/config/config.yml'."]
end

desc "Deploys the current version to the server."
task :deploy => :environment do
  deploy do
    invoke :'git:clone'
    invoke :'deploy:link_shared_paths'
    invoke :'npm:install'
    invoke :'assets:compile'
    invoke :'deploy:cleanup'

    to :launch do
      invoke :'restart'
    end
  end
end

namespace :npm do
  desc "Install Packages"
  task :install => :environment do
    queue %{
      echo "-----> Installing node packages using npm"
      #{echo_cmd %[mkdir -p "#{deploy_to}/#{shared_path}/node_modules"]}
      npm install
    }
  end
end

namespace :assets do
  desc "Compile the assets"
  task :compile => :environment do
    queue %{
      echo "-----> Compiling assets"
      #{echo_cmd %[NODE_ENV=#{stage} gulp build]}
    }
  end
end

task :start => :environment do
  queue! %[sudo service #{application} start]
end

task :restart => :environment do
  queue! %[sudo service #{application} restart]
end

task :stop => :environment do
  queue! %[sudo service #{application} stop]
end
