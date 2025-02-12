class AlertBouncedContactsController extends ModalController

  @register 'AlertBouncedContactsController'

  @inject '$uibModalInstance', 'Restangular', 'toaster', 'contactsList', 'entitiesList'

  initialize: ->
    # bounced entities
    @bouncedEntities = []
    @bouncedEntitiesList = []
    @allEntities = []
    @estimatedEntitiesRecipients = []
    @showBouncedEntitiesList = false
    @entityType = @entitiesList.entity_type
    # bounced contacts
    @bouncedContacts = []
    @bouncedContactsList = []
    @allContacts = []
    @estimatedRecipients = []
    @showBouncedContactsList = false

    # Bounced Entities
    angular.forEach @entitiesList.all, (entity) =>
      unless _.contains(@allEntities, entity.id)
        @allEntities.push entity.id
    angular.forEach @entitiesList.bounced, (entity) =>
      unless _.contains(@bouncedEntities, entity.id)
        @bouncedEntities.push entity.id
        @bouncedEntitiesList.push entity
    # Bounced Contacts
    angular.forEach @contactsList.all, (contact) =>
      unless _.contains(@allContacts, contact.id)
        @allContacts.push contact.id
    angular.forEach @contactsList.bounced, (contact) =>
      unless _.contains(@bouncedContacts, contact.id)
        @bouncedContacts.push contact.id
        @bouncedContactsList.push contact

  cancel: () ->
    @close('canceled')

  userClickedOk: () ->
    @close("closed")

  learnMore: () ->
    @showBouncedContactsList = true

  learnMoreEntities: () ->
    @showBouncedEntitiesList = true

  numberWithCommas: (number) ->
    number.toString().replace /\B(?=(\d{3})+(?!\d))/g, ','
