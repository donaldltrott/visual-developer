module.exports = function (grunt) {
    grunt.config('postcss', {
        options: {
            map: false,
            processors: [
                require('autoprefixer')({
                    browsers: ['last 2 versions']
                })
            ]
        },
        dist: {
            src: 'styleguide/css/visual-developer.css'
        }
    });
};
