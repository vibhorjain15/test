angular.module('diligenceVault').config (DashboardFactoryProvider) ->
  DashboardFactoryProvider.registerWidget 'doc_tracker',
    controller: 'DocTrackerController'
    controllerAs: 'vm'
    resolve:
      documents: (options) ->
        options.resource.getList().then (response) ->
          _(response).map (document) ->
            {
              name: document.fileInfo.attachmentName
              updated_date: moment(document.asOfDate).format('DD-MMMM-YYYY')
            }
