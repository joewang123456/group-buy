module.exports = function (grunt) {
  grunt.initConfig({
    less: {
      dev: {
        files: {
          'css/style.css': 'less/style.less',
        },
      },
    },
    browserSync: {
      bsFiles: {
        src: ['page/*.html', 'css/*.css', 'js/*.js'],
      },
      options: {
        watchTask: true,
        server: {
          baseDir: './',
          routes: {
            '/detail': 'page/detail.html',
            '/fail': 'page/fail.html',
            '/launch': 'page/launch.html',
            '/my-group': 'page/my-group.html',
            '/pay': 'page/pay.html',
            '/prelaunch': 'page/prelaunch.html'
          },
          index: 'page/detail.html',
        },
      },
    },
    watch: {
      css: {
        files: ['less/style.less'],
        tasks: ['less'],
      },
    },
  })
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-browser-sync')
  grunt.registerTask('default', ['browserSync', 'watch'])
}