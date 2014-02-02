require 'pathname'

# Require any additional compass plugins here.
# Set this to the root of your project when deployed:

http_path = "/"
css_dir = "css"
sass_dir = "../src/scss"
images_dir = "i"
javascripts_dir = "js"
# To enable relative paths to assets via compass helper functions. Uncomment:
relative_assets = true
project_path = "static"

if environment != :production
    sass_options = {:debug_info => true}
end