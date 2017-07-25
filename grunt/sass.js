module.exports = function (grunt) {
    grunt.config('sass', {
        options: {
            sourceMap: false
        },
        dist: {
            files: {
                'css/visual-developer.css': 'sass/visual-developer.sass'
            }
        }
    });
};
