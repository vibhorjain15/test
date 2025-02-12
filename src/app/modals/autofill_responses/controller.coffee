class AutoFillResponsesController extends ModalController

    @register 'AutoFillResponsesController'

    @inject 'FirmDataservice','Restangular','$http','toaster','diligence','baseUrl', 'keywordConstants', 'hierarchyConstants', 'activeAutofillViews'

    initialize: ->
        @global_hierarchy_option = @hierarchyConstants.Strategy
        @selected_diligence_id = null
        @activeView = @activeAutofillViews.RESPONSE
        @showToggleBtn = false
        if @diligence and @diligence.diligence_type == "dd_review"
          @showToggleBtn = true

        @autofillType = 'all'
        @excludedStatus = ["Invited", "Scheduled", "Withdrawn" , "Deleted"]
        @diligences = []
        @products = []
        @strategies = []
        @diligenceId = @diligence.id
        @autofillClassNames = {
            recent: ''
            firm: ''
            diligence: ''
            review: ''
        }

        @getClassNames()
        @getAllDiligences()
        @getAllProductEntities()
        @getAllStrategies()
        @getVehicles()
        @getRelatedDiligences()

    getClassNames: =>
        if @diligence.diligence_type == 'dd_review'
            if (@diligence.entity_type == @keywordConstants.Product || @diligence.entity_type == @keywordConstants.Vehicle || @diligence.entity_type == @keywordConstants.Strategy)
                @autofillClassNames.recent = @autofillClassNames.firm = @autofillClassNames.diligence = @autofillClassNames.review = 'col-md-3'
            else
                @autofillClassNames.recent = @autofillClassNames.diligence = @autofillClassNames.review = 'col-md-4'
        else if @diligence.entity_type == @keywordConstants.Firm
            @autofillClassNames.recent = @autofillClassNames.diligence = 'col-md-6'
        else
            @autofillClassNames.recent = @autofillClassNames.firm = @autofillClassNames.diligence = 'col-md-4'

    changeAutofillType: (type) =>
        @autofillType = type

    getAllProductEntities: =>
        @Restangular.one('funds', @diligence.entity_id).all('related').getList().then (response) =>
            @products = response

    getRelatedDiligences: =>
        @Restangular.one('diligences', @diligenceId).all('rated_projects').getList().then (response) =>
            @related_diligences = response

    setActiveView: (view) =>
      @activeView = view

    getAllStrategies: () ->
        params =
            include_contacts: false,
            include_custom_fields: false,
            include_dates: true,
            is_active: true,
            filters: {}
            search_for: @global_hierarchy_option
        @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
            @strategies = angular.copy response.data

        # @FirmDataservice.getRelatedEntities(@diligence.tofirm_id).then (response) =>
        #     @products = response

    getAllDiligences: =>
        @Restangular.all('diligences').all('history').getList({entity_id: @diligence.entity_id, entity_type: @diligence.entity_type, start_date: null,end_date: null, parent_diligence_id: @diligence.id}).then (response) =>
            @diligences = _(response).filter (diligence)=>
                diligence.id != @diligence.id &&  @excludedStatus.indexOf(diligence.status) == -1

    getVehicles: =>
        @Restangular.all('vehicles').getList().then (response) =>
            @vehicles = response

    submit: =>
        if @activeView == @activeAutofillViews.RATING
            if !@selected_diligence_id
              @toaster.pop 'info', '', 'Please select a Project'
              return
            params = {}
            @saving = true
            @$http.post("#{@baseUrl}/diligences/#{@diligenceId}/autofill_ratings?source_diligence_id=#{@selected_diligence_id}",params).then ((response) =>
                @saving = false
                affected_row_count = response.data.affected_rows
                if affected_row_count
                  @toaster.pop 'success', '', "Autofilled ratings/scores for #{affected_row_count} response#{if affected_row_count > 1 then 's' else ''}"
                else
                  @toaster.pop 'info', '', 'No previous data was found'
                  return

                @close(response)
            ), (error) =>
                @saving = false
        else
            if @autofill_form.$valid
                @saving = true

                params = {
                    'duediligence_id': @diligenceId
                }
                apiUrl = "#{@baseUrl}/service/es_service/autofill_es"

                if @autofillType == 'diligence'
                    params.entity_id = @source_diligence_id
                    params.entity_type = 'DueDiligence'

                if @autofillType == 'product'
                    params.entity_id = @product_id
                    params.entity_type = 'Fund'

                if @autofillType == 'vehicle'
                    params.entity_id = @source_vehicle_id
                    params.entity_type = 'Vehicle'

                if @autofillType == 'strategy'
                    params.entity_id = @strategy_id
                    params.entity_type = 'strategy'

                if @autofillType == 'review'
                    params.entity_id = null
                    params.entity_type = null
                    params.autofill_mapped_responses = true
                    apiUrl = "#{@baseUrl}/v2/diligences/autoFill"

                @$http.post(apiUrl,params).then ((response) =>
                    @saving = false
                    affected_row_count = response.data.affected_row_count

                    unless affected_row_count
                        @toaster.pop 'info', '', 'No previous data was found'
                        return
                    else
                        @toaster.pop 'success', '', "#{response.data.affected_row_count} response#{if affected_row_count > 1 then 's' else ''} autofilled"

                    @close(response)
                ), (error) =>
                    @saving = false
