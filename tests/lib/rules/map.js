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

const message = rule.meta.messages.avoidLodashMap;

var ruleTester = new RuleTester();
ruleTester.run("map", rule, {

    valid: [
        // Явно указан литерал объекта
        {
            code: "_.map({ a: 1 }, fn)",
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
            code:
                "a.map(function (_) {\n" +
                "    _.map(item, function () {});\n" +
                "});"
        },
        // Переопределение переменной
        {
            code: "var _ = a;\n" +
                "_.map(item, fn);"
        },
        // Явно указан литерал объекта
        {
            code: "_.filter(a, fn)",
        },
    ],

    invalid: [
        // Явно указан литерал массива
        {
            code: "_.map([1], fn)",
            errors: [{
                message,
            }],
            output: "[1].map(fn)"
        },
        // Переменная в первом параметре
        {
            code: "_.map(collection, fn)",
            errors: [{
                message,
            }],
            output: "Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn)"
        },
        // Вызов функции в
        {
            code: "_.map(getCollection(), fn)",
            errors: [{
                message,
            }],
            output:
                "(function (collection) {\n" +
                "    Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);\n" +
                "})(getCollection())"
        },
        // Переопределение в другом scope
        {
            code:
                "if (b) {\n" +
                "    var _ = 1;\n" +
                "}\n" +
                "_.map(item, fn);",
            errors: [{
                message,
            }],
            output:
                "if (b) {\n" +
                "    var _ = 1;\n" +
                "}\n" +
                "Array.isArray(item) ? item.map(fn) : _.map(item, fn);"
        },
        // Определение функции
        {
            code: "_.map(a, function(i) {})",
            errors: [{
                message,
            }],
            output:
                "(function (fn) {\n" +
                "    Array.isArray(a) ? a.map(fn) : _.map(a, fn);\n" +
                "})(function(i) {})"
        },
        // Определение функции и функция в первом параметре
        {
            code: "_.map(getCollection(), function(i) {})",
            errors: [{
                message,
            }],
            output:
                "(function (collection, fn) {\n" +
                "    Array.isArray(collection) ? collection.map(fn) : _.map(collection, fn);\n" +
                "})(getCollection(), function(i) {})"
        },
        // Литерал массива + iife
        {
            code: "_.map([1, 2], function(i) {})",
            errors: [{
                message,
            }],
            output:
                "(function (fn) {\n" +
                "    [1, 2].map(fn);\n" +
                "})(function(i) {})"
        }
    ],
});
