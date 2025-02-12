tinymce.create 'tinymce.plugins.DVImageSelector',
  init: (editor, url) ->
    editor.addCommand 'dvImageUpload', ->
      editor.settings.render.call(editor, editor)

    editor.ui.registry.addButton 'dv_img_selector',
      icon: 'image'
      tooltip: 'Insert Image'
      onAction: ->
        editor.execCommand('dvImageUpload')

tinymce.PluginManager.add 'dv_img_selector', tinymce.plugins.DVImageSelector
