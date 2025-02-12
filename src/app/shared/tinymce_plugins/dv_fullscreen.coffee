tinymce.create 'tinymce.plugins.DVFullscreen',
  init: (editor, url) ->
    elementScrollPosition = 0
    elementOffsetHeight = 0

    editor.ui.registry.addToggleButton 'dv_fullscreen',
      title: 'Fullscreen'
      icon: 'fullscreen'
      onAction: (api)->
        editor.execCommand('mceFullScreen')
        api.setActive(!api.isActive());
        if !api.isActive() and elementScrollPosition > 0
          $(document).scrollTop(elementScrollPosition + elementOffsetHeight)
      onSetup: (api)->
        elementScrollPosition = $(document).scrollTop()
        elementOffsetHeight = editor.editorContainer.offsetHeight

tinymce.PluginManager.add 'dv_fullscreen', tinymce.plugins.DVFullscreen
