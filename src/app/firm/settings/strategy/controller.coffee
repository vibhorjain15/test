class FirmSettingsStrategyController extends BaseController
  @register 'FirmSettingsStrategyController'

  @inject 'Restangular', '$q', 'SweetAlert', 'Utils', '$stateParams', '$scope', 'toaster', '$avoidFirstSplCharRegex', 'ModalFactory','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @loadStrategies()
    @systemStrategies = []
    @strategies = []

  loadStrategies: (type) ->
    @loading = true
    @Restangular.all('strategies ').getList().then (response) =>
      @allStrategies = response
      @groupStrategy()
      @loading = false


  groupStrategy: () =>
    @allStrategies = _(@allStrategies).sortBy((strategy) =>
      strategy.name.toLowerCase()
    )

    @systemStrategies = []
    @strategies = []
    _(@allStrategies).each (strategy, i) =>
      if strategy.is_system
        @systemStrategies.push(strategy)
      else
        @strategies.push(strategy)


  displayTagRemovalConfirmation: (strategy, index) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{strategy.name}\"?"
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeStrategy(strategy, index) if isConfirm.value and isConfirm.value == true

  removeStrategy: (strategy, index)->
    params = []
    strategy.is_active = false
    params.push strategy
    @Restangular.all('strategies').customPUT(params).then =>
      @toaster.pop 'success', 'Strategy removed successfully!'
      @allStrategies.splice @allStrategies.indexOf(strategy), 1
      @groupStrategy()

  addNewStrategy: =>
    @ModalFactory.invokeModal 'add_strategy',
      resolve:
        strategies: => @strategies
        strategy: => null
      success: (response) =>
        @allStrategies = response
        @groupStrategy()

  editStrategy: (strategy, index) =>
    @ModalFactory.invokeModal 'add_strategy',
      resolve:
        strategies: => null
        strategy: => strategy
      success: (response) =>
        @strategies[index] = response
