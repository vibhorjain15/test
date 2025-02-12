angular.module('diligenceVault').factory 'DocumentsService', (Restangular, toaster,PopupCheckerService,$http) ->
  new class DocumentsService

    documentPageUrl = ""

    formatTagsTooltip: (tagsList) ->
      if tagsList and tagsList.length > 1
        return  _(tagsList).tail().join(', ')

    setDocumentPageUrl: (url) ->
      documentPageUrl = url

    getDocumentPageUrl: ->
      documentPageUrl

    documentGroupName: (grid, row, col) ->
      if(row.groupHeader && row.treeNode.children[0])
        entity = row.treeNode.children[0].row.entity
        group = if entity.group_names.length then entity.group_names?.join() else 'Ungrouped'
        return group

      return row.entity.name

    getDocumentGroupName: (grid, row, col) ->
      entity = row.entity
      group = if entity.group_names.length then entity.group_names?.join() else 'Ungrouped'
      return group

    getGroupHeaderName: (grid,row,col) ->
      #Hack to display the group header name. when the grouping has null values. It was not displaying the
      #group name properly. this logic iterates through the treenode aggregations array and displays the group name
      #only if groupVal is not empty otherwise we generate custom groupname
      for i in [0...row.treeNode.aggregations.length]
        agg = row.treeNode.aggregations[i]
        if agg.groupVal
          if agg.groupVal.length > 0
            return agg.rendered
          else
            return "Ungrouped("+agg.value+")"

    getSignedURL: (entity) ->
      toaster.pop 'info', '', 'Opening the requested document.'
      id = if entity.attachment_id then entity.attachment_id else entity.id
      Restangular.one('attachments', id ).one('signed_url').get().then (response) =>
        popup = window.open(response, '_blank')
        PopupCheckerService.check(popup)

    downloadAttachment: (url)->
      $http({
        url: url,
        responseType: 'arraybuffer',
        method: "GET"
      }).then (response) =>
        octetStreamMime = 'application/octet-stream'
        success = false
        # Get the headers
        headers = response.headers()
        # Get the filename from the x-filename header or default to "download.bin"
        contentDisposition = response.headers('Content-Disposition')
        filename_from_header = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim().replace(/\"/g, "")
        filename = filename_from_header or 'download.xlsx'
        # Determine the content type from the header or default to "application/octet-stream"
        contentType = headers['content-type'] or octetStreamMime
        try
        # Try using msSaveBlob if supported
          blob = new Blob([ response.data ], type: contentType)
          if navigator.msSaveBlob
            navigator.msSaveBlob blob, filename
          else
            # Try using other saveBlob implementations, if available
            saveBlob = navigator.webkitSaveBlob or navigator.mozSaveBlob or navigator.saveBlob
            if saveBlob == undefined
              throw 'Not supported'
            saveBlob blob, filename
          success = true
        catch ex
          # we need to add log this error to slack rather than printing it on browser console
          # console.log 'saveBlob method failed with the following exception:'
          # console.log ex
        if !success
          # Get the blob url creator
          urlCreator = window.URL or window.webkitURL or window.mozURL or window.msURL
          if urlCreator
            # Try to use a download link
            link = document.createElement('a')
            if 'download' of link
              # Try to simulate a click
              try
              # Prepare a blob URL
                blob = new Blob([ response.data ], type: contentType)
                url = urlCreator.createObjectURL(blob)
                link.setAttribute 'href', url
                # Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
                link.setAttribute 'download', filename
                # Simulate clicking the download link
                event = document.createEvent('MouseEvents')
                event.initMouseEvent 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null
                link.dispatchEvent event
                success = true
              catch ex
                # we need to add log this error to slack rather than printing it on browser console
                # console.log 'Download link method with simulated click failed with the following exception:'
                # console.log ex
            if !success
              # Fallback to window.location method
              try
              # Prepare a blob URL
              # Use application/octet-stream when using window.location to force download
                blob = new Blob([ response.data ], type: octetStreamMime)
                url = urlCreator.createObjectURL(blob)
                window.location = url
                success = true
              catch ex
                # we need to add log this error to slack rather than printing it on browser console
                # console.log 'Download link method with window.location failed with the following exception:'
                # console.log ex
        if !success
          # Fallback to window.open method
          popup = window.open httpPath, '_blank', ''
          PopupCheckerService.check(popup)
