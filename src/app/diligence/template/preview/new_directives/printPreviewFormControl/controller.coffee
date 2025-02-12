class PrintPreviewFormControlController extends BaseController
  @register 'PrintPreviewFormControlController'

  @inject '$scope', 'DueDiligenceDataservice', '$attrs', 'SweetAlert',
          '$compile', '$q', 'toaster', '$timeout', 'ModalFactory',
          '$stateParams', 'SidebarViewService', 'BaseDataService', 'Utils', '$tinymceToolbar1' , '$tinymceToolbar2' , '$tinymcePlugins','$tinymceStatusbar'

  initialize: ->
    @templateId = @$stateParams.templateId
    @is_admin = @Utils.isAdmin()
    @is_investor = @Utils.isInvestor()
    @$scope.printPreview = true

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
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor
      # setup: (ed) =>
      #   @editor = ed
      #   ed.on('KeyDown', (event,ed)=>
      #     if @response.question.attributes.responseType == "TextMultiLine"
      #       if event.keyCode != 8 && event.keyCode != 13 && event.keyCode != 46 && @response.question.attributes.response_word_limit != null && tinymce.activeEditor.plugins.wordcount.getCount() > @response.question.attributes.response_word_limit
      #         tinymce.dom.Event.cancel(event);
      #   )

    @$scope.$watch "::#{@$attrs.response}", (response) =>
      $scope = @$scope
      response.scope = $scope # used to scroll to the element in case of error, this scope has element tied to it
      @response = response
      @ngModelControllers = []
      @responseType = response.question.attributes.responseType
      @child_scope_map = {}

      if @response.question.hint_text
        @response.question.attributes.hint_text = @response.question.hint_text

      response.onChange =>
        @onResponseChange()

      switch @responseType
        when 'Dropdown'
          @initDropdownWidget(response).then =>
            @onResponseChange()
        when'CheckBox'
          @initCheckboxWidget(response).then =>
            @onResponseChange()
        when 'Grid','DynamicGrid'
          response.initialized.then =>
            @onResponseChange()
        else
          @onResponseChange()

    @getTeamMembers()

  getTeamMembers: =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  loadOptionList: (response) ->
    questionID = response.question.id

    @$scope.questionnaireController.loadOptionList(questionID).then (list) =>
      @list = list
      @otherOption = _(list).findWhere(value: 'Other')

      list

  onResponseChange: (valueAttribute) ->
    @computeRules()

  computeRules: =>
    return unless @response.ruleIsApplicable()

    questionnaireController = @$scope.questionnaireController
    response = @response
    rules = @response.question.rules
    element = @$scope.element
    child_scope_map = @child_scope_map
    $scope = @$scope
    $compile = @$compile

    _(rules).each (rule) =>
      ruleID = rule.id

      if element.find("[data-rule-id=#{ruleID}]").length
        element.find("[data-rule-id=#{ruleID}]").remove()

      _(rule.attributes.nestedQuestionIds).each (questionID) =>
        # if you don't use ">" you'll end up getting containers for nested rules too
        $container = element.find('> .js-conditional-responses')
        question = questionnaireController.getQuestionForId(questionID)
        conditional_response = questionnaireController.getResponse(question, response.sequence, response.diligenceId)

        child_response_element = $compile("""
            <print-preview-form-control response="response" data-rule-id="#{ruleID}"></print-preview-form-control>
          """)($scope)
        child_scope = child_response_element.scope()
        child_scope.response = conditional_response

        child_scope_map[ruleID] ||= []
        child_scope_map[ruleID].push(child_scope)
        $container.append(child_response_element)

  initCheckboxWidget: (response) ->
    @loadOptionList(response).then (list) =>
      if @otherOption?
        list.splice(list.indexOf(@otherOption), 1)
        list.push(@otherOption)

  initDropdownWidget: (response) ->
    @loadOptionList(response).then (list) ->
      if _.isArray(response.listValueID)
        response.listValueID = response.listValueID[0]
