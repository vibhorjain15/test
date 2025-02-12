class SetUpStandardizedTextController extends ModalController

  @register 'SetUpStandardizedTextController'

  @inject '$uibModalInstance', 'question', 'Restangular', 'toaster', '$timeout', '$state', 'templateId', 'subCategoryId', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins', 'ModalFactory', '$compile', '$scope', 'Utils'

  initialize: ->
    @questionTags = []
    @loading = false
    @selectedTab = 'QuestionTags'
    @selectedWidgets = []
    @params = {
      text: ""
    }
    @previewString = ""
    @newRatingArray = []
    @alreadyReplacedTags = []
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      indent: false
      toolbar1: @$tinymceToolbar1 + ' standardtext'
      # toolbar2: ''
      menubar: false
      statusbar: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      setup: (editor) =>
        insertStandardizedText = =>
          string = '{{text_1234}}'
          @ModalFactory.invokeModal 'map_standard_text',
            resolve:
              editor: => editor
              templateId: => @templateId
              question: => @question
            success: (widget) =>
              if widget == 'redirect'
                @close()
                @$timeout =>
                  @$state.go 'app.diligence.template.categories', {templateId: @templateId}
              else
                @getAllWidgets()
                @$timeout =>
                  if widget.type != 'text'
                    if @params.text.indexOf(widget.tag) > -1
                      count = @countInstances(@params.text, widget.tag)
                      if count > 0
                        widget.tag = "{{"+widget.tag+"_"+count+"}}"
                      else
                        widget.tag = "{{"+widget.tag+"}}"
                    else
                      widget.tag = "{{"+widget.tag+"}}"
                  editor.insertContent(widget.tag)
        editor.ui.registry.addButton 'standardtext',
          text: 'Include Smart Text Control'
          tooltip: 'Include Smart Text Control'
          onAction: ->
            insertStandardizedText()
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

    @customTagsArr = []
    @sections = []
    @ratingTags = []
    @allWidgetTags = ['{{dropdown_1}}', '{{dropdown_2}}', '{{dropdown_3}}']
    @getAllWidgets()
    @selectedSection = {}
    if @question?
      @getStandardTextForQuestion()

  countInstances: (string, word) ->
    string.split(word).length - 1

  getStandardTextForQuestion: =>
    @Restangular.one('templates', @templateId).one('questions', @question.id).all('standardized_texts').customGET().then (response) =>
      if response
        @existingStandardText = response
        @params.text = response.text
        @previewString = response.html

  addMergeTagsButtonToTinymceEditor: (editor) ->
    editor.addButton 'merge_tag_button',
      type: 'menubutton'
      text: 'Open smart text wizard'
      icon: false
      menu: [
        {
          text: 'Fund Name'
          onclick: ->
            editor.insertContent '*|FUND_NAME|*'
        }
        {
          text: 'Firm Name'
          onclick: ->
            editor.insertContent '*|FIRM_NAME|*'
        }
        {
          text: 'As of Date'
          onclick: ->
            editor.insertContent '*|AS_OF_DATE|*'
        }
      ]

  getAllWidgets: =>
    @Restangular.all('widgets').getList().then (response) =>
      @customTagsArr = response

  setPreviewText: (inputString) =>
    @selectedWidgets = []
    if inputString.length
      newString = inputString
      for widget in @customTagsArr
        if inputString.indexOf(widget.tag) > -1
          if widget.type == "dropdown" and widget.type_options
            optionsStr = '<option value="">--Select--</option>'
            for option in widget.type_options
              optionsStr += '<option value="'+option+'">'+option+'</option>'
            widgetDropdown = '<select name="diligencevault_owner" id="'+widget.tag+'" chosen> '+optionsStr+'</select>'
          else
            widgetDropdown = '<input type="date" id="'+widget.tag+'_date" name="'+widget.tag+'_date">'
          newString = @Utils.replaceGlobally(newString, "{{"+widget.tag+"}}", widgetDropdown)
          count = @countInstances(@params.text, widget.tag)
          if count > 0
            i = 1
            while i <= count
              newTag = "{{"+widget.tag+"_"+i+"}}"
              if newString.indexOf(newTag) > -1
                if widget.type == "dropdown" and widget.type_options
                  optionsStr = '<option value="">--Select--</option>'
                  for option in widget.type_options
                    optionsStr += '<option value="'+option+'">'+option+'</option>'
                  widgetDropdown = '<select name="diligencevault_owner" id="'+widget.tag+"_"+i+'" chosen> '+optionsStr+'</select>'
                else
                  widgetDropdown = '<input type="date" id="'+widget.tag+"_"+i+'_date" name="'+widget.tag+"_"+i+'_date">'
                newString = @Utils.replaceGlobally(newString, newTag, widgetDropdown)
              i++

          @selectedWidgets.push widget

      @previewString = newString
    else
      @previewString = ""

  submit: =>
    @loading = true
    postObj =
      template_id: @templateId
      question_id: @question.id
      standardized_text_data:
        used_widgets: _(@selectedWidgets).pluck 'id'
        text: @params.text
        html: @previewString
        widgets: @selectedWidgets
    @Restangular.all('standardized_texts').customPUT(postObj).then (response) =>
      @$timeout =>
        @loading = false
        @close(response)


  goToTemplateView: ->
    @close('close')
