class ReportComponentOptionsController extends BaseController
  @register 'ReportComponentOptionsController'
  @inject '$element', '$rootScope', '$compile', '$scope', 'FundDataservice', 'ReportTemplateDataservice' ,'toaster', 'firmSettingsService', 'DueDiligenceDataservice',
    '$http', 'baseUrl', 'Utils', 'rbQuestionnaireUtils', 'TemplatesDataService', '$q', 'FirmDataservice', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins', 'ModalFactory', '$timeout','$tinymceStatusbar','proprietaryLicenses'

  initialize: ->
    @options_container = @$element.find('.js-content')

    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      force_br_newlines : false
      force_p_newlines : false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      setup: (editor) =>
        @addMergeTagsButtonToTinymceEditor(editor)

      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor


    @colorScheme = @Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']

    @iconList = @Utils.getIconList()

    @aum_chart_types = [
      {
        value: 'bar'
        label: 'Bar Chart'
      }
      {
        value: 'line'
        label: 'Line Chart'
      }
    ]

    @imageTypes = [
      {
        value: 'image'
        label: 'Image'
      }
      {
        value: 'logo'
        label: 'Logo'
      }
    ]

    _firmSettingsService = @firmSettingsService.$new({colorScheme: @colorScheme})

    @colorMap = _firmSettingsService.getColorsMap()

    @chartTypes = [
      {
        value: 'pie'
        label: 'Pie Chart'
      }
      {
        value: 'donut'
        label: 'Donut Chart'
      }
      {
        value: 'bar'
        label: 'Bar Chart'
      }
      {
        value: 'line'
        label: 'Line Chart'
      }
    ]

    @chartGridSettings = {
      licenseKey: @proprietaryLicenses.Handsontable
      colHeaders: true
      colWidths: 150
      colHeaders: ['Name', 'Value']
      viewportRowRenderingOffset: 100
    }

    @chartGridColumns = [
      {
        data: "name"
        title: "Name"
        className:'htCenter'
      }
      {
        data: "value"
        title: "Value"
        className:'htCenter'
      }
    ]

    @dummyChartData = {
      items: [
        {
          name: 'January'
          value: 23
        }
        {
          name: 'February'
          value: 45
        }
        {
          name: 'March'
          value: 11
        }
        {
          name: 'April'
          value: 30
        }
      ]
    }

    minFontSize = 18
    maxFontSize = 46
    availableFontSize = _.range(minFontSize, maxFontSize + 2, 2)
    @fontSizes = []
    _(availableFontSize).each (fontSize) =>
      @fontSizes.push {value: fontSize.toString(), label: fontSize.toString()}


  addMergeTagsButtonToTinymceEditor: (editor) ->
    editor.addButton 'merge_tag_button',
      type: 'menubutton'
      text: 'Merge Tags'
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

  deactivateComponent: ->
    @has_active_component = false
    @$scope.deactivateComponent()

  renderComponentOptions: (template, component) =>
    @previous_component_options_scope?.$destroy()

    @has_active_component = true
    @hasSettingsTemplate = (template)?

    scope = @$rootScope.$new()
    scope.component = component

    switch component.type
      when 'text'
      #ui-tinymce internally modifies this object, hence passing a copy
        scope.tinymceOptions = _.extend({}, @tinymceOptions)
        scope.tinymceOptions.setup = (editor) =>
          @addMergeTagsButtonToTinymceEditor(editor)
      when 'notes'
        if component.options.entity_id
          if component.options.entity_type == 'Fund'
            @FundDataservice.getNotes(component.options.entity_id).then (response) =>
              scope.notesList = response
          else
            @FirmDataservice.getNotes(component.options.entity_id).then (response) =>
              scope.notesList = response
        else
          scope.notesList = @ReportTemplateDataservice.getSampleNotes()

        #ui-tinymce internally modifies this object, hence passing a copy
        scope.tinymceOptions = _.extend({}, @tinymceOptions)

        scope.tinymceOptions.setup = (editor) =>
          @addMergeTagsButtonToTinymceEditor(editor)

        scope.selectNote = (text) =>
          scope.component.options.content = text
          @toaster.pop 'success', '', 'Note selected!', 5000

      when 'aum_chart'
        scope.aum_chart_types = @aum_chart_types
        scope.component.options.color_one = @colorScheme[0] if scope.component.options.color_one == null

      when 'performance_chart'
        scope.performance_chart_types = @aum_chart_types
        scope.component.options.color_one = @colorScheme[0] if scope.component.options.color_one == null

      when 'image_selector'
        scope.imageTypes = @imageTypes
        scope.setLogoAlignment = (alignment) =>
          scope.component.options.alignment = alignment

      when 'questionnaire'
        scope.isEntityAssociated = (eval component.options.entity_id)?
        scope.selectEntireQuestionnaire = false
        if (eval component.options.entity_id)
          if component.options.entity_id == "Fund"
            @FundDataservice.getDiligences(component.options.entity_id).then (response) =>
              scope.diligenceList = response
              scope.component.options.diligenceId = parseInt scope.component.options.diligenceId
              scope.component.options.selectedDiligence = JSON.stringify scope.diligenceList.filter (diligence) ->
                diligence.id ==  scope.component.options.diligenceId
          else
            @FirmDataservice.getDiligences(component.options.entity_id).then (response) =>
              scope.diligenceList = response
              scope.component.options.diligenceId = parseInt scope.component.options.diligenceId
              scope.component.options.selectedDiligence = JSON.stringify scope.diligenceList.filter (diligence) ->
                diligence.id ==  scope.component.options.diligenceId

        scope.$watch( () =>
          scope.component.options.diligenceId
        , (newVal) =>
          if(parseInt newVal)
            if scope.diligenceList
              scope.component.options.selectedDiligence = JSON.stringify scope.diligenceList.filter (diligence) -> diligence.id ==  scope.component.options.diligenceId
              scope.questionnaireTree = null
            @DueDiligenceDataservice.getSectionsV2(newVal).then (response) =>
              scope.questionnaireTree = @Utils.createQuestionnaireTree(response.data, response.included)
              scope.component.options.questionnaireTree = JSON.stringify scope.questionnaireTree

              selectedNodes = eval scope.component.options.selectedNodes
              if selectedNodes and selectedNodes.length
                @rbQuestionnaireUtils.setSelectedNodes(scope.questionnaireTree, selectedNodes)
                scope.component.options.selectedIds = @rbQuestionnaireUtils.showSelectedTree scope.questionnaireTree
        )

        scope.expandNode = (node, event) =>
          event.stopPropagation()
          node.toggle()

        scope.selectItem = (node, event) =>
          event.stopPropagation()
          rootVal = !node.isSelected
          @rbQuestionnaireUtils.selectChildren node, rootVal

          if node.type == 'questions'
            parentSubSection = @rbQuestionnaireUtils.findParentSubSection scope.questionnaireTree, node
            if parentSubSection?
              @rbQuestionnaireUtils.selectParentSubSection parentSubSection
              parentSection = @rbQuestionnaireUtils.findParentSection scope.questionnaireTree, parentSubSection
              if parentSection
                @rbQuestionnaireUtils.selectParentSection parentSection

            parentSection = @rbQuestionnaireUtils.findParentSectionFromQuestion scope.questionnaireTree, node
            if parentSection?
              @rbQuestionnaireUtils.selectParentSubSection parentSection

          if node.type == 'sections'
            parentSection = @rbQuestionnaireUtils.findParentSection scope.questionnaireTree, node
            if parentSection
              @rbQuestionnaireUtils.selectParentSection parentSection

          scope.component.options.selectedNodes = JSON.stringify @rbQuestionnaireUtils.getSelectedNodes scope.questionnaireTree
          scope.component.options.selectedIds = @rbQuestionnaireUtils.showSelectedTree scope.questionnaireTree
          scope.component.options.questionnaireTree = JSON.stringify scope.questionnaireTree

        scope.toggleEntireQuestionnaireSelection = () =>
          scope.selectEntireQuestionnaireTemplate = !scope.selectEntireQuestionnaireTemplate
          @rbQuestionnaireUtils.toggleEntireTree scope.questionnaireTree, scope.selectEntireQuestionnaireTemplate

          scope.component.options.selectedNodes = JSON.stringify @rbQuestionnaireUtils.getSelectedNodes scope.questionnaireTree
          scope.component.options.selectedIds = @rbQuestionnaireUtils.showSelectedTree scope.questionnaireTree
          scope.component.options.questionnaireTree = JSON.stringify scope.questionnaireTree

      when 'blank_chart'
        ### Initialization Settings ###
        scope.chartTypes = @chartTypes
        scope.chartGridSettings = @chartGridSettings

        if _(scope.component.options.chartData).isEmpty()
          emptyGrid = @dummyChartData
          scope.chartData = emptyGrid
          scope.component.options.chartData = JSON.stringify emptyGrid
        else
          scope.chartData = JSON.parse scope.component.options.chartData

        @chartGridSettings.afterChange = (change) ->
          if change?
            gridChangeCallback(change)

        scope.updateGrid = () ->
          if scope.component.options.rows > 0
            oldGridItemCount = scope.chartData.items.length
            newGrid = updateGridElements(scope.chartData.items, oldGridItemCount, scope.component.options.rows)
            scope.chartData = newGrid
            scope.component.options.chartData = JSON.stringify newGrid

        gridChangeCallback = (changedData) =>
          updateData = updateChartData((JSON.parse scope.component.options.chartData)['items'], changedData)
          scope.chartData = updateData
          scope.component.options.chartData = JSON.stringify updateData
          true

        updateChartData = (src, data) =>
          _(data).forEach (updatedData) ->
            src[updatedData[0]][updatedData[1]] = if isNaN parseInt updatedData[3] then updatedData[3] else parseInt updatedData[3]

          {items: src}

        updateGridElements = (oldGrid, oldGridLength, newLength) =>
          if newLength  < 1
            return

          newGrid = []
          if (newLength - oldGridLength) > 0
            extraGrid = initializeDataGrid(newLength - oldGridLength)
            newGrid = [].concat oldGrid, extraGrid
          else if (newLength - oldGridLength) < 0
            newGrid = oldGrid.slice 0, newLength
          else
            newGrid = oldGrid

          {items: newGrid}

        initializeDataGrid = (rows) =>
          gridData = []
          _(rows).times () ->
            gridData.push { name: 'Something', value: _.random(0, 100) }

          gridData

      when 'header_row'
        scope.fontSizes = @fontSizes
        scope.component.options.backgroundColor = @colorScheme[0] if scope.component.options.backgroundColor == null

      when 'questionnaire_template'
        scope.isEntityAssociated = (eval component.options.entity_id)?
        if component.options.view == undefined or component.options.view == null
          scope.component.options.view = 'horizontal'

        response_types_to_ignore = ['Grid']

        @TemplatesDataService.getTemplates().then (response) =>
          scope.templatesList = response
          scope.templateId = parseInt scope.component.options.templateId

        selectedQuestionsList = eval(scope.component.options.selectedQuestionsList)
        if (eval component.options.templateId)
          scope.questionsList = []
          scope.loading_questions_list = true
          @TemplatesDataService.getCustomQuestions({template_id: scope.component.options.templateId}).then (questions_response) =>
            questions_response = _(questions_response).sortBy (question) -> question.sectionID
            _(questions_response).each (question, i) ->
              if question.id && question.text && !(question.responseType in response_types_to_ignore)
                if selectedQuestionsList.length
                  _(selectedQuestionsList).each (selected_question, i) ->
                    if selected_question.id == question.id
                      question.is_selected = true
                scope.questionsList.push(question)
            scope.loading_questions_list = false

        scope.templateChanged = () =>
          scope.component.options.selectedQuestionsList = JSON.stringify []
          scope.component.options.templateId = scope.templateId
          scope.loading_questions_list = true
          @TemplatesDataService.getCustomQuestions({template_id: scope.component.options.templateId}).then (questions_response) =>
            scope.questionsList = []
            questions_response = _(questions_response).sortBy (question) -> question.sectionID
            _(questions_response).each (question, i) ->
              if question.id && question.text && !(question.responseType in response_types_to_ignore)
                scope.questionsList.push(question)
            scope.loading_questions_list = false

        scope.updateSelectedList = (changed_question) =>
          selectedQuestionsListCopy = eval scope.component.options.selectedQuestionsList
          selectedQuestionsList = []
          _(scope.questionsList).each (question, i) ->
            if question.is_selected
              existing_question = _(selectedQuestionsListCopy).findWhere(id: question.id)
              if existing_question
                question.textResponse = existing_question.textResponse
              selectedQuestionsList.push(question)

          if (eval component.options.entity_id)
            promises = []
            _(selectedQuestionsList).each (selected_question) =>
              if !selected_question.textResponse && (selected_question.id == changed_question.id)
                @toaster.pop 'info', '', 'Adding selected question...'
                promises.push @DueDiligenceDataservice.getReportQuestionResponse({entity_type: component.options.entity_type, entity_id: component.options.entity_id, question_id: selected_question.id}).then (question_response) =>
                  selected_question.textResponse = if question_response then question_response else ''

            @$q.all(promises).then =>
              scope.component.options.selectedQuestionsList = JSON.stringify selectedQuestionsList
          else
            scope.component.options.selectedQuestionsList = JSON.stringify selectedQuestionsList

      when 'fund_overview'
        scope.iconList = @iconList
        ignoreResponseTypes = ['Grid']
        scope.isEntityAssociated = (eval component.options.entity_id)?
        scope.selectedInfoModel = null
        scope.selectedInfoModelIdx = -1
        @$rootScope.$broadcast 'clear_info_model_selection', component.cid

        if scope.component.options.infoList == null
          scope.infoList = [{}]
          scope.selectedInfoModel =
            icon: null
            label: null
            questionId: null
          scope.selectedInfoModelIdx = 0
          ###scope.component.options.infoList = JSON.stringify scope.infoList###
        else
          scope.infoList = JSON.parse scope.component.options.infoList

          promises = []
          if scope.isEntityAssociated and scope.infoList.length
            _(scope.infoList).forEach (infoModel) =>
              promises.push @DueDiligenceDataservice.getReportQuestionResponse({entity_type: component.options.entity_type, entity_id: component.options.entity_id, question_id: infoModel.questionId})

            @$q.all(promises).then (responses) ->
              _(responses).forEach (response, idx) ->
                scope.infoList[idx].response = if response then response else ''

              scope.component.options.infoList = JSON.stringify scope.returnCleanedInfoList()

        getSelectedTemplateQuestions = () =>
          scope.loadingQuestionsList = true
          @TemplatesDataService.getCustomQuestions({template_id: scope.component.options.templateId}).then (questions_response) ->
            questions_response = _(questions_response).sortBy (question) -> question.sectionID
            _(questions_response).each (question) ->
              if question.id && question.text && !(question.responseType in ignoreResponseTypes)
                scope.questionsList.push(question)
            scope.loadingQuestionsList = false

        @TemplatesDataService.getTemplates().then (response) ->
          scope.templatesList = response
          scope.templateId = parseInt scope.component.options.templateId

        if (eval component.options.templateId)
          scope.questionsList = []
          getSelectedTemplateQuestions()

        scope.templateChanged = () ->
          scope.component.options.templateId = scope.templateId
          scope.questionsList = []
          getSelectedTemplateQuestions()

        scope.addInfoModel = () =>

          if scope.infoList.length < 6
            @$rootScope.$broadcast 'clear_info_model_selection', component.cid

            scope.infoList.push {}
            scope.selectedInfoModel =
              icon: null
              label: null
              questionId: null
            scope.selectedInfoModelIdx = scope.infoList.length - 1

        scope.selectInfoList = (infoModel, idx) =>
          scope.selectedInfoModel = infoModel
          scope.selectedInfoModelIdx = idx
          scope.returnCleanedInfoList()

        scope.updateInfoList = (model, idx, selectedUpdate = false) =>

          return unless scope.selectedInfoModel.icon and scope.selectedInfoModel.label and scope.selectedInfoModel.questionId

          if model == 'question' and scope.isEntityAssociated
            @DueDiligenceDataservice.getReportQuestionResponse({entity_type: component.options.entity_type, entity_id: component.options.entity_id, question_id: scope.selectedInfoModel.questionId}).then (response) =>
              scope.infoList[idx].response = if response then response else ''
              scope.component.options.infoList = JSON.stringify scope.returnCleanedInfoList()

          if selectedUpdate
            scope.infoList[idx] = scope.selectedInfoModel

          scope.component.options.infoList = JSON.stringify scope.returnCleanedInfoList()

          @toaster.pop 'success', '', 'Component successfully updated'

        scope.removeInfoList = (idx) =>
          scope.infoList.splice idx, 1
          if idx == scope.selectedInfoModelIdx
            scope.selectedInfoModel =
              icon: null
              label: null
              questionId: null

          scope.selectedInfoModelIdx = -1
          scope.component.options.infoList = JSON.stringify scope.returnCleanedInfoList()

          @toaster.pop 'success', '', 'Component successfully deleted'

        scope.resetInfoModel = (clearLastElement) =>
          scope.selectedInfoModel =
            icon: null
            label: null
            questionId: null
          scope.selectedInfoModelIdx = -1

          if clearLastElement
            scope.infoList.pop()

        scope.showAllInfoModels = () =>
          scope.selectedInfoModel = null
          scope.selectedInfoModelIdx = -1

        scope.returnCleanedInfoList = () =>
          valid_info_list_items = _(scope.infoList).filter (item) ->
            item.icon && item.label && item.questionId
          scope.infoList = valid_info_list_items
          return scope.infoList

        scope.$on 'activate_overview_component', (event, infoModel, idx, cid) =>
          if cid == component.cid
            scope.selectInfoList(infoModel, idx)

        scope.$on 'remove_overview_component', (event, idx, cid) =>
          if cid == component.cid
            scope.removeInfoList(idx)

    scope.colorMap = @colorMap

    @options_container.html @$compile(template)(scope)

    @previous_component_options_scope = scope

  getEntireDiligence: (diligenceId) ->
    @DueDiligenceDataservice.getSectionsV2(diligenceId).then (response) =>
      @Utils.createQuestionnaireTree(response.data, response.included)
