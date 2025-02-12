class AvailableResponsesController extends BaseController
  @register 'AvailableResponsesController'
  @inject 'getResponsesFn', 'addSelectedResponses', 'activeResponse', 'toaster', 'DueDiligenceDataservice', 'SidebarViewService','Utils','Restangular', 'firm_preferences'

  initialize: ->
    @loading_available_responses = true
    @is_manager = @Utils.isManager()
    @current_user = @Utils.getCurrentUser()
    @freeSubscription = @Utils.isFreeSubscription()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @setDefaultType()



    @response_added = ''
    @response_added_ids = []

  toggleResponseSelection: (response) ->
    response.isAdded = !response.isAdded

  setDefaultType: ()=>
    if @firm_preferences
      @isQaSearchEnabled = @firm_preferences.enableQASearch || (@current_user.userName.toLowerCase().indexOf('diligencevault.com') > -1)
      if @firm_preferences.set_preapproved_default && !@is_freeSubscription
        @setSelectedType('profile')
      else
        @setSelectedType('all')

  setSelectedType: (type)=>
    unless @freeSubscription and (type is 'profile' or type is 'entity')
      @selectedType = type
      @getResponses(type)

  getResponses :(type)=>
    @loading_available_responses = true
    @getResponsesFn(type).then (response) =>
      if @isQaSearchEnabled
        @available_responses = response.data
      else
        @available_responses = response

      if @available_responses and @available_responses.length
        @available_responses.sort (a, b) => b.score - a.score
      @loading_available_responses = false

  extractContent: (s) ->
    span = document.createElement('span')
    span.innerHTML = s
    span.textContent or span.innerText

  saveSelectedResponses: =>
    if @add_responses_form.$valid
      _(@available_responses).each (question, i) =>
        _(question.responses).each (response, j) =>
          if response.isAdded
            if @isQaSearchEnabled
              response_id = response.response_id
              if @activeResponse.responseType == 'TextMultiLine'
                response_text = response.response_text
              else
                response_text = @extractContent(response.response_text)
            else
              response_id = response.id
              if @activeResponse.responseType == 'TextMultiLine'
                response_text = response.responseDisplay
              else
                response_text = @extractContent(response.responseDisplay)

            @response_added = @response_added + "\n\n" + response_text
            @response_added_ids.push(response_id)

      if @response_added.length>0
        #@saving_responses = true
        @addSelectedResponses(@response_added)
        @SidebarViewService.sidebar_container.active_sidebar.close()
        @toaster.pop 'success', '', 'Selected responses have been added!'

        # params={
        #  response_ids: @response_added_ids
        # }
        # @DueDiligenceDataservice.updateResponsesUsed(@activeResponse.diligenceId, params).then (response) =>
        #  @saving_responses = false
        #  @SidebarViewService.sidebar_container.active_sidebar.close()
        #  @toaster.pop 'success', '', 'Selected responses have been added!'
      else
        @toaster.pop 'error', '', 'Please add at least one response'
