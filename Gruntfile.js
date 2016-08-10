module.exports = function (grunt) {

    require('load-grunt-config')(grunt);
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});
    require('time-grunt')(grunt);

    var appConfig = {};

    grunt.initConfig({
        appConfig: appConfig,
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadTasks('grunt');

    grunt.registerTask('default', [
        'sass',
        'postcss',
        'connect',
        'watch'
    ])
};
