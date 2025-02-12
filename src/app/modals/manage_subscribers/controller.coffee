class ManageSubscribersDialogController extends ModalController

  @register 'ManageSubscribersDialogController'

  @inject 'Restangular', 'diligence', 'Utils'

  initialize: ->
    @current_user = @Utils.getCurrentUser()
    @getFunctions()
    @getRelatedDiligences()

  getFunctions: =>
    @Restangular.all('function_assignments').getList({entity_id:@current_user.firmInfo.id,entity_type:'Firm'}).then (response)=>
      @functions = response

  getRelatedDiligences: =>
    @related_diligences = []
    @Restangular.one('diligences',@diligence.id).getList('linked_projects').then ((response) =>
      @related_diligences = response
    )

  onSave: ->
    @close()
