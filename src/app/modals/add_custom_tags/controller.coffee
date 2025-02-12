class AddCustomFieldsController extends ModalController
  @register 'AddCustomFieldsController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', 'type', '$state', '$timeout', 'existing_tags','editIndex','typeId','Utils','entityId','schema_format','source'

  initialize: ->
    @entityTypeName = @Utils.getDisplayEntityType(@type)
    @isInvestor = @Utils.isInvestor()
    @userMode = if @isInvestor then 'investor' else 'manager'
    @addedFieldsList = []
    @disclaimer_id = null
    @fieldTypesSource = [
      {text: 'Text', id: 'text'}
      {text: 'Paragraph', id: 'textmultiline'}
      {text: 'Integer', id: 'int'}
      {text: 'Numeric', id: 'numeric'}
      {text: 'Dropdown', id: 'dropdown'}
      {text: 'Link', id: 'link'}
      {text: 'CheckBox', id: 'checkbox'}
      {text: 'Dynamic', id: 'dynamic', hiddenFrom: 'rating'}
    ]

    @loadResponsesTypes()

    if @schema_format.dynamic
      @dynamicFieldSource = @schema_format.dynamic.format.allowed_subtype
      @dynamicFieldSource = _(@dynamicFieldSource).filter (source)=>
        source.hidden_from != @userMode


    if @editIndex > -1
      @params = angular.copy @existing_tags[@editIndex]
      @option = {
        responseType: null
        rows: []
        columns: []
        options: []
        dynamic_element: null
        attachmentUploadEnabled: false
      }
      @option.responseType = _(@fieldTypes).find (type)=>
        type.id == @params.type
      
      @params.description = @params.description

      if @params.type == 'dropdown' or @params.type == 'checkbox'
        options = _(@params.options).map (option)=>
          {
            id: option.id
            is_active: true
            text: option.value
            type: "text"
            type_options: {type: "text"}
          }
        @option.options = options
        
      @filterResponseTypes()
    else
      @option = {
        responseType: @fieldTypes[0]
        rows: []
        columns: []
        options: []
        dynamic_element: null
        attachmentUploadEnabled: false
      }
      @params = {
        has_multiple: false
        has_href: false
        is_mandatory: false
      }

  loadResponsesTypes: =>
    @fieldTypes = _(@fieldTypesSource).filter (field)=>
      !field.hiddenFrom or field.hiddenFrom != @source

  filterResponseTypes: =>
    currentResponseType = @option.responseType.id
    switch currentResponseType
      when 'int'
        response_types_to_allow = ['int','numeric', 'text']

      when 'numeric'
        response_types_to_allow = ['numeric', 'text']
    
      when 'dropdown'
        response_types_to_allow = ['dropdown', 'checkbox']

      when 'text'
        response_types_to_allow = ['text','textmultiline']

      else
        response_types_to_allow = [currentResponseType]

    if response_types_to_allow
      responseTypesFiltered = _(@fieldTypes).filter (responseType) ->
        responseType.id in response_types_to_allow

    if responseTypesFiltered
      @fieldTypes = responseTypesFiltered

  addAnotherField: =>
    @add_custom_tags.$setSubmitted()
    @save true
  
  resetForm: =>
    @add_custom_tags.$setPristine()
    @add_custom_tags.$setUntouched()
    @loadResponsesTypes()
    @option =
      responseType : @fieldTypes[0]
      rows: []
      columns: []
      options: []
      dynamic_element: null
      attachmentUploadEnabled: false
    @params = {
      has_multiple: false
      has_href: false
      is_mandatory: false
    }

  save: (anotherField)=>
    if @add_custom_tags.$valid
      if @editIndex > -1
        params = {}
        params.entity_type = if @typeId then @typeId else 0
        params.schema_type = @type
        params.entity_id = if @entityId then @entityId else 0
        innerObj = @params
        innerObj.type = @option.responseType.id
        if @option.responseType.id == 'textmultiline'
          innerObj.has_multiple = false
          innerObj.has_href = false
          innerObj.href = ""

        if @option.responseType.id == 'dropdown' or @option.responseType.id == 'checkbox'
          innerObj.has_multiple = false
          innerObj.has_href = false
          innerObj.href = ""
          innerObj.options = _(@option.options).map (option)=>
            id: option.id
            value: option.text
          oldOptions = @existing_tags[@editIndex].options
          _(oldOptions).each (option)=>
            if innerObj.options.findIndex((obj)=>
              obj.id == option.id
            ) == -1
              newOption = option
              newOption.status = 0
              innerObj.options.push newOption

          if @option.has_other_option
            if oldOptions
              #do this only if there are old options
              other_option = _(oldOptions).find (option) ->
                option.value.toLowerCase() is 'other'
            if !other_option or !oldOptions.length
              #if there are no other options already added in the options or if there are no old options
              innerObj.options.push({value:'Other', is_active: true, id: 0})

        if @option.responseType.id == 'dynamic'
          innerObj.sub_type = @params.sub_type
          innerObj.endpoint = ""

          innerObj.has_href = false
          innerObj.href = ""
        if @option.responseType.id == 'link'
          innerObj.has_href = false
          innerObj.href = ""
        params.custom_fields = [innerObj]
        if anotherField
          @savingAnother = true
        else
          @saving = true
        @Restangular.all('service/dvapi_service/update_custom_fields').post(params).then ((response) =>
          @addedFieldsList = response.custom_fields
          if anotherField
            @savingAnother = false
            @resetForm()
            @editIndex = -1
          else
            @saving = false
            @close @addedFieldsList
        ), (error) =>
          if anotherField
            @savingAnother = false
          else
            @saving = false
      else
        params = {}
        params.entity_type = if @typeId then @typeId else 0
        params.schema_type = @type
        params.entity_id = if @entityId then @entityId else 0
        params.custom_fields = []
        innerObj = {}
        innerObj.type = @option.responseType.id
        innerObj.has_multiple = @params.has_multiple
        innerObj.has_href = @params.has_href
        innerObj.href = @params.href if innerObj.has_href

        if @option.responseType.id == 'textmultiline'
          innerObj.has_multiple = false
          innerObj.has_href = false
          innerObj.href = ""
          
        if @option.responseType.id == 'dropdown' or @option.responseType.id == 'checkbox'
          innerObj.options = _(@option.options).map (option)=>
            value: option.text
            id: option.id
          innerObj.has_multiple = false
          innerObj.has_href = false
          innerObj.href = ""

          if @option.has_other_option
            innerObj.options.push({value:'Other', is_active: true, id: 0})

        if @option.responseType.id == 'link'
          innerObj.has_href = false
          innerObj.href = ""

        if @option.responseType.id == 'dynamic'
          innerObj.sub_type = @params.sub_type
          innerObj.endpoint = ""
          innerObj.has_href = false
          innerObj.href = ""

        innerObj.is_mandatory = @params.is_mandatory
        innerObj.description = @params.description
        innerObj.status = true
        innerObj.visible = 1
        innerObj.alias = @params.alias
        innerObj.value = ""
        params.custom_fields.push innerObj
        if anotherField
          @savingAnother = true
        else
          @saving = true
        @Restangular.all('service/dvapi_service/create_custom_fields').post(params).then ((response) =>
          @addedFieldsList = response.custom_fields
          if anotherField
            @savingAnother = false
            @resetForm()
          else
            @saving = false
            @close @addedFieldsList
        ), (error) =>
          if anotherField
            @savingAnother = false
          else
            @saving = false

  closeModal: =>
    if @addedFieldsList.length > 0
      @close @addedFieldsList
    else
      @close null