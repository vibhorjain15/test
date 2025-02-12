## TODO: Add documentation
angular.module('diligenceVault').factory 'BulkQueryFactory', ($log, $q) ->
  class QueryBucket
    constructor: (options) ->
      @id_property = options.id_property
      @requests = {}
      @requests_map = {}
      @listener_map = {}

      unless @id_property
        $log.error('Please provide a id_property in the options')

    getEntitiesForMethod: (method) ->
      @requests[method] || []

    add: (entity, method) ->
      unless @requests_map[method]?
        @requests[method] = []
        @requests_map[method] = {}

      id = entity[@id_property]
      list = @requests[method]
      list_map = @requests_map[method]

      return if list_map[id]?

      list_map[id] = true
      list.push(entity)

      @notifyListeners(entity, 'add', method)

    remove: (entity, method) ->
      id = entity[@id_property]
      list = @requests[method]
      list_map = @requests_map[method]

      return if !list_map or !list_map[id]?

      list.splice(list.indexOf(entity), 1)
      list_map[id] = undefined

      @notifyListeners(entity, 'remove', method)

    on: (event_name, listener) ->
      events = event_name.split(" ")

      angular.forEach events, (event_name) =>
        unless @listener_map[event_name]
          @listener_map[event_name] = []

        @listener_map[event_name].push(listener)

    notifyListeners: (entity, action, method) ->
      listeners = @listener_map["#{action}:#{method}"]

      if listeners?.length
        angular.forEach listeners, (listener) ->
          listener(entity, action, method)

    sync: (methods...) ->
      promises = []

      angular.forEach methods, (method) =>
        entities = @requests[method]

        _(entities).each (entity) ->
          # method is supposed to return a promise
          promises.push entity[method].call(entity)

      $q.all(promises).then (response) =>
        _(methods).each (method) =>
          if @requests[method]?
            @requests[method].length = 0 #clearing an array LIKE A BOSS 😎
            @requests_map[method] = {}

        response
      ,(error) =>
        #no error handling here, just propagate the error again to the higher levels
        throw error

  new class BulkQueryFactory
    $new: (options) ->
      new QueryBucket(options)
