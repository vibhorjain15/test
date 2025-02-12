angular.module('diligenceVault').factory 'GridStateDataService', (Restangular) ->

  new class GridStateDataService

    allGridStates = {}

    getGridState : (name)=>
      if allGridStates[name]
        JSON.parse(allGridStates[name])
      else
        null

    loadAllStates : =>
      Restangular.all('GridStates').doGET(null, '',{'page-url': 'GridStates'}).then (response)=>
        allGridStates = response

    saveState : (name, state)=>
      params = {}
      params[name] = JSON.stringify(state)
      Restangular.all('GridStates').customPUT(params).then (response)=>
        allGridStates[name] = response