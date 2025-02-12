class AddTemplateCategoryController extends ModalController

  @register 'AddTemplateCategoryController'

  @inject '$uibModalInstance', 'TemplatesDataService', '$stateParams', 'section', '$scope', 'parentName', 'addingSubcategory', '$state','toaster','SweetAlert','ERROR_CODES', '$tinymceToolbarFull', '$tinymcePlugins', 'ModalFactory', '$timeout', 'existingCategories', '$http', 'baseUrl','$tinymceStatusbar'

  initialize: ->
    @templateId = @$stateParams.templateId
    @categoryId = @$state.params.categoryId
    @useSingleMode = false
    @listType = "Category"
    if @section
      @useSingleMode = true
    if @addingSubcategory
      @listType = "Subcategory"


    @newCategories = []

    @sectionAttributes = ['name', 'headerText', 'isMultiple']

    if @addingSubcategory
      @isLoaded = true
      # load parent section here
    else
      @TemplatesDataService.getTemplate(@templateId).then (response) =>
        @isLoaded = true
        @template = response

    if @section
      @edit_mode = true
      section_copy = _.pick(@section, @sectionAttributes)
    else
      @section =
        templateID: @templateId

      if @addingSubcategory
        @section.parentID = @$stateParams.categoryId

    @initTinyMc()


  initTinyMc: =>
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 180
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar: @$tinymceToolbarFull
      toolbar_mode: 'wrap'
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

    @tinymceOptions

  finishBulkSubmit: ->
    if !@newCategories.length
      return
    @saving_section = true
    apiObject = {}
    apiObject.template_id = @templateId
    apiObject.sections = []
    if @addingSubcategory
      apiObject.parentSection_id = @categoryId
    _(@newCategories).each (newCat) =>
      nameObj = {}
      nameObj.name = newCat.name
      apiObject.sections.push nameObj

    @$http.post(@baseUrl + '/templates/'+@templateId+'/bulk_sections', apiObject).then ((response) =>
      @saving_section = false
      @$uibModalInstance.close response.data
    ),(error) =>
      @saving_section = false
      @$uibModalInstance.close null
      if error.status == @ERROR_CODES.BAD_REQUEST
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: 'Refresh'
        }).then (confirm) =>
          if confirm.value and confirm.value == true
            @$state.go("app.diligence.template.preview",{templateId: @templateId})
      else if error.data and error.data.message != ""
        @toaster.pop 'error', '', error.data.message

  checkBoxClicked: ->
    @section_form.$setPristine()
    @section_form.$setUntouched()

  submit: ->
    if !@useSingleMode
      @finishBulkSubmit()
      return

    return unless @section_form.$valid

    @saving_section = true

    promise = if @edit_mode then @update() else @save()

    promise.then ((response) =>
      unless @edit_mode
        if @addingSubcategory
          @$state.go('app.diligence.template.categories.subcategories.questions', {
            subcategoryId: response.id
          })
        else
          @$state.go('app.diligence.template.categories.subcategories', {
            categoryId: response.id
          })
      @saving_section = false
      @$uibModalInstance.close response
    ),((error) =>
      @saving_section = false
      @$uibModalInstance.close null
      if error.status == @ERROR_CODES.BAD_REQUEST
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: 'Refresh'
        }).then (confirm) =>
          if confirm.value and confirm.value == true
            @$state.go("app.diligence.template.preview",{templateId: @templateId})
      else if error.data and error.data.message != ""
        @toaster.pop 'error', '', error.data.message
    )

  save: (-> @TemplatesDataService.createSection @section)

  update: ->
    params = _(@section).pick(@sectionAttributes)

    @TemplatesDataService.updateSection(@section.id, params).then (response) =>
      _(@section).extend response

  cancel: ->
    _(@section).extend(@sectionAttributes) if @edit_mode

    @$uibModalInstance.dismiss 'cancel'
