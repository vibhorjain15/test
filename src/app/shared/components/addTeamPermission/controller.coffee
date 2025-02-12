class addTeamPermissionsController extends BaseController
    @register 'addTeamPermissionsController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$state','$rootScope', 'FirmDataservice', 'FundDataservice', 'DueDiligenceDataservice','$q', 'keywordConstants'

    initialize: ->
        @is_manager = @Utils.isManager()
        @is_investor = @Utils.isInvestor()
        @current_user = @Utils.getCurrentUser()
        @currentFirmId = @current_user.firmInfo.id
        @minDate = moment().subtract(5,'years').toDate()
        @maxDate = new Date()
        @entity_type = null
        @parentResources = []
        @diligence_types = [{name: 'Firm', value: 'Firm'}, {name: 'Product', value: 'Fund'}]
        if @is_manager
            @diligence_types = [{name: 'My Firm', value: 'MyFirm'}, {name: 'Product', value: 'Fund'}]
        @entityDisplayParams = {
          id: 'id'
          name: 'display_name'
        }
        @diligenceDisplayParams = {
          id: 'id'
          name: 'name'          
        }

        @templateDislayParams = {
          id: 'id'
          name: 'name'
        }

        promises = []
        if not @editMode
          promises.push @getFirmPref()
          promises.push @getFunds()
          promises.push @getFirms()
          promises.push @getTemplates()

        @$q.all(promises).then =>
          @loading = false
          if not @editMode
            @getParentResourceCategory()
            @$scope.$watch 'vm.selectedEntities', (value) =>
              if value
                if @funds
                  @fundsCopy = []
                  #filter the list manually to use the copy of each object instead of directly using the object
                  _(@funds).each (fund)=>
                    fundIndex = _(value).findIndex (entity)=>
                      entity.entity_type == @keywordConstants.Product and entity.entity_id == fund.id
                    if fundIndex == -1
                      @fundsCopy.push angular.copy(fund)
                if @firms
                  @firmsCopy = []
                  #filter the list manually to use the copy of each object instead of directly using the object
                  _(@firms).each (firm)=>
                    firmIndex = _(value).findIndex (entity)=>
                      entity.entity_type == @keywordConstants.Firm and entity.entity_id == firm.id
                    if firmIndex == -1
                      @firmsCopy.push angular.copy(firm)
                if @templates
                  @templatesCopy = []
                  #filter the list manually to use the copy of each object instead of directly using the object
                  _(@templates).each (template)=>
                    templateIndex = _(value).findIndex (entity)=>
                      entity.entity_type == @keywordConstants.Template and entity.entity_id == template.id
                    if templateIndex == -1
                      @templatesCopy.push angular.copy(template)
                if @resources.entity_type == 'DueDiligence'
                  @filterDiligences(value,@diligenceBackup)

                if @resources.entity_type == @keywordConstants.Product
                  @entitySource = @fundsCopy
                else if @resources.entity_type == @keywordConstants.Firm
                  @entitySource = @firmsCopy
                else if @resources.entity_type == @keywordConstants.Template
                  @entitySource = @templatesCopy

            ,true

            @getResources(@resources.entity_type)

        @filters = {
          'Firm':{
            'tag_id': 'tag_id'
            'relationship_status_id': 'relationship_status_id'
          }
          'Fund':{
            'tag_id': 'tag_id'
            'relationship_status_id': 'relationship_status_id'
            'strategyID': 'strategyID'
          }
          'DueDiligence':{}
          'Template': {}
        }


    getFunds: =>
      params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
      @Restangular.all('service/dvapi_service/fund_search').post(params).then (response) =>
        @funds = response.data
        @fundsCopy = angular.copy response.data

    getTemplates: =>
      @Restangular.all('templates').getList().then (response) =>
          @templates = _(response).map (template)=>
            id: template.templateInfo.id
            name: template.templateInfo.name
          @templatesCopy = angular.copy @templates

    getEntityTypeName: (entity_type) =>
      display_name = @Utils.getDisplayEntityType(entity_type)
      if @is_manager and display_name == @keywordConstants.Firm
        display_name = 'Investor'
      display_name

    setDiligenceType: (type) =>
      @diligences = null
      @resources.resource_list_ids.length = 0
      @entity_type = type
      if @entity_type == 'Firm'
        @entities = @firms
      else if @entity_type == 'MyFirm'
        @entities = []
        @entity_id  = @currentFirmId
        @getDiligenceByEntity()
      else
        @entities = @funds


    setMyFirmSelection: ->
      @selectMyFirm = true
      @resources.resource_list_ids.push  _(@firms).findWhere({id: @currentFirmId})

    getResources: (type) =>
        @selectMyFirm = false
        @entitySource = null
        if @resources.resource_list_ids
          @resources.resource_list_ids.length = 0
        else
          @resources.resource_list_ids = []
        if type == 'my_firm'
          @setMyFirmSelection()
          @selectMyFirm = true
        else if type == "Firm"
          @entitySource = @firmsCopy
        else if type =="Fund"
          @entitySource = @fundsCopy
        else if type == "Template"
          @entitySource = @templatesCopy
        else if type == "DueDiligence" and @entity_type
          @getDiligenceByEntity()

    applyMethod: (startDate,endDate)=>
        @customDateFilter.startDate = startDate
        @customDateFilter.endDate  = endDate
        @getDiligenceByEntity()

    getDiligenceByEntity: =>
      if @entity_id and @customDateFilter
        if (@entity_type == 'Firm' || @entity_type == 'MyFirm')
          @DueDiligenceDataservice.getDiligenceByFirm(@entity_id, {start_date: @customDateFilter.startDate ,end_date: @customDateFilter.endDate}).then (response) =>
            @diligenceBackup = response
            @filterDiligences(@selectedEntities,response)
        else
          @DueDiligenceDataservice.getDiligenceByFund(@entity_id, {start_date: @customDateFilter.startDate,end_date: @customDateFilter.endDate}).then (response) =>
            @diligenceBackup = response
            @filterDiligences(@selectedEntities,response)

    filterDiligences: (selectedEntities, diligences)=>
      @entitySource = []
      #filter the list manually to use the copy of each object instead of directly using the object
      _(diligences).each (project)=>
        projectIndex = _(selectedEntities).findIndex (entity)=>
          entity.entity_type == @keywordConstants.Project and entity.entity_id == project.id
        if projectIndex == -1
          @entitySource.push angular.copy(project)

    getFirmPref: =>
        @Restangular.all('firm_preferences').customGET().then (response) =>
          @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
          @type = 'in-progress'
          @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
          if @customDateFilter.selectedRange == 'No Filter'
            @customDateFilter.startDate = null
            @customDateFilter.endDate = null

    getFirms: =>
      params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
      @Restangular.all('service/dvapi_service/firm_search').post(params).then (response) =>
        # @FirmDataservice.getFirms({skip_pagination: true}).then (response) =>
        @firms = response.data
        @firmsCopy = angular.copy response.data

    getParentResourceCategory: =>
        @parentResources = [{name: 'Fund', id: 1219, display_name: 'Product'}, {name: 'Firm', id: 3 , display_name: 'Firm'}, { name: 'Template', id: 1105, display_name: 'Template' },  {name: 'DueDiligence', id: 1105, display_name: 'Project'}]
        if @is_manager
          @parentResources = [{name: 'Fund', id: 1219, display_name: 'Product'}, {name: 'Firm', id: 3 , display_name: 'Investor'}, { name: 'Template', id: 1105, display_name: 'Template' },  {name: 'DueDiligence', id: 1105, display_name: 'Project'},  {name: 'my_firm', id: 11088, display_name: 'My Firm'}]

    $onDestroy:=>
        @component_isalive = false
