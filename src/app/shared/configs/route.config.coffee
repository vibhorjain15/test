angular.module('diligenceVault').config ($stateProvider) ->
  isRoutable = (accessible_to, hidden_from, grant_map) ->
    is_accessible = true

    if accessible_to
      is_accessible = is_accessible and _(accessible_to).any((role) ->
        grant_map[role]
      )

    if hidden_from
      is_accessible = is_accessible and !_(hidden_from).any((role) ->
        grant_map[role]
      )

    is_accessible


  $stateProvider.conditionalState = (state_name, options, args...)->
    sanitized_options = undefined #Options that comply with the format of ui router
    custom_attrs = ['templateForInvestor', 'templateForManager',
                    'controllerForManager', 'controllerForInvestor']

    onEnter = (Utils, $state) ->
      "ngInject"
      unless isRoutable(accessible_to, hidden_from, Utils.getGrantMap())
        $state.go 'app.home'

      if _.isFunction(_onEnter)
        _onEnter.apply this, arguments

    addProvidersToConfig = (orig_config) ->
      config = _(orig_config).omit(custom_attrs)

      if orig_config.controllerForInvestor or orig_config.controllerForManager
        config.controllerProvider = getControllerProvider(orig_config)

      if orig_config.templateForInvestor or orig_config.templateForManager
        config.templateProvider = getTemplateProvider(orig_config)

      config

    getControllerProvider = (orig_config) ->
      (Utils) ->
        "ngInject"
        if Utils.isInvestor()
          return orig_config['controllerForInvestor']
        else if Utils.isManager()
          return orig_config['controllerForManager']

    getTemplateProvider = (orig_config) ->
      (Utils, $templateCache, $q) ->
        "ngInject"
        currentUser = Utils.getCurrentUser()
        # We need a promise here because, we cannot determine if the user is manager/investor until
        # the logged in user is loaded
        promise = undefined

        if angular.isFunction(currentUser.then)
          promise = currentUser
        else
          deferred = $q.defer()
          promise = deferred.promise
          deferred.resolve()

        promise.then ->
          if Utils.isInvestor()
            return $templateCache.get(orig_config['templateForInvestor'] or orig_config['templateUrl'])
          else if Utils.isManager()
            return $templateCache.get(orig_config['templateForManager'] or orig_config['templateUrl'])

    if options.views
      _(options.views).each (val, key) ->
        options.views[key] = addProvidersToConfig(val)

      sanitized_options = options
    else
      sanitized_options = addProvidersToConfig(options)

    args.unshift sanitized_options
    args.unshift state_name

    if sanitized_options.accessible_to or sanitized_options.hidden_from
      @authorizedState.apply this, args
    else
      @state.apply this, args

  $stateProvider.authorizedState = ->
    config = arguments[1]
    accessible_to = config.accessible_to
    hidden_from = config.hidden_from
    _onEnter = config.onEnter

    onEnter = (Utils, $state) ->
      "ngInject"
      unless isRoutable(accessible_to, hidden_from, Utils.getGrantMap())
        $state.go 'app.home'

      if _.isFunction(_onEnter)
        _onEnter.apply this, arguments

    delete config.accessible_to
    delete config.hidden_from
    config.onEnter = onEnter

    @state.apply this, arguments

  $stateProvider.modalState = (state_name, options, args...) ->
    modalConfig = options.data.modalConfig

    options.onEnter = (ModalFactory) ->
      "ngInject"
      ModalFactory.invokeModal(modalConfig.name)

    @state.apply(@, arguments)
