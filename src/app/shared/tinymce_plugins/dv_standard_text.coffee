tinymce.create 'tinymce.plugins.DVStandardText',
  init: (editor, url) ->
    editor.addCommand 'dvStandardText', ->
      editor.settings.render.call(editor, editor)

    editor.ui.registry.addButton 'dv_standard_text',
      title: 'Smart Text'
      cmd: 'dvStandardText',
      icon: 'format'

tinymce.PluginManager.add 'dv_standard_text', tinymce.plugins.DVStandardText
