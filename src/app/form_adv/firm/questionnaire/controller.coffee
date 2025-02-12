class FormADVQuestionnaireController extends BaseController
  @register 'FormADVQuestionnaireController'

  @inject 'Restangular', '$state', '$stateParams', 'FormADVDataService','Utils',
          'SidebarViewService'

  initialize: ->
    @firmCRD = @$stateParams.firmCRD
    @filter = @$stateParams.filter || 'Part1A'
    @isFreeSubscription = @Utils.isFreeSubscription()

    @loadParentSections()
    @loadFirm(@firmCRD)

  loadFirm: (firmCRD) ->
    @Restangular.one('formadv_firms', firmCRD).get().then (response) =>
      @formadv_firm = response
      @getDataCounts()

  returnToList: ->
    @$state.go 'app.form_adv.regulatory_monitor.portfolio'    
  
  getDataCounts: ->
    @Restangular.one('formadv_firms', @firmCRD).all('counts').customGET().then (response) =>
      _(response).each (count_info) =>
        switch count_info.id
          when 'part1A'
            @part1A_count = count_info.value
          when 'part1B'
            @part1B_count = count_info.value
          when 'scheduleA'
            @scheduleA_count = count_info.value  
          when 'scheduleB'
            @scheduleB_count = count_info.value  
          when 'scheduleD'
            @scheduleD_count = count_info.value  
          when 'drps'
            @drps_count = count_info.value

  getSections: (filter) ->
      #@$state.go 'app.form_adv.questionnaire', {filter: @filter}
    params =
      firmCRD: @$stateParams.firmCRD
      filter: filter

    @Restangular.all('formadv_sections').customGET('', params).then (response) =>
      @parent_sections = response.data

      if @parent_sections.length
        @$state.go 'app.form_adv.firm.questionnaire.category', {
          categoryId: @parent_sections[0].id,
          filter: filter,
          isMultiple: @parent_sections[0].attributes.isMultiple
        }

  loadParentSections: ->
    params =
      firmCRD: @$stateParams.firmCRD
      filter: @filter

    @Restangular.all('formadv_sections').customGET('', params).then (response) =>
      @parent_sections = response.data

      if not @$state.params.categoryId and @parent_sections.length
        @$state.go 'app.form_adv.firm.questionnaire.category', {
          categoryId: @parent_sections[0].id,
          filter: 'Part1A',
          isMultiple: @parent_sections[0].attributes.isMultiple
        }

  goToSection: (section) =>
    @$state.go 'app.form_adv.firm.questionnaire.category', {
      categoryId: section.id,
      isMultiple: section.attributes.isMultiple
    }


  displayNotesController: () ->
    firmCRD = @firmCRD

    getNotesFn = =>
      @FormADVDataService.getNotes(firmCRD)

    createNoteFn = (params) =>
      @FormADVDataService.createNote(firmCRD, params)

    @SidebarViewService.open({
      templateUrl: 'sidebars/notes/template.html'
      controller: 'SidebarNotesController'
      controllerAs: 'vm'
      custom_class: 'has-notes-form'
      title: "Add Notes for #{@formadv_firm.businessName}"
      size: 'lg'
      resolve:
        getNotesFn: -> getNotesFn
        createNoteFn: -> createNoteFn
        zero_notes_message: -> "There are no notes associated with this firm's filing."
    })
