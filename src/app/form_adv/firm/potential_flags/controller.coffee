class FormADVFlagsController extends BaseController
  @register 'FormADVFlagsController'

  @inject 'Restangular', '$state', '$stateParams', 'Utils'

  initialize: ->
    @firmCRD = @$stateParams.firmCRD
    @displayFlags = (@Utils.isFormADVAnalyticsSubscription() or @Utils.isProductiveSubscription() or @Utils.isSmartSubscription())
    
    @Restangular.one('formadv_firms', @firmCRD).get().then (response) =>
      @formadv_firm = response
    
    if @displayFlags  
      @Restangular.one('formadv_flags', @firmCRD).get().then (response) =>
        @flags = response
        if @flags.length
          @groupFlags()

  groupFlags: () =>
    @grouped_flags = []
    @grouped_flags = _(@flags).groupBy((flag) ->
      flag.type
    )

    @grouped_flags = _(@grouped_flags).map((flags, type) ->
      {
        type: type
        flags: flags
      }
    )


  
      
      


