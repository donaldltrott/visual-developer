module.exports = function (grunt) {
    grunt.config('connect', {
        options: {
            hostname: 'localhost',
            protocol: 'http'
        },
        styleguide: {
            options: {
                port: 3000,
                open: true,
                livereload: true,
                base: ['.']
            }
        }
    });
};
