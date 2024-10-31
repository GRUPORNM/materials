sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    var TQAModel,
        oBase64 = "";

    return Controller.extend("materialsoverview.controller.BaseController", {

        getModelTQA: function () {
            return TQAModel;
        },

        setModelTQA: function (token) {
            var userLanguage = sessionStorage.getItem("oLangu");
            if (!userLanguage) {
                userLanguage = "EN";
            }
            var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

            TQAModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: serviceUrlWithLanguage,
                annotationURI: "/zsrv_iwfnd/Annotations(TechnicalName='%2FTQA%2FOD_MATERIALS_OVERV_ANNO_MDL',Version='0001')/$value/",
                headers: {
                    "authorization": token,
                    "applicationName": "MAT_OVERVIEW"
                }
            });

            var vModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/TQA/OD_VARIANTS_MANAGEMENT_SRV",
                headers: {
                    "authorization": token,
                    "applicationName": "MAT_OVERVIEW"
                }
            });
            this.setModel(vModel, "vModel");
            this.setModel(TQAModel);
        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },


        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onNavigation: function (sPath, oRoute, oEntityName) {
            if (sPath) {
                this.getRouter().navTo(oRoute, {
                    objectId: sPath.replace(oEntityName, "")
                }, true);
            } else {
                this.getRouter().navTo(oRoute, {}, true);
            }
        },

        onNavBack: function () {
            sessionStorage.setItem("goToLaunchpad", "X");
            this.onNavigation("", "overview", "");
        },

        onObjectMatched: function (oEvent) {
            this.onBindView("/" + oEvent.getParameter("config").pattern.replace("/{objectId}", "") + oEvent.getParameter("arguments").objectId);
        },

        onBindView: function (sObjectPath) {
            this.getView().bindElement({
                path: sObjectPath,
                change: this.onBindingChange.bind(this),
                events: {
                    dataRequested: function () {
                        this.getModel("appView").setProperty("/busy", true);
                    }.bind(this),
                    dataReceived: function () {
                        this.onGetAtt
                        this.getModel("appView").setProperty("/busy", false);
                    }.bind(this)
                }
            });
        },

        onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("notFound");

                return;
            }
        },

        onGetDocument: function (oDocumentInput, oDocumentName) {
            return new Promise(function (resolve, reject) {
                var oItem = "",
                    oDocument = new jsPDF('p', 'mm', 'a4', true),
                    oResize_Width = 2200,
                    oFileReader = new FileReader();

                if (oDocumentInput.oFileUpload.files.length > 0) {
                    oItem = oDocumentInput.oFileUpload.files[0]
                }

                oFileReader.readAsDataURL(oItem);
                oFileReader.name = oDocumentName;
                oFileReader.size = oItem.size;

                oFileReader.onload = function (oEvent) {
                    var oImage = new Image();

                    if (!oItem.type.includes('pdf')) {
                        oImage.src = oEvent.target.result;

                        oImage.onload = function (el) {
                            var oElement = document.createElement('canvas'),
                                oScaleFactor = oResize_Width / el.target.width;

                            oElement.width = oResize_Width;
                            oElement.height = el.target.height * oScaleFactor;

                            var oContext = oElement.getContext('2d');
                            oContext.drawImage(el.target, 0, 0, oElement.width, oElement.height);

                            var oSourceEncoded = oContext.canvas.toDataURL('image/jpeg', 0.50);
                            oDocument.addImage(oSourceEncoded, 'JPEG', 15, 40, 180, 150);

                            oBase64 = oDocument.output('datauristring')
                            oBase64 = btoa(oBase64);

                            resolve(oBase64);
                        };
                    } else {
                        oBase64 = btoa(oEvent.target.result);

                        resolve(oBase64);
                    }
                };

                oFileReader.onerror = function (error) {
                    reject(error);
                };
            });
        },

        getFields: function (aControl, aContainers, oMainControl) {
            this.aFields = [];
            aContainers.forEach(oContainer => {

                for (let i = 0; i < aControl.length; i++) {

                    if (oMainControl == "Dialog") {
                        var aContainerFields = sap.ui.getCore().byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getName();

                            try {
                                oField.value = oContainerField.getValue()
                            } catch (error) {
                                oField.value = oContainerField.getSelectedKey();
                            }

                            this.aFields.push(oField);
                        });
                    } else {
                        var aContainerFields = this.byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getName();

                            try {
                                oField.value = oContainerField.getValue();
                            } catch (error) {
                                oField.value = oContainerField.getSelectedKey();
                            }

                            this.aFields.push(oField);
                        });
                    }

                }

            });

            return this.aFields;
        },

        checkEmptyFields: function (aControl, aContainers, oMainControl) {
            this.getFields(aControl, aContainers, oMainControl);
            this.checked = true;

            if (this.aFields.length > 0) {

                this.aFields.forEach(oField => {
                    if (oMainControl == "Dialog") {
                        var oControl = sap.ui.getCore().byId(oField.id);
                    } else {
                        var oControl = sap.ui.getCore().byId(oField.id);
                    }

                    if (oControl) {
                        if (oControl.getProperty("enabled") && oControl.getProperty("visible")) {
                            try {
                                if (oControl.getValue() == "") {
                                    oControl.setValueState("Error");
                                    this.checked = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            } catch (error) {
                                if (oControl.getSelectedKey() == "") {
                                    oControl.setValueState("Error");
                                    this.checked = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            }
                        }
                    }
                });

                if (this.checked) {
                    return true;
                } else {
                    return false;
                }
            }
        },

        buildDialogs: function (oDialogInfo, aDialogFields, aDialogButtons) {
            try {
                this.oDialog = new sap.m.Dialog({
                    title: oDialogInfo.oTitle,
                    id: oDialogInfo.oId,
                    afterClose: this.onAfterClose.bind(this)
                });

                if (aDialogFields.length > 0) {

                    this.oDialog.addContent(this.oGrid = new sap.ui.layout.Grid({
                        defaultSpan: "L12 M12 S12",
                        width: "auto"
                    }));

                    this.oGrid.addContent(this.oSimpleForm = new sap.ui.layout.form.SimpleForm({
                        id: oDialogInfo.oId + "SimpleForm",
                        minWidth: 1024,
                        layout: oDialogInfo.oLayout,
                        labelSpanL: 3,
                        labelSpanM: 3,
                        emptySpanL: 4,
                        emptySpanM: 4,
                        columnsL: 2,
                        columnsM: 2,
                        maxContainerCols: 2,
                        editable: false
                    }));

                    aDialogFields.forEach(oField => {
                        switch (oField.oControl) {

                            case sap.m.Input:
                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText, required: oField.oRequired })
                                )

                                this.oInput = new sap.m.Input({
                                    id: oField.oId,
                                    name: oField.oName,
                                    enabled: oField.oEnabled
                                });

                                if (oField.oSelectedKey != "") {
                                    this.oInput.setSelectedKey(oField.oSelectedKey);
                                } else if (oField.oValue != "") {
                                    this.oInput.setValue(oField.oValue);
                                }

                                this.oSimpleForm.addContent(this.oInput);
                                break;

                            case sap.m.Select:
                                if (oField.oItems != "") {
                                    this.oSimpleForm.addContent(
                                        new sap.m.Label({ text: oField.oLabelText, required: oField.oRequired })
                                    );

                                    this.oSelect = new sap.m.Select({
                                        id: oField.oId,
                                        name: oField.oName,
                                        enabled: oField.oEnabled,
                                        change: this.onSelectChange.bind(this),
                                        forceSelection: oField.oForceSelection,
                                    });

                                    this.oSelect.setModel(this.getModel());

                                    this.oSelect.bindAggregation("items", {
                                        path: oField.oItems,
                                        template: new sap.ui.core.Item({
                                            key: oField.oKey,
                                            text: oField.oText
                                        })
                                    });

                                    if (oField.oSelectedKey != "") {
                                        this.oSelect.setSelectedKey(oField.oSelectedKey);
                                    }

                                    this.oSimpleForm.addContent(this.oSelect);
                                }
                                break;

                            case sap.m.DatePicker:

                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText })
                                );

                                this.oDatePicker = new sap.m.DatePicker({
                                    id: oField.oId,
                                    name: oField.oName,
                                    value: oField.oValue,
                                    valueFormat: oField.oValueFormat,
                                    required: oField.oRequired,
                                    enabled: oField.oEnabled,
                                    displayFormat: oField.oDisplayFormat,
                                    minDate: oField.oMinDate
                                })


                                if (oField.oValue1 != "") {
                                    this.oDatePicker.setDateValue(new Date(oField.oValue1));
                                }

                                this.oSimpleForm.addContent(this.oDatePicker);
                                break;

                            case sap.ui.unified.FileUploader:

                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText }),
                                );

                                this.oFileUploader = new sap.ui.unified.FileUploader({
                                    id: oField.oId,
                                    name: oField.oName,
                                    enabled: oField.oEnabled,
                                    required: oField.oRequired,
                                    width: "100%",
                                    change: oField.change,
                                    tooltip: oField.oTooltip
                                })

                                if (oField.oValue != "") {
                                    this.oFileUploader.setValue(oField.oValue);
                                }

                                this.oSimpleForm.addContent(this.oFileUploader);

                                break;

                        }
                    });

                    if (aDialogButtons.length > 0) {
                        aDialogButtons.forEach(oButton => {
                            this.oDialog.addButton(
                                new sap.m.Button({
                                    id: oButton.oId,
                                    text: oButton.oText,
                                    type: oButton.oType,
                                    press: oButton.oEvent
                                })
                            );
                        });
                    }

                }

                this.oDialog.open();

            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }

        },

        showErrorMessage: function (oMessage) {
            new sap.m.MessageBox.error(oMessage.oText, {
                title: oMessage.oTitle,
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },

        onAfterClose: function () {
            if (this.oDialog) {
                this.oDialog.destroy();
                this.oDialog = null;
            }
        },

        onSelectChange: function (oEvent) {
            var oSource = oEvent.getSource().sId,
                oDocumentCategorySelect = sap.ui.getCore().byId("documentType");

            if (oSource.includes("documentType")) {
                oDocumentCategorySelect.setProperty("enabled", true);
            }
        },

        getUserAuthentication: function (type) {
            var that = this,
                urlParams = new URLSearchParams(window.location.search),
                token = urlParams.get('token');

            if (token != null) {
                var headers = new Headers();
                headers.append("X-authorization", token);

                var requestOptions = {
                    method: 'GET',
                    headers: headers,
                    redirect: 'follow'
                };

                fetch("/sap/opu/odata/TQA/AUTHENTICATOR_SRV/USER_AUTHENTICATION", requestOptions)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Ocorreu um erro ao ler a entidade.");
                        }
                        return response.text();
                    })
                    .then(function (xml) {
                        var parser = new DOMParser(),
                            xmlDoc = parser.parseFromString(xml, "text/xml"),
                            successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0],
                            response = successResponseElement.textContent;

                        if (response != 'X') {
                            that.getRouter().navTo("NotFound");
                        }
                        else {
                            that.getModel("appView").setProperty("/token", token);
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            } else {
                that.getRouter().navTo("NotFound");
                return;
            }
        }
    });
});