var xframe = (function(window, _, postal) {
  var XFRAME = "xframe";
  var _defaults = {
    autoReciprocate : true,
    allowedOrigins  : [ window.location.origin ],
    enabled         : true,
    originUrl       : window.location.origin
  };
  var _config = _defaults;

  var plugin = {

    config: function(cfg){
      if(cfg) {
        _config = _.defaults(cfg, _defaults);
      }
      return _config;
    },

    clientOptionsFromEvent : function(event) {
      var self = this;
      var payload = event.data;
      var clientOptions = {
        id       : payload.instanceId,
        type     : XFRAME,
        send     : function(payload) {
          event.source.postMessage(payload, _config.originUrl || "*");
        }
      };
      if(_config.autoReciprocate){
        clientOptions.postSetup = function() {
          postal.fedx.clients[payload.instanceId].send(postal.fedx.getFedxWrapper("ready"), XFRAME);
        }
      }
      return clientOptions;
    },

    getTargets: function() {
      var targets = _.map(document.getElementsByTagName('iframe'), function(i) { return i.contentWindow; });
      if(window.parent && window.parent !== window) {
        targets.push(window.parent);
      }
      return targets;
    },

    onPostMessage: function( event ) {
      console.log(event.data);
      if(this.shouldProcess(event)) {
        var payload = event.data;
        if(payload.type === 'ready') {
          postal.fedx.addClient(this.clientOptionsFromEvent(event));
        } else {
          postal.fedx.onFederatedMsg( payload, payload.instanceId );
        }
      }
    },

    shouldProcess: function(event) {
      var hasDomainFilters = !!_config.allowedOrigins.length;
      return _config.enabled && (hasDomainFilters && _.contains(_config.allowedOrigins, event.origin) || !hasDomainFilters ) && (event.data.postal)
    },

    signalReady: function(manifest) {
      _.each(this.getTargets(), function(target) {
        target.postMessage(postal.fedx.getFedxWrapper("ready"),  _config.originUrl || "*");
      });
    }
  };

  _. bindAll(plugin);

  postal.fedx.transports.xframe = plugin;

  window.addEventListener("message", plugin.onPostMessage, false);

}(window, _, postal));