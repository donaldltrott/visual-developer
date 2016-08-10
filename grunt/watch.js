module.exports = function (grunt) {
    grunt.config('watch', {
        options: {
            livereload: true
        },
        sass: {
            files: ['sass/**'],
            tasks: ['sass', 'postcss']
        }
    });
};
