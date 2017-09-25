module.exports = function(grunt) {
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
