import * as actions from "@controleonline/ui-default/src/store/default/actions";
import * as getters from "@controleonline/ui-default/src/store/default/getters";
import mutations from "@controleonline/ui-default/src/store/default/mutations";
import Formatter from "@controleonline/ui-common/src/utils/formatter.js";

export default {
  namespaced: true,
  state: {
    resourceEndpoint: "models",
    isLoading: false,
    error: "",
    violations: null,
    // totalItems: 0,
    filters: {},
    columns: [
      {
        editable: false,
        isIdentity: true,
        sortable: true,
        name: "id",
        align: "left",
        label: "id",
        externalFilter: true,
        to: function (value) {
          return {
            name: "modelDetails",
            params: { id: value },
          };
        },
        format: function (value) {
          return "#" + value;
        },
      },
      {
        sortable: true,
        name: "model",
        editable: true,
        label: "model",
        align: "left",
      },
      {
        sortable: true,
        name: "category",
        align: "left",
        label: "category",
        list: "categories/getItems",
        searchParam: "name",
        externalFilter: true,
        format: function (value) {
          return value?.name;
        },
        style: function (value) {
          return {
            color: value?.category?.color,
          };
        },
        saveFormat: function (value, column, row) {
          return "/categories/" + parseInt(value.value || value);
        },
        formatList: function (value) {
          return value
            ? {
                label: value?.name,
                value: value?.id,
              }
            : null;
        },
      },
      {
        sortable: true,
        name: "signer",
        align: "left",
        label: "signer",
        list: "people/getItems",
        externalFilter: false,
        format: function (value) {
          return value ? value?.name + " - " + value?.alias : " - ";
        },
        formatList: function (value) {
          if (value)
            return {
              value: value["@id"].split("/").pop(),
              label: value?.name + " - " + value?.alias,
            };
        },
        saveFormat: function (value) {
          return value ? "/people/" + (value.value || value) : null;
        },
      },
      {
        sortable: true,
        inputType: "file",
        fileType: ["html", "text"],
        style() {
          //return { display: "none" };
        },
        preview: true,
        formClass: "row col-12 full-width",
        name: "file",
        editable: true,
        label: "file",
        align: "left",
        saveFormat: function (value) {
          if (typeof value == "object" && value["@id"]) return value["@id"];
          else return value.toString();
        },
      },
    ],
  },
  actions: actions,
  getters,
  mutations,
};
