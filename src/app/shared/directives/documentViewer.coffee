angular.module('diligenceVault').directive 'documentViewer', (Restangular, toaster, SidebarViewService, Utils) ->
  restrict: 'A'
  compile: (cElem) ->
    if cElem[0].tagName is 'A'
      cElem.attr('role', 'button')

    (scope, element, attrs) ->
      dd_document = null
      sidebar = null

      scope.$on '$destroy', ->
        sidebar?.close()

      scope.$watch attrs.documentViewer, (value) ->
        if value?
          dd_document = value

      loading_document = false

      openSidebar = (signed_url) ->
        sidebar = SidebarViewService.open({
          templateUrl: 'sidebars/document_viewer/template.html'
          controller: 'SidebarDocumentViewerController'
          controllerAs: 'vm'
          title: dd_document.type_name
          size: 'xl',
          resolve:
            dd_document: dd_document
            signed_url: -> signed_url
        })

      openNewTab = (url) ->
        $link = $("<a href=\"#{url}\" target='_blank' class='hidden'></a>")
        $('body').append($link)
        $link[0].click()
        $link.remove()

      element.on 'click.dd_document', ->
        is_doc_to_html_enabled = Utils.isDocToHtmlEnabled()
        if is_doc_to_html_enabled
          unless dd_document.is_image or dd_document.html_filename?
            message = "Requested document is being processed, please try after some time"

            toaster.pop 'warning', '', message

            return

        return if loading_document

        toaster.pop 'wait', '', 'Please wait...', 500000
        loading_document = true

        attachmentId = if (dd_document.attachment_id) then dd_document.attachment_id else dd_document.id

        Restangular
          .one('attachments', attachmentId)
          .one('signed_url', null)
          .get()
          .then((response) ->
            if is_doc_to_html_enabled
              openSidebar(response)
            else
              openNewTab(response)
          ).finally(->
            toaster.clear()
            loading_document = false
          )

      scope.$on '$destroy', ->
        element.off 'click.dd_document'
