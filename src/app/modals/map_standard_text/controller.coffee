class MapStandardTextController extends ModalController
    @register 'MapStandardTextController'

    @inject 'toaster', 'Restangular','$state', 'ModalFactory', '$timeout', 'templateId', 'question', 'SweetAlert', 'TemplatesDataService'

    initialize: ->
      @allMappedQuestions = []
      @projectTagsArr = []
      @customTagsArr = []
      @templateName = "templates-selector"
      @editMode = false
      @loading = true
      @existing_widget = null
      @active_tab = 'customTags'
      @tabHelpText = "You can create these tags as per your preference by clicking on 'add' button below. These can  either be a dropdown or a date type of field."
      @placeholderText = 'Search in custom tags'
      @templates = []
      @normalQuestionTags = []
      @unsupportedResponseTypes = ['Attachment','ReturnTable','aumTable','Grid','DynamicGrid']
      @getAllWidgets()
      @getProjectTags()
      @getQuestionMapping()
      @getNormalQuestions()

    getQuestionMapping: =>
      @TemplatesDataService.getMappedQuestions(@templateId, @question.id).then (response)=>
        @allMappedQuestions = response
        for everyQuestionTag in @allMappedQuestions
          everyQuestionTag.copyKey = '{{' + everyQuestionTag.mapped_template_id + '_' + everyQuestionTag.mapped_question_group_id + '_1}}'

    getNormalQuestions: =>
      @TemplatesDataService.getCustomQuestions({template_id: @templateId}).then (response) =>
        @loading = false
        @normalQuestionTags = []
        for entry in response
          if @unsupportedResponseTypes.indexOf(entry.responseType) == -1
            entry.copyKey = '{{' + 'self_' + entry.group_id + '}}'
            @normalQuestionTags.push entry


    goToTemplateView: =>
      @close('redirect')

    clearFilters: =>
      @searchText = ""

    getPlaceHolderText: (type) =>
      text = ""
      if type == 'projectTags'
        text = 'Search in project tags'
      else if type == 'mappedQuestionTags'
        text = 'Search in mapped question tags'
      else if type == 'customTags'
        text = 'Search in custom tags'
      else if type == 'questionTags'
        text = 'Search in question tags'

      @placeholderText = text

    getSections: =>
      arr = []
      dupes = []
      for entry in @questionTags
        if dupes.indexOf(entry.sectionID) == -1
          arr.push {id: entry.sectionID, name: entry.section_name}
          dupes.push entry.sectionID
      arr

    filtersQuestionTags: =>
      if @selectedSection.id
        @questionTags = _(@questionTagsCopy).filter (questionTag) => questionTag.sectionID == @selectedSection.id

    useSelectedWidget: (index) =>
      selectedWidget = @customTagsArr[index]
      @close(selectedWidget)

    addWidget: =>
      @ModalFactory.invokeModal 'add_widget_options',
        resolve:
          existing_widget: -> null
        success: (response) =>
          if response
            @getAllWidgets()

    getRatingTags: =>
      @Restangular.all('reports/new/rating_tags').customGET('', {template_id: @templateId}).then (response) =>
        @ratingTags = response
        @$timeout =>
          for everyRatingTag in @ratingTags
            name = ""
            for section in @sections
              if section.id == everyRatingTag.key
                name = section.name
            everyRatingTag.copyKey = '{{' + 'rating_' + everyRatingTag.value + '_1}}'
            everyRatingTag.section_name = name

    getProjectTags: =>
      @Restangular.all('reports/new/project_tags').customGET().then (response) =>
        @projectTagsArr = response
        for eachProjectTag in @projectTagsArr
          eachProjectTag.copyKey = '{{' + eachProjectTag.item2 + '}}'

    deleteWidget: (widget, index) =>
      @SweetAlert.confirm({
        title: 'Are you sure you want to delete this widget ?'
        confirmButtonText: 'Yes, delete!'
        showLoaderOnConfirm: true
        focusCancel: true
        preConfirm: =>
          params = angular.copy widget
          params.is_active = false
          @Restangular.one('widgets', widget.id).customPUT(params).then =>
            tagIndex = _(@customTagsArr).findIndex (customTag)=>
              customTag.id == widget.id
            @customTagsArr.splice(tagIndex, 1)
            @toaster.pop 'success', '', "Widget deleted successfully"
          .finally => swal.close()
      })

    editWidget: (widget) =>
      params = angular.copy widget
      @ModalFactory.invokeModal 'add_widget_options',
        resolve:
          existing_widget: -> params
        success: (response) =>
          if response
            @getAllWidgets()

    getAllWidgets: =>
      @loading = true
      @Restangular.all('widgets').getList().then (response) =>
        @customTagsArr = response
        @loading = false

    handleUploadError: (response) =>
      @loading = false

    setActiveTab: (tabType) ->
      @active_tab = tabType
      @getPlaceHolderText(tabType)
      if tabType == 'customTags'
        @getAllWidgets()
        @tabHelpText = "You can create these tags as per your preference by clicking on 'add' button below. These can  either be a dropdown or a date type of field."
      else if tabType == 'mappedQuestionTags'
        @getQuestionMapping()
        @tabHelpText = "These tags show question that are already mapped with current question. It can only be used if you have mapping configured."
      else if tabType == 'projectTags'
        @tabHelpText = "Project tags are related to due diligence. Choose these tags to autofill all the project values while answering."
        @getProjectTags()
      else if tabType == 'questionTags'
        @tabHelpText = "Choose these tags to pull in questions that are already available in this template."
        @getNormalQuestions()

    submit: =>
      selectedWidget = @customTagsArr[@selectedWidgetIndex]
      @close(selectedWidget)

    copyTags: (tag) ->
      obj =
        type: 'text'
        tag: tag
      @close(obj)
