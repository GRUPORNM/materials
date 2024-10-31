sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
],
    function (BaseController, JSONModel) {
        "use strict";

        return BaseController.extend("materialsoverview.controller.OverviewDetail", {
            onInit: function () {
                var oModel = new JSONModel({

                });
                this.getView().setModel(oModel, "OverviewDetail");
                this.getOwnerComponent().getRouter().attachRouteMatched(this.onObjectMatched, this);
                sessionStorage.setItem("goToLaunchpad", "");
            },

            onGetAttachments: function (sMaterial) {
                var that = this,
                    oModel = this.getModel(),
                    sPath = "/AttachDocuments",
                    aFilters = [new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, sMaterial)];

                oModel.read(sPath, {
                    filters: aFilters,
                    success: function (oData) {
                        var oList = that.getView().byId("list"),
                            oListModel = new sap.ui.model.json.JSONModel(oData.results);

                        oList.setModel(oListModel);
                        oList.bindItems({
                            path: "/",
                            template: new sap.m.StandardListItem({
                                title: "{AttachTypeDesc}",
                                description: {
                                    parts: ["CreatedBy", "CreatedAt"],
                                    formatter: function (sCreatedBy, sCreatedAt) {
                                        var sFormattedDate = that.formatDate(sCreatedAt);
                                        return that.getResourceBundle().getText("createdBy") + sCreatedBy + " | " + that.getResourceBundle().getText("createdAt") + sFormattedDate;
                                    }
                                },
                                icon: "sap-icon://pdf-attachment",
                                type: "Active",
                                press: that.onOpenImage.bind(that)
                            })
                        });
                    },
                    error: function (oError) {
                        var sError = JSON.parse(oError.responseText).error.message.value;

                        sap.m.MessageBox.alert(sError, {
                            icon: "ERROR",
                            onClose: null,
                            styleClass: '',
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit
                        });
                    }
                })
            },

            formatDate: function (sDate) {
                if (!sDate) {
                    return "";
                }
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy" });
                return oDateFormat.format(new Date(sDate));
            },

            handleAddAttachmentPress: function () {
                var aDialogFields = [],
                    oDoc_Type = {
                        oLabelText: this.getResourceBundle().getText("AttachmentType"),
                        oItems: "/xTQAxDATASHEETS_VH",
                        oKey: "{domvalue_l}",
                        oText: "{ddtext}",
                        oId: "documentType",
                        oName: "documentType",
                        oRequired: true,
                        oEnabled: true,
                        oSelectedKey: "",
                        oForceSelection: false,
                        liveChange: true,
                        oControl: sap.m.Select
                    },
                    oDocument = {
                        oControl: sap.ui.unified.FileUploader,
                        oLabelText: this.getResourceBundle().getText("setDocument"),
                        change: this.onFileChange.bind(this),
                        type: "file",
                        oId: "fileUploader",
                        oName: "fileUploader",
                        oWidth: "100%",
                        oRequired: true,
                        oValue: "",
                        oEnabled: true,
                        oTooltip: this.getResourceBundle().getText("documentImportTooltip")
                    },
                    oDialogInfo = {
                        oId: "DocumentationDialog",
                        oLayout: "ResponsiveGridLayout",
                        oTitle: this.getResourceBundle().getText("documents")
                    },
                    aDialogButtons = [],
                    oCancelButton = {
                        oId: "CancelDocumentationDialogButton",
                        oText: this.getResourceBundle().getText("Close"),
                        oType: "Default",
                        oEvent: this.onCloseDialog.bind(this)
                    },
                    oConfirmButton = {
                        oId: "AddDocumentationDialogButton",
                        oText: this.getResourceBundle().getText("Create"),
                        oType: "Emphasized",
                        oEvent: this.onAddAttachments.bind(this)
                    };


                oDoc_Type.oSelectedKey = "";
                oDocument.oValue = "";

                aDialogButtons.push(oConfirmButton, oCancelButton);
                aDialogFields.push(oDoc_Type, oDocument);

                this.buildDialogs(oDialogInfo, aDialogFields, aDialogButtons);
                this.onRemoveSelections();
            },

            onAddAttachments: async function () {
                var that = this;
                try {
                    var aControl = [],
                        aContainers = [],
                        oModel = this.getModel();

                    aControl.push(sap.m.Select, sap.ui.unified.FileUploader);
                    aContainers.push(this.oSimpleForm.getId());

                    const checked = this.checkEmptyFields(aControl, aContainers, "Dialog");

                    if (checked) {
                        var oEntry = {
                            AttachType: sap.ui.getCore().byId("documentType").getSelectedKey(),
                            Material: this.getModel().getObject(this.getView().getBindingContext().getPath()).matnr,
                            Document: "",
                        };

                        var oDocument_Base64Str = await this.onGetDocument(sap.ui.getCore().byId("fileUploader"));

                        if (oDocument_Base64Str) {
                            oEntry.Document = oDocument_Base64Str;

                            oModel.create("/AttachDocuments", oEntry, {
                                success: function () {
                                    new sap.m.MessageBox.success(that.getResourceBundle().getText("documentUploadSuccess"), {
                                        title: that.getResourceBundle().getText("documentUpload"),
                                        actions: [sap.m.MessageBox.Action.OK],
                                        emphasizedAction: sap.m.MessageBox.Action.OK
                                    });
                                    that.getModel().refresh(true);
                                },
                                error: function (oError) {
                                    var sError = JSON.parse(oError.responseText).error.message.value;

                                    sap.m.MessageBox.alert(sError, {
                                        icon: "ERROR",
                                        onClose: null,
                                        styleClass: '',
                                        initialFocus: null,
                                        textDirection: sap.ui.core.TextDirection.Inherit
                                    });
                                }
                            });
                        }

                        this.onCloseDialog();
                    }

                } catch (error) {
                    var oMessage = {
                        oText: error.message,
                        oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                    }

                    this.showErrorMessage(oMessage);
                }
            },

            onDeleteAttachment: function () {
                var that = this,
                    oModel = this.getModel(),
                    sPath = "/AttachDocuments(Material='" + this.getModel().getObject(this.getView().getBindingContext().getPath()).matnr + "',AttachType='" + this.byId("list").getModel().getObject(this.byId("list").getSelectedItems()[0].getBindingContextPath()).AttachType + "')";

                new sap.m.MessageBox.warning(this.getResourceBundle().getText("deleteDocumentationText"), {
                    title: this.getResourceBundle().getText("deleteDocumentationHeader"),
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CLOSE],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            oModel.remove(sPath, {
                                success: function (oData) {
                                    new sap.m.MessageBox.success(that.getResourceBundle().getText("documentDeletedSuccess"), {
                                        title: that.getResourceBundle().getText("documentDeleted"),
                                        actions: [sap.m.MessageBox.Action.OK],
                                        emphasizedAction: sap.m.MessageBox.Action.OK
                                    });
                                    that.getModel().refresh(true);
                                },
                                error: function (oError) {
                                    var sError = JSON.parse(oError.responseText).error.message.value;

                                    sap.m.MessageBox.alert(sError, {
                                        icon: "ERROR",
                                        onClose: null,
                                        styleClass: '',
                                        initialFocus: null,
                                        textDirection: sap.ui.core.TextDirection.Inherit
                                    });
                                }
                            })
                        }else{
                            this.onRemoveSelections();
                        }
                    }
                });
            },

            onAfterRendering: function () {
                var that = this;
                sessionStorage.setItem("goToLaunchpad", "");
                window.addEventListener("message", function (event) {
                    var data = event.data;
                    if (data.action == "goToMainPage") {
                        that.onNavBack();
                    }
                });
            },

            onObjectMatched: function (oEvent) {
                this.onBindView("/" + oEvent.getParameter("config").pattern.replace("/{objectId}", "") + oEvent.getParameter("arguments").objectId, oEvent.getParameter("arguments").objectId);
            },

            onBindView: function (sObjectPath, sMaterial) {
                var that = this;

                sMaterial = sMaterial.match(/matnr='(\d+)'/);
                sMaterial = sMaterial ? sMaterial[1] : null;

                this.getView().bindElement({
                    path: sObjectPath,
                    change: this.onBindingChange.bind(this),
                    events: {
                        dataRequested: function () {
                            this.getModel("appView").setProperty("/busy", true);
                        }.bind(this),
                        dataReceived: function () {
                            that.onGetAttachments(sMaterial);
                            this.getModel("appView").setProperty("/busy", false);
                        }.bind(this)
                    }
                });
            },

            onCloseDialog: function () {
                this.oDialog.close();
            },

            onFileChange: function (oEvent) {
                var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0],
                    oFileUploader = sap.ui.getCore().byId("fileUploader");

                if (!oFile.type.match("pdf*")) {
                    oFileUploader.setValue("");
                    sap.m.MessageBox.error("Selecione um pdf");
                    return;
                } else {
                    oFileUploader.setValueState("None");
                }
            },

            onOpenImage: function () {
                if (this.byId("list").getSelectedItems().length > 0) {
                    var oDocument = this.byId("list").getModel().getObject(this.byId("list").getSelectedItems()[0].getBindingContext().sPath).Document;
                    this._pdfViewer = new sap.m.PDFViewer();

                    if (oDocument != '') {

                        var decodedPdfContent = oDocument;
                        if (decodedPdfContent.indexOf(',') != -1)
                            decodedPdfContent = decodedPdfContent.substring(decodedPdfContent.indexOf(',') + 1, decodedPdfContent.length);

                        decodedPdfContent = atob(decodedPdfContent);
                        decodedPdfContent = atob(decodedPdfContent.replace("data:application/pdf;base64,", ""));

                        var byteArray = new Uint8Array(decodedPdfContent.length)

                        for (var i = 0; i < decodedPdfContent.length; i++) {
                            byteArray[i] = decodedPdfContent.charCodeAt(i);
                        }

                        var blob = new Blob([byteArray.buffer], { type: "application/pdf" }),
                            _pdfurl = URL.createObjectURL(blob);

                        this._PDFViewer = new sap.m.PDFViewer({
                            width: "auto",
                            showDownloadButton: false,
                            source: _pdfurl
                        });

                        jQuery.sap.addUrlWhitelist("blob");
                        this._PDFViewer.open();

                        this.onRemoveSelections();
                    }
                } else {
                    new sap.m.MessageBox.warning(this.getResourceBundle().getText("selectAttachmentText"), {
                        title: this.getResourceBundle().getText("selectAttachmentTitle"),
                        actions: [sap.m.MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK
                    });
                }
            },

            onRemoveSelections: function () {
                this.byId("list").removeSelections(true);
            }

        });
    });
