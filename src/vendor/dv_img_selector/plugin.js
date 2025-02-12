(function () {
  tinymce.create("tinymce.plugins.DVImageSelector", {
    init: function (editor, url) {
      editor.addCommand("dvImageUpload", function () {
        return editor.settings.render.call(editor, editor);
      });
      return editor.ui.registry.addButton("dv_img_selector", {
        tooltip: "Insert Image",
        onAction: function () {
          return editor.execCommand("dvImageUpload");
        },
        icon: "image",
      });
    },
  });

  tinymce.PluginManager.add("dv_img_selector", tinymce.plugins.DVImageSelector);
}).call(this);
