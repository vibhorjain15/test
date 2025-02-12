class ViewRelatedDiligenceController extends ModalController

  @register 'ViewRelatedDiligenceController'

  @inject '$uibModalInstance', 'diligence', 'BaseDataService', 'RestangularHeaderService','keywordConstants','SweetAlert','DueDiligenceDataservice','$q','$state','toaster','Utils','disabled','disabledTooltip','DiligenceDataSaveService','$rootScope','$timeout'

  initialize: ->
    @canSubmit = true
    is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()
    @options =
      mode: if is_investor then 'investor' else 'manager'
    @getRelatedDiligences()

  getRelatedDiligences: ->
    @loading = true
   
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('diligences',@diligence.id).getList('linked_projects',{include_counts:true}).then ((response) =>
      @diligences = response
      @canSubmit = _(@diligences).reduce((canSubmit, project)=>
        canSubmit and (project.percentage_completed > 0 || project.status == 'Completed')
      ,true)
      @loading = false
    ), ((error) =>
      @loading = false
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Not able to fetch related projects', error)
    )

  showConfirmationDialog: =>
    pct_complete = @diligence.percentage_completed #need to fetch latest values as this is picking from initial page load
    messageText = ""
    if pct_complete == 0
      messageText = 'Did you click this by mistake? You are yet to start answering.'
    else if pct_complete < 50
      messageText = 'You have only partially completed this questionnaire, less than 50% of the questions, which is below industry average.'
    else if pct_complete < 75
      messageText = 'Great effort in completing the questionnaire. Although, it is still less than 75% complete, and below industry average.'
    else if pct_complete < 100
      messageText = 'You are almost there! Only a few % more, and you will be at 100%.'
    @SweetAlert.confirm({
      title: 'Are you sure you want to submit this for investor review? You will not be able to make any more edits'
      text: messageText
      confirmButtonText: 'Yes, please submit!'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @submitAllDiligences()
    }).then (isConfirm)=>
      if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
        @$timeout =>
          @submitting_diligence = false

  submitAllDiligences: =>
    promises = []
    _(@diligences).each (project)=>
      if project.status != 'Completed'
        promises.push @DueDiligenceDataservice.setStatus(project.id, 'Completed')

    @$q.all(promises).then =>
      @DueDiligenceDataservice.setStatus(@diligence.id, 'Completed').then (response)=>
        @toaster.pop 'success','','Sent to investor for review'
        @close()
        @submitting_diligence = false
        @$state.go 'app.diligence.projects.activity', type: 'in-progress'
        swal.close()
      ,(error)=>
        @submitting_diligence = false
        if error.status == 400
          @SweetAlert.error({
            title: error.data.message
            confirmButtonText: 'Okay'
          })
        else
          swal.close()
    ,(error)=>
      @submitting_diligence = false
      if error.status == 400
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: 'Okay'
        })
      else
        swal.close()

  submit: =>
    if @canSubmit && !@disabled
      @submitting_diligence = true
      unsaved_count = @DiligenceDataSaveService.unsaved_count
      messageText = "You have #{unsaved_count} unsaved change#{if unsaved_count is 1 then '' else 's' }"
      if unsaved_count
        @SweetAlert.confirm({
          title: "Are you sure you want to submit? You have unsaved changes."
          text: "#{messageText}"
          cancelButtonText: 'Submit without saving'
          confirmButtonText: 'Save & Submit'
          customClass: 'danger-on-cancel'
          showCloseButton: true
          reverseButtons: false
          showLoaderOnConfirm: true
          preConfirm: =>
            leaving_state = true
            response = @DiligenceDataSaveService.commitUnsavedChanges(true)
            if response?.then?
              response.then =>
                swal.close()
                @submitAllDiligences()
              ,(error)=>
                swal.close()
                @submitting_diligence = false
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @$rootScope.$emit 'response:revert'
            @submitAllDiligences()
      else
        @showConfirmationDialog()
      
          