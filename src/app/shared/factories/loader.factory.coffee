angular.module('diligenceVault').factory 'loader', ->

  new class Loader
    remove: ->
      angular.element('#loader').remove()
