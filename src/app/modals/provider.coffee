class ModalFactoryProvider
  constructor: ->
    @modalConfigMap = {}

  registerModal: (name, config) ->
    defaults =
      templateUrl: "modals/#{name}/template.html"
      controllerAs: 'vm'
    @modalConfigMap[name] = _.extend {}, defaults, config

  $get: ($uibModal, $rootScope) ->
    "ngInject"
    activeModals = []

    getModalConfig = (name) =>
      $.extend(true, {}, @modalConfigMap[name])

    invokeModal = (name, options={}) ->
      config = _({}).extend(getModalConfig(name), _(options).omit('resolve'))

      if config.resolve?
        _(config.resolve).extend(options.resolve)
      else
        config.resolve = options.resolve

      success_callback = config.success
      dismiss_callback = config.dismiss
      modalInstance = $uibModal.open(config)

      activeModals.push modalInstance

      modalInstance.result.then success_callback if success_callback?
      modalInstance.result.then null, dismiss_callback if dismiss_callback?

      modalInstance.result.finally -> # We don't want memory leaks, do we?
        $rootScope.$broadcast('modal.closed')
        activeModals.splice activeModals.indexOf(modalInstance), 1

      modalInstance.opened.then ->
        $rootScope.$broadcast('modal.opened')

      modalInstance

    closeAllActiveModals = ->
      _(activeModals).each (modalInstance) ->
        modalInstance.dismiss 'cancel'

    {
      invokeModal: invokeModal,
      closeAllActiveModals: closeAllActiveModals
    }


angular
  .module('diligenceVault')
  .provider 'ModalFactory', ModalFactoryProvider
