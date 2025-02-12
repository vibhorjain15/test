class DvAuditController extends BaseController
  @register 'DvAuditController'

  @inject '$attrs', '$scope', 'Restangular','$rootScope'
  
  # This is a directive for audit trail
  # Currently set for diligence entitytype. Pass entity_id attribute
  # Implementation: <dv-audit entity-id="vm.diligenceId"></dv-audit>
  
  initialize: ->
    @$rootScope.$on 'update:audit', (event) =>
      @getAudit()
      
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityId], (values) =>
      if values[0]
        @entity_id = values[0]
        @getAudit()
        deregisterer()
  
  getAudit: ->
    @Restangular.all('audit').getList(entity_id: @entity_id).then (response) =>
      @audit = response   