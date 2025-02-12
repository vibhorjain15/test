class AddStrategyController extends ModalController
  @register 'AddStrategyController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'strategy', 'strategies'

  initialize: ->
    @strategyObj = []
    @false = true
    @existingStrategies = []
    @strategyEditObj = {}
    if @strategies
      @existingStrategies = @strategies
    if @strategy
      @strategyEditObj = angular.copy @strategy
      @edit_mode = true

  validateExistingStrategy: =>
    isValid = true
    for strategy in @strategyObj
      duplicate_name = null
      for existing in @existingStrategies
        if strategy.name == existing.name
          duplicate_name = strategy.name
          break
      if duplicate_name
        @toaster.pop 'error', duplicate_name + ' aready exist in custom classifications.'
        isValid = false
        break
    return isValid

  validateDuplicates: (array) =>
    isValid = true
    new_strategies = []
    for strategyObj in array
      if new_strategies.indexOf(strategyObj.name) == -1
        new_strategies.push strategyObj.name
      else
        @toaster.pop 'error', 'Please remove duplicate classification ' + strategyObj.name
        isValid = false
        break
    isValid



  save: ->
    if @strategy_form.$valid
      if @validateExistingStrategy() and @validateDuplicates(@strategyObj)
        @saving = true
        if @edit_mode
          @strategyEditObj.is_active = true
          params = [angular.copy @strategyEditObj]
        else
          params = angular.copy @strategyObj
        @Restangular.all('strategies').customPUT(params).then((response) =>
          @toaster.pop 'success', 'Classification successfully added!'
          if @edit_mode
            @$uibModalInstance.close @strategyEditObj
          else
            @$uibModalInstance.close response
          @saving = false
        ).finally =>
            @saving = false
