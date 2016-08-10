module.exports = function (grunt) {
    grunt.config('sass', {
        options: {
            sourceMap: false
        },
        dist: {
            files: {
                'styleguide/css/visual-developer.css': 'sass/visual-developer.sass'
            }
        }
    });
};
