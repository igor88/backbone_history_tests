define [
  'jquery'
  'underscore'
  'backbone'
  'cs!views/main'
], ($, _, Backbone, MainView) ->

  class App extends Backbone.Router

    constructor: ->
      super

    routes:
      '': 'index'

    index: ->
      @currentView = new MainView()

