angular.module('diligenceVault').factory 'WizardHandler', ->

  new class WizardHandler
    constructor: ->
      @wizards = {}
      @defaultName = 'defaultWizard'

    addWizard: (name, wizard) ->
      @wizards[name] = wizard

    removeWizard: (name) ->
      delete @wizards[name]

    getWizard: (wizard_name) ->
      wizard_name = wizard_name or @defaultName

      @wizards[wizard_name]
