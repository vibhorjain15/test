class FormADVFilingsHistoryController extends BaseController
  @register 'FormADVFilingsHistoryController'

  @inject 'Utils', '$stateParams', 'Restangular', '$state', 'toaster', '$timeout', '$scope', 'materialThresholds',
  'FormADVDataService', 'SidebarViewService', 'ModalFactory'

  initialize: ->
    @initSetting()
    @username = @Utils.getCurrentUser().userName
    @subscription = @Utils.getSubscriptionLevel()
    @has_threshold = @$stateParams.has_threshold == 'true'
    @skip_default = @$stateParams.skip_default == 'true'
    
    if @$stateParams.start_at && @$stateParams.end_at
      @dateRange =
        start_at: @$stateParams.start_at
        end_at: @$stateParams.end_at
        set: true
    else
      @dateRange =
        start_at: null
        end_at: null
        set: false
    
    @firmCRD = @$stateParams.firmCRD

    @Restangular.one('formadv_firms', @firmCRD).get().then (response) =>
      @formadv_firm = response

    #only get default is the user has not clicked on the toggle
    if !@skip_default
      @Restangular.all('firm_preferences/material_change_preference').customGET().then (response) =>
        @has_threshold = response == true
        @getFormAdvTimeline()
    else
      @getFormAdvTimeline()

    @$scope.$on '$stateChangeSuccess', (event, toState, toParams) =>
      @SidebarViewService.closeIfAnyActiveSidebar()

  initSetting: =>
    @current_page = 0
    @total_pages = null
    @is_loading = false
    @formadv_questions = []
    @editDateRange = ['', '']
    @edit_timeline = false

  getFormAdvTimeline: =>
    @Restangular.all('Formadv_filings/timeline').customGET('', {
      firmCrd: @firmCRD
    }).then (response) =>
      @filings = response
      if !@dateRange.set
        if @filings.length<=2
          switch @filings.length
            when 0
              @dateRange.start_at = null
              @dateRange.end_at = null
            when 1
              @dateRange.start_at = @filings[0].filingDate
              @dateRange.end_at = null
            when 2
              @dateRange.start_at = @filings[1].filingDate
              @dateRange.end_at = @filings[0].filingDate
        else
          @dateRange.start_at = @filings[1].filingDate
          @dateRange.end_at = @filings[0].filingDate

        @dateRange.set = true

      if @has_threshold
        @Restangular.all('formadv_thresholds').getList().then (response) =>
          @thresholds = response
          @loadFormAdvQuestions()
          @thresholdTypes = @materialThresholds.getThresholdTypes()
      else
        @loadFormAdvQuestions()

  toggleMaterialChanges: () =>
    @has_threshold = !@has_threshold
    @$state.go 'app.form_adv.firm.filings_history', {has_threshold: @has_threshold, start_at: @dateRange.start_at, end_at: @dateRange.end_at, skip_default: true}

  triggerWorkflow: =>
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:   
        workflow: =>
          entity_type: 'FormADV'
          entity_id: @formadv_firm.id
          name: @formadv_firm.businessName
  

  loadFormAdvQuestions: () =>
    if (@subscription is 'Institutional' or @subscription is 'Productive' or @subscription is 'FormADV' or @subscription is 'Full' or @subscription is 'FormADVAnalytics' or @subscription is 'Smart')
      if @is_loading || @current_page is @total_pages
        return

      @is_loading = true
      @current_page += 1

      @Restangular.all('Formadv_Questions').customGET('', {
        firmCrd: @firmCRD,
        pageNumber: @current_page,
        start_at: @dateRange.start_at,
        end_at: @dateRange.end_at,
        has_threshold: @has_threshold
      }).then (response) =>
        @total_records = response.meta.totalRecords
        @total_pages = response.meta.totalPages

        _(response.results).each (question) => @formadv_questions.push(question)

        @is_loading = false

  downloadExcel: () =>
    if @formadv_questions.length
       @toaster.pop 'info','','Request being processed. You will receive an email with the excel'
       @Restangular.all('Formadv_filings/history/export').customGET('', {
          firmCrd: @firmCRD,
          start_at: @dateRange.start_at,
          end_at: @dateRange.end_at,
          recipients: @username
        }).then (response) =>
          @toaster.pop 'success','','Request processed successfully. Please check your email'

  selectDate: (date) =>
    selectedDateMoment = moment(date.filingDate, "MM-DD-YYYY")
    endAtMoment = moment(@dateRange.end_at, "MM-DD-YYYY")
    startAtMoment = moment(@dateRange.start_at, "MM-DD-YYYY")

    isAfter = moment(selectedDateMoment).isAfter(endAtMoment)
    isBefore = moment(selectedDateMoment).isBefore(startAtMoment)
    isBetween = moment(selectedDateMoment).isBetween(startAtMoment, endAtMoment, null, '()')

    rangeChanged = false

    if isBefore
      @dateRange.start_at = date.filingDate
      rangeChanged = true
    else if isAfter
      @dateRange.end_at = date.filingDate
      rangeChanged = true
    else if isBetween
      ###Code below is to take time difference into consideration###
      ###diff_from_start = selectedDateMoment.diff(startAtMoment, 'days')
      diff_from_end = endAtMoment.diff(selectedDateMoment, 'days')###

      start_at_idx = _.indexOf(_.pluck(@filings, 'filingDate'), @dateRange.start_at)
      end_at_idx = _.indexOf(_.pluck(@filings, 'filingDate'), @dateRange.end_at)
      selected_date_idx = _.indexOf(_.pluck(@filings, 'filingDate'), date.filingDate)

      ###Code below is to take index difference into consideration###
      diff_from_start = start_at_idx - selected_date_idx
      diff_from_end = selected_date_idx - end_at_idx

      if diff_from_start <= diff_from_end
        @dateRange.start_at = date.filingDate
      else
        @dateRange.end_at = date.filingDate
      rangeChanged = true

    if rangeChanged
      @initSetting()
      @loadFormAdvQuestions()

  selectCustomDates: (date) =>
    idx = @editDateRange.indexOf(date.filingDate)

    if idx > -1
      @editDateRange[idx] = ''
    else
      if @editDateRange[0].length == 0
        @editDateRange[0] = date.filingDate
      else
        @editDateRange[1] = date.filingDate


  getFilingData: =>

    if @editDateRange[0].length > 0 && @editDateRange[1].length > 0
      isBefore = moment(moment(@editDateRange[1], "MM-DD-YYYY")).isBefore(moment(@editDateRange[0], "MM-DD-YYYY"))

      if isBefore
        @dateRange.start_at = @editDateRange[1]
        @dateRange.end_at = @editDateRange[0]
      else
        @dateRange.start_at = @editDateRange[0]
        @dateRange.end_at = @editDateRange[1]

      @initSetting()
      ###@loadFormAdvQuestions()###
      @$state.go 'app.form_adv.firm.filings_history', {has_threshold: @has_threshold, start_at: @dateRange.start_at, end_at: @dateRange.end_at, skip_default: true}

    else
      @toaster.pop 'error','','Please select at least two filing dates'

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

  returnToList: ->
    @$state.go 'app.form_adv.regulatory_monitor.portfolio'