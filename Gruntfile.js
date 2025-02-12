/*global module:false*/
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON("package.json"),
    banner:
      "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    distdir: "static",
    newdist: "src/assets",
    tmpdir: "static/tmp",
    src: {
      less: ["less/skins/default.less"],
      docs_cwd: "src/app",
    },
    dest: {
      docs_js: "static/build/tmp_docs_js",
      less: "<%= distdir %>/stylesheets/app.css",
      fonts: "<%= distdir %>/fonts",
      images: "<%= newdist %>/images",
      staticImages: "<%= distdir %>/images",
    },
    less: {
      app: {
        files: {
          "<%= dest.less %>": "<%= src.less %>",
          "<%= distdir %>/stylesheets/loader.css": "less/loader.less",
          "<%= newdist %>/stylesheets/tiny_mce_custom.css":
            "less/tiny_mce_custom.less",
        },
      },
      auth: {
        files: {
          "static/stylesheets/login.css": "less/login_styles/login.less",
          "static/stylesheets/signup.css": "less/login_styles/signup.less",
          "static/stylesheets/password_reset.css":
            "less/login_styles/password_reset.less",
        },
      },
      tinymce: {
        options: {
          compress: true,
        },
        files: {
          "src/assets/stylesheets/tinymce/skins/tinymce-dv/content.min.css":
            "less/tinymce/content.less",
          "src/assets/stylesheets/tinymce/skins/tinymce-dv/skin.min.css":
            "less/tinymce/skin.less",
        },
      },
    },
    cssmin: {
      auth: {
        files: {
          "static/stylesheets/login.css": "static/stylesheets/login.css",
          "static/stylesheets/signup.css": "static/stylesheets/signup.css",
          "static/stylesheets/password_reset.css":
            "static/stylesheets/password_reset.css",
        },
      },
      app: {
        files: {
          "static/stylesheets/app.min.css": "static/stylesheets/app.css",
        },
      },
    },
    copy: {
      fonts: {
        expand: true,
        cwd: "less/icomoon/fonts",
        src: "**",
        dest: "<%= dest.fonts %>",
        filter: "isFile",
      },
      bootstrapFonts: {
        expand: true,
        cwd: "less/login_styles/fonts",
        src: "**",
        dest: "<%= dest.fonts %>",
        filter: "isFile",
      },
      images: {
        expand: true,
        cwd: "less/images",
        src: "**",
        dest: "<%= dest.images %>",
        filter: "isFile",
      },
      imagesStatic: {
        expand: true,
        cwd: "less/images",
        src: "**",
        dest: "<%= dest.staticImages %>",
        filter: "isFile",
      },
      pdfmakeminjs: {
        expand: true,
        cwd: 'bower_components/pdfmake/build',
        src: ['pdfmake.min.js', 'vfs_fonts.js'],
        dest: '<%= distdir %>/js/'
      },

      handsontableminjs: {
        expand: true,
        cwd: 'node_modules/handsontable/dist/',
        src: ['handsontable.full.min.js'],
        dest: '<%= distdir %>/js/'
      },

      tinymceminjs: {
        expand: true,
        cwd: 'src/vendor/tinymce/',
        src: ['tinymce.min.js'],
        dest: '<%= distdir %>/js/'
      },

      tinymce: {
        expand: true,
        cwd: "less/vendor/tinymce-dv/",
        src: ["fonts/*"],
        dest: "src/assets/stylesheets/tinymce/skins/tinymce-dv/",
      },
      tinymcejs: {
        expand: true,
        cwd: "src/vendor/tinymce/themes/silver/",
        src: ["theme.js", "theme.min.js"],
        dest: "src/assets/js/themes/silver/",
      },
      tinymce_plugins: {
        expand: true,
        cwd: 'src/vendor/tinymce/plugins/',
        src: ['fullscreen/plugin.js', 'fullscreen/plugin.min.js',
          'textcolor/plugin.js', 'textcolor/plugin.min.js',
          'colorpicker/plugin.js', 'colorpicker/plugin.min.js',
          'paste/plugin.js', 'paste/plugin.min.js',
          'preview/plugin.js', 'preview/plugin.min.js',
          'lists/plugin.js', 'lists/plugin.min.js',
          'hr/plugin.js', 'hr/plugin.min.js',
          'autolink/plugin.js', 'autolink/plugin.min.js',
          'link/plugin.js', 'link/plugin.min.js',
          'image/plugin.js', 'image/plugin.min.js',
          'spellchecker/plugin.js', 'spellchecker/plugin.min.js',
          'table/plugin.js','table/plugin.min.js',
          'wordcount/plugin.js','wordcount/plugin.min.js',
          'autoresize/plugin.js','autoresize/plugin.min.js',
          'visualchars/plugin.js','visualchars/plugin.min.js',
          'visualblocks/plugin.js','visualblocks/plugin.min.js',
          "advcode/plugin.js",
          "advcode/plugin.min.js",
          "advcode/customeditor.js",
          "advcode/customeditor.min.js",
          "advcode/codemirror.min.js",
          "advcode/codemirror.min.css",
          "quickbars/plugin.js",
          "quickbars/plugin.min.js",
        ],
        dest: "src/assets/js/plugins/",
      },
      flite_icons: {
        expand: true,
        cwd: "src/vendor/flite/icons",
        src: "**",
        dest: "src/assets/js/plugins/flite/icons",
      },
      flite_css: {
        expand: true,
        cwd: "src/vendor/flite/css",
        src: "**",
        dest: "src/assets/js/plugins/flite/css",
      },
      flite_plugin: {
        expand: true,
        cwd: "src/vendor/",
        src: ["flite/plugin.js", "flite/plugin.min.js", "flite/langs/en.js"],
        dest: "src/assets/js/plugins/",
      },
      tinymentions: {
        expand: true,
        cwd: "src/vendor/tinymce/plugins/",
        src: [
          "mentions/plugin.js",
          "mentions/plugin.min.js",
          "mentions/css/mentions.css",
        ],
        dest: "src/assets/js/plugins/",
      },
      tinycomments: {
        expand: true,
        cwd: "src/vendor/tinymce/plugins/",
        src: [
          "tinycomments/plugin.js",
          "tinycomments/plugin.min.js",
          "tinycomments/js/tinycomments-sidebar.js",
          "tinycomments/js/tinycomments-sidebar.min.js",
          "tinycomments/css/tinycomments.css",
          "tinycomments/css/tinycomments-tinymce4.css",
          "tinycomments/css/tinymce4-content.css",
          "tinycomments/css/tinymce4-icons.css",
        ],
        dest: "src/assets/js/plugins/",
      },
      tinymce_custom_plugins: {
        expand: true,
        cwd: "bower_components/footNotes/tinymce5.x/",
        src: [
          "footnotes/plugin.js",
          "footnotes/plugin.min.js",
          "footnotes/img/footnotes.png",
          "footnotes/img/fn.png",
        ],
        dest: "src/assets/js/plugins/",
      },
      powerpaste: {
        expand: true,
        cwd: "src/vendor/tinymce/plugins/",
        src: [
          "powerpaste/plugin.js",
          "powerpaste/plugin.min.js",
          "powerpaste/js/wordimport.js",
        ],
        dest: "src/assets/js/plugins/",
      },
      tinymce_icon_files: {
        expand: true,
        cwd: "src/vendor/tinymce/icons",
        src: ["default/icons.js", "default/icons.min.js"],
        dest: "src/assets/js/icons",
      },
      "angular-chosen-localytics": {
        expand: true,
        cwd: "bower_components/angular-chosen-localytics/",
        src: ["spinner.gif"],
        dest: "static/stylesheets/",
      },
      favicons: {
        expand: true,
        cwd: "src/ico/",
        src: "**",
        dest: "src/assets/ico",
      },
      docs: {
        expand: true,
        cwd: "src/app/",
        src: ["*.ngdoc", "**/*.ngdoc"],
        dest: "<%= dest.docs_js %>",
      },
    },
    watch: {
      less: {
        files: ["less/**/*.less"],
        tasks: ["less:app"],
      },
      index: {
        files: ["src/index.html", "src/loader.js"],
        tasks: ["inline:app", "injector:app"],
      },
      options: {
        livereload: true,
      },
    },
    clean: {
      auth_scripts: {
        src: [
          "static/stylesheets/login.*.css",
          "static/stylesheets/signup.*.css",
          "static/stylesheets/password_reset.*.css",
        ],
      },
      app: {
        src: ["static/stylesheets/app.*.css"],
      },
      build: {
        src: [
          "static/stylesheets/app.css",
          "static/stylesheets/app.min.css",
          "static/tmp",
          "static/build",
        ],
      },
      docs_js: {
        src: ["<%= dest.docs_js %>/"],
      },
    },
    cacheBust: {
      options: {
        encoding: "utf8",
        algorithm: "md5",
        length: 16,
        ignorePatterns: ["/ico/"],
      },
      auth_related_pages: {
        files: [
          {
            src: [
              "login",
              "signup",
              "begin_password_reset",
              "send_password_reset",
              "confirm_reset_password",
            ].map(function (filename) {
              return filename + ".html";
            }),
          },
        ],
      },
      app: {
        files: [
          {
            src: "index.html",
          },
        ],
      },
    },
    inline: {
      app: {
        options: {
          cssmin: true,
          uglify: true,
        },
        src: "src/index.html",
        dest: "index.html",
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-cache-bust");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-inline");

  // Default task.
  grunt.registerTask("default", ["less", "copy"]);

  grunt.registerTask("init", ["default", "http-server:dev", "watch"]);

  grunt.registerTask("serve", ["default"]);

  grunt.registerTask("build:auth", [
    "clean:auth_scripts",
    "less:auth",
    "cssmin:auth",
    "cacheBust:auth_related_pages",
  ]);

  grunt.registerTask("build:app", ["default", "clean:app", "cssmin:app"]);

  grunt.registerTask("docs", [
    "clean:docs_js",
    "coffee:docs",
    "copy:docs",
    "docular",
    "docularserver",
  ]);
};
