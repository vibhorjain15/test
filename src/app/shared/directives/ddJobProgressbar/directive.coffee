angular.module('diligenceVault').directive 'ddJobProgressbar', ->
  restrict: 'E'
  scope: true
  controller: 'DDJobProgressbarController'
  controllerAs: 'vm'
  template: ->
    """
      <uib-progressbar value="vm.progress"
                       type="success"
                       class="progress-striped active">
      </uib-progressbar>
    """
