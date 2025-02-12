class AttachmentsViewController extends ModalController

  @register 'AttachmentsViewController'

  @inject '$uibModalInstance', 'email_id', 'Restangular', 'toaster', 'DocumentDataservice'

  initialize: ->
    @DocumentDataservice.getDocuments('Email',@email_id).then (response) =>
      @attachments = response.results
  
  openAttachment: (id) ->
    @DocumentDataservice.getSignedEmailAttachmentUrl(id).then (response) =>
      @url = response
      $link = $("<a href=\"#{@url}\" target='_blank' class='hidden'></a>")
      $('body').append($link)
      $link[0].click()
      $link.remove()

  
  