/**
 * @fileoverview replace lodash map with native map
 * @author Kate Semenova
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/map"),

    RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const message = "Replace lodash map with native map";

var ruleTester = new RuleTester();
ruleTester.run("map", rule, {

    valid: [
        // Явно указан литерал объекта
        {
            code: "_.map({ a: 1 }, function (i) {})",
        },
        // Второй аргумент явно не функция
        {
            code: "_.map([1], 1)",
        },
        // Передан третий параметр
        {
            code: "_.map([1], a, b)",
        },
        // Переопределение параметром функции
        {
            code: "a.map(function (_) {\n" +
                "    _.map(item, function () {});\n" +
                "});"
        },
        // Переопределение переменной
        {
            code: "var _ = a;\n" +
                "_.map(item, function () {});"
        }
    ],

    invalid: [
        // Явно указан литерал массива
        {
            code: "_.map([1], function (i) {})",
            errors: [{
                message,
            }],
            output: "[1].map(function (i) {})"
        },
        // Переменная в первом параметре
        {
            code: "_.map(collection, function (i) {})",
            errors: [{
                message,
            }],
            output: "Array.isArray(collection) ? collection.map(function (i) {}) : _.map(collection, function (i) {})"
        },
        // Вызов функции в
        {
            code: "_.map(getCollection(), function (i) {})",
            errors: [{
                message,
            }],
            output: "(function (collection) {\n" +
                "    Array.isArray(collection) ? collection.map(function (i) {}) : _.map(collection, function (i) {})\n" +
                "})(getCollection())"
        },
        // Переопределение в другом scope
        {
            code: "if (b) {\n" +
                "    var _ = 1;\n" +
                "}\n" +
                "_.map(item, function () {});",
            errors: [{
                message,
            }],
            output: "if (b) {\n" +
                "    var _ = 1;\n" +
                "}\n" +
                "Array.isArray(item) ? item.map(function () {}) : _.map(item, function () {});"
        }
    ],
});
