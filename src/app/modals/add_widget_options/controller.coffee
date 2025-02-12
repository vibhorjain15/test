class AddWidgetOptionsController extends ModalController
  @register 'AddWidgetOptionsController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'existing_widget'

  initialize: ->
    @FundIdType = 1219
    @FirmIdType = 1220
    @VehicleIdType = 1217
    @editMode = false
    @option = {
      responseType: null
      rows: []
      columns: []
      options: []
      allow_other_option: false
      dynamic_element: null
      attachmentUploadEnabled: false
    }
    @ContactsIdType = 1218
    @DiligenceType = 1105
    @disclaimer_id = null
    @fildTypes = [
      {text: 'Dropdown', id: 'dropdown'}
      {text: 'Date', id: 'date'}
    ]
    @params = {}
    if @existing_widget
      @params.alias = @existing_widget.name
      @editMode = true
      @option.responseType = _(@fildTypes).findWhere({id: @existing_widget.type})
      if @existing_widget.type == "dropdown"
        for option in @existing_widget.type_options
          @option.options.push {text: option}


  submit: =>
    params =
      'name': @params.alias
      'type': @option.responseType.id
      'type_options': _(@option.options).pluck 'text'
    @saving = true
    if params.type == 'date'
      delete params.type_options
    if @editMode
      params.id = @existing_widget.id
      params.is_active = true
      @Restangular.one('widgets', @existing_widget.id).customPUT(params).then ((response) =>
        @saving  = false
        @close response
      ), (error) =>
        @saving  = false
    else
      @Restangular.all('widgets').post(params).then ((response) =>
        @saving  = false
        @close response
      ), (error) =>
        @saving  = false
