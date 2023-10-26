sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("com.nimsoc.demo.controller.SubView1", {
		onButtonPress:function(){
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("SubView1", "ShowPopup", { text:"Demo text 1" });
		}
	});

});