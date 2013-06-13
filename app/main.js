// Filename: main.js

// Require.js allows us to configure mappings to paths
// as demonstrated below:

var dir = "../js/lib/";


require.config({

//  baseUrl: "../js/lib/",

  paths: {
//    twitterBootstrap: dir + 'bootstrap.min',
    jquery                  : dir + 'jquery/jquery',
    underscore              : dir + 'underscore/underscore',
    backbone                : dir + 'backbone/backbone',
    Raphael                 : dir + 'raphael-eve/raphael',
    RaphaelFreeTransform    : dir + 'raphael-free-transform/raphael.free_transform',
    jqueryForm              : dir + 'jquery-form/jquery.form',
    text                    : dir + 'requirejs-text/text',
    cs                      : dir + 'require-cs/cs',
    benchmark               : dir + 'benchmark-js/benchmark',
    jasmine                 : dir + 'jasmine/lib/jasmine-core/jasmine'
  },

  shim: {

    jquery: {
      exports: '$'
    },

    underscore: {
      exports: '_'
    },

    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },

    jQueryForm: {
      deps: ['jquery']
    },

    Raphael: {
      exports: 'Raphael'
    },

    RaphaelFreeTransform: {
      deps: ['Raphael'],
      exports: 'Raphael'
    }

//    twitterBootstrap: {
//      deps: ["jquery"]
//    },

  }

});



require(['backbone', 'cs!app'], function(Backbone, App){
  console.log('REQUIRE')

//  window.Router = Backbone.Router.extend({
//routes: {
//'p/:param1': 'product',
//'!/products': 'products',
//'!/profile': 'profile',
//'!/admin': 'admin',
//'search': 'search',
//'': "main",
//'*action': "dd"
//},
//main: function() {
//  console.log('')
//  console.log('main')
//},
//product: function(item) {
//  console.log('prod', item)
//},
//dd: function() {
//  console.log('dd')
//},
//admin: function() {
//},
//search: function() {
//  console.log("search")
//},
//profile: function() {
//}
//});
//window.router = new Router;
//return Backbone.history.start({
//    pushState: true
//}

//);






    var AppRouter = Backbone.Router.extend({
    routes: {
      "posts/:id": "defaultRoute",
      "*actions": "defaultRoute"
    }
    });
    // Instantiate the router
    var app_router = new AppRouter;
    app_router.on('route:defaultRoute', function (actions) {
        console.log("any action", actions );
        app_router.navigate("help/troubleshooting", {trigger: true, replace: false});
     });
    // Start Backbone history a necessary step for bookmarkable URL's
  window.app = new App;
  Backbone.history.start({
//    pushState: true,
    root: location.pathname
  });
});

