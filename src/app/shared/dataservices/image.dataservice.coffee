angular.module('diligenceVault').factory 'ImageDataService', (Restangular, Upload, baseUrl, $q) ->
  new class ImageDataService
    uploadImage: (files) ->
      promise = Upload.upload
        url: baseUrl + '/images'
        file: files

      promise.then (response) ->
        _(response).each @processImage

      promise

    getImages: (params) ->
      Restangular.all('images').customGET('', params).then (response) =>
        _(response.results).each @processImage

        response

    processImage: (image) ->
      image.insertTimeStamp = new Date(image.insertTimeStamp)

      image

    getImage: (id) ->
      Restangular.one('images', id).get()

    deleteImage: (id) ->
      Restangular.one('images', id).remove()
