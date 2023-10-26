sap.ui.define([
		'sap/m/MessageBox',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/json/JSONModel',
		'sap/ui/core/util/Export',
		'sap/ui/core/util/ExportTypeCSV',
		'sap/ui/model/Sorter',
		'sap/ui/model/resource/ResourceModel',
		"sap/ui/core/syncStyleClass",
		"sap/m/MessageToast",
		"sap/ui/model/Filter",
	    "sap/ui/model/FilterOperator",
		"sap/m/Dialog",
		"sap/m/List",
		"sap/m/StandardListItem",
		"sap/m/Button",
		"sap/m/library",
	], function(MessageBox, Controller, JSONModel, Export, ExportTypeCSV, Sorter, ResourceModel, syncStyleClass, MessageToast, Filter, FilterOperator, Dialog, 
		List,StandardListItem, Button, mobileLibrary) {
	"use strict";

	var appController = Controller.extend("com.nimsoc.demo.controller.App", {

		onInit : function() {
			var oModel = new JSONModel({'searchToken': 'Tur', 'ascending': true});
			this.getView().setModel(oModel, "searchModel");
			
			var dModel = new JSONModel();
			this.getView().setModel(dModel, "dataModel");

			this.loadI18n();

			this.loadData();

			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("SubView1", "ShowPopup", this.onShowPopup, this);
			oEventBus.subscribe("SubView2", "ShowPopup", this.onShowPopup, this);
		},

		onShowPopup : function (sChanel, sEvent, oData) {
			if(sEvent === "ShowPopup"){
				var msg = "Message from: "+sChanel+" - Event: "+sEvent+" - "+oData.text;
			}else{
				msg = "Message from: Main View ";
			}
			
			MessageBox.information(	msg );
		},

		onExit: function() {
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.unsubscribe("SubView1", "ShowPopup", this.onShowPopup, this);
			oEventBus.unsubscribe("SubView2", "ShowPopup", this.onShowPopup, this);
		},

		loadI18n: function() {
			var i18nmodel = new ResourceModel({bundleName : 'com.nimsoc.demo.i18n.i18n'})
			this.getView().setModel(i18nmodel, "i18n");
		},

		//https://restcountries.com/v3.1/name/G

		loadData: function() {
			$.getJSON(
				"https://restcountries.com/v3.1/name/" + encodeURIComponent(this.getView().getModel("searchModel").getProperty("/searchToken"))
			).done(function(data){
				//console.log("Loaded data: ", data);
				this.getView().getModel("dataModel").setData(data);
				
			}.bind(this)).always(function() {
				//this.getView().byId('btnSearch').setBusy(false);
				this.getView().setBusy(false);
			}.bind(this));
			
		},
		handleButtonPress: function(event) {
			//event.getSource().setBusy(true); //u can call setBusy on getView()
			this.getView().setBusy(true);
			this.loadData();
		},

		getLanguages: function(obj) {
			if (obj) {
				//return Object.values(obj).join(','); or ... use the 
				let result = [];
				for (let key in obj) {
					result.push(obj[key]);
				}
				return result.join(' / ');
			}
			return 'N/A'
		},

		onDataExport : function(oEvent) {

			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType : new ExportTypeCSV({
					separatorChar : ";"
				}),

				// Pass in the model created above
				models : this.getView().getModel("dataModel"),

				// binding information for the rows aggregation
				rows : {
					path : "/"
				},

				// column definitions with column name and binding info for the content

				columns : [{
					name : "Country",
					template : {
						content : "{name/official}"
					}
				}, {
					name : "Population",
					template : {
						content : "{population}"
					}
				}]
			});

			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},

		handleSortButtonPressed: function(oEvent) {
			let oTable = this.byId("idCountriesTable");
			let	oBinding = oTable.getBinding("items");
			let	aSorters = [];

			let customModel = this.getView().getModel("searchModel");
			let asc = customModel.getProperty("/ascending");
			asc = !asc;
			customModel.setProperty("/ascending", asc);

			aSorters.push(new Sorter("name/official", asc));
			oBinding.sort(aSorters);
		},

		handleActionButtonPress: function(evt) {
			var target = evt.getSource().data("target");
			let msg = jQuery.sap.formatMessage(this.getView().getModel('i18n').getProperty('capital_msg'), [target])
			MessageBox.information(msg);
		},

		onOpenDialog : function () {
			// create dialog lazily
			if (!this.pDialog) {
				this.pDialog = this.loadFragment({
					name: "com.nimsoc.demo.view.Dialog"
				});
			} 
			this.pDialog.then(function(oDialog) {
				oDialog.open();
			});
		},
 
		onCloseDialog : function () {
			// note: We don't need to chain to the pDialog promise, since this event-handler
			// is only called from within the loaded dialog itself.
			this.byId("helloDialog").close();
		},

	
		onOpenChooseDialog: function (oEvent) {
			var oButton = oEvent.getSource(),
				oView = this.getView();

			if (!this._pDialog) {
				this._pDialog = this.loadFragment({
					id: oView.getId(),
					name: "com.nimsoc.demo.view.ChooseDialog",
					controller: this //??
				}).then(function (oDialog){
					oDialog.setModel(oView.getModel());
					return oDialog;
				});
			}

			this._pDialog.then(function(oDialog){
			 	//this._configDialog(oButton, oDialog);
			 	oDialog.open();
			 }.bind(this));

		},

		onChooseDialogSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("name/official", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter([oFilter]);
		},

		onChooseDialogClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) { return oContext.getObject().name.official; }).join(", "));
			} else {
				MessageToast.show("No new item was selected.");
			}
			oEvent.getSource().getBinding("items").filter([]);
		},


		// _configDialog: function (oButton, oDialog) {
		// 	// Multi-select if required
		// 	var bMultiSelect = !!oButton.data("multi"); // ???
		// 	oDialog.setMultiSelect(bMultiSelect);

		// 	var sCustomConfirmButtonText = oButton.data("confirmButtonText");
		// 	oDialog.setConfirmButtonText(sCustomConfirmButtonText);

		// 	// Remember selections if required
		// 	var bRemember = !!oButton.data("remember");
		// 	oDialog.setRememberSelections(bRemember);

		// 	//add Clear button if needed
		// 	var bShowClearButton = !!oButton.data("showClearButton");
		// 	oDialog.setShowClearButton(bShowClearButton);

		// 	// Set growing property
		// 	var bGrowing = oButton.data("growing");
		// 	oDialog.setGrowing(bGrowing == "true");

		// 	// Set growing threshold
		// 	var sGrowingThreshold = oButton.data("threshold");
		// 	if (sGrowingThreshold) {
		// 		oDialog.setGrowingThreshold(parseInt(sGrowingThreshold));
		// 	}

		// 	// Set draggable property
		// 	var bDraggable = !!oButton.data("draggable");
		// 	oDialog.setDraggable(bDraggable);

		// 	// Set draggable property
		// 	var bResizable = !!oButton.data("resizable");
		// 	oDialog.setResizable(bResizable);

		// 	// Set style classes
		// 	var sResponsiveStyleClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
		// 	var bResponsivePadding = !!oButton.data("responsivePadding");
		// 	oDialog.toggleStyleClass(sResponsiveStyleClasses, bResponsivePadding);

		// 	// clear the old search filter
		// 	oDialog.getBinding("items").filter([]);

		// 	// toggle compact style
		// 	syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
		// },

		onProgramaticDialogPress: function() {
			if (!this.oDefaultDialog) {
				this.oDefaultDialog = new Dialog({
					title: "Available Countries",
					content: new List({
						items: {
							path: "dataModel>/",
							template: new StandardListItem({
								title: "{dataModel>name/official}",
								counter: "{dataModel>population}"
							})
						}
					}),
					beginButton: new Button({
						type: mobileLibrary.ButtonType.Emphasized,
						text: "OK",
						press: function () {
							this.oDefaultDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Close",
						press: function () {
							this.oDefaultDialog.close();
						}.bind(this)
					})
				});

				// to get access to the controller's model
				this.getView().addDependent(this.oDefaultDialog); // ??
			}

			this.oDefaultDialog.open();
		}
	});

	return appController;

});