/**
 * @fileoverview replace lodash map with native map
 * @author Kate Semenova
 */
"use strict";

// TODO правильная ссылка в README

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "replace lodash map with native map",
            recommended: false,
            url: ""
        },
        fixable: "code",
        schema: [
            // fill in your schema
        ],
        messages: {
            avoidLodashMap: "Replace lodash map with native map"
        },
    },

    create: function (context) {
        const LODASH = "_";
        const MAP = "map";

        const sourceCode = context.getSourceCode();

        // Индекс - уровень scope, значение - было ли переопределение _
        let scopesOverrides = [];
        let currentScope = 0;

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        // Накопление массива переопределений в scope
        function enterScope() {
            currentScope++;
        }

        function exitScope() {
            currentScope--;
            // Стираем данные для scope, которые покинули
            scopesOverrides = scopesOverrides.slice(0, currentScope);
        }

        // Получения текстового представления узла
        function getText(node) {
            return sourceCode.getText(node);
        }

        // Получения текстового представления проверки на тип массива
        function getCheckText(node, name) {
            const [iterable] = getArguments(node);
            const iterableText = getText(iterable);
            return `Array.isArray(${name || iterableText})`
        }

        // Получение представления одного отступа и числа отступов на узле
        function getNodeIndent(node) {
            const SPACE = " ";
            const TAB = "\t";

            // Получение подстроки отступа из строки
            function getStrIndent(str) {
                if (!str) {
                    return;
                }
                const arr = str.split("");
                return arr.slice(0, arr.findIndex(char => char !== " " && char !== "\t")).join('')
            }

            // Первая строка в файле с отступом
            const indentedLine = sourceCode.lines.find(item => item.startsWith(SPACE) || item.startsWith(TAB));
            // Значение отступа
            const indent = getStrIndent(indentedLine) || "    ";

            const token = sourceCode.getFirstToken(node);
            // Значение отступа до текущего узла
            const localIndent = getStrIndent(sourceCode.getText(token, token.loc.start.column)) || "";

            return [indent, localIndent.length / indent.length];
        }

        // Получение аргументов вызываемого метода
        function getArguments(node) {
            return node.parent.arguments;
        }

        // Проверки типов узлов
        function isType(node, type) {
            return node.type === type;
        }

        function isObject(node) {
            return isType(node, 'ObjectExpression');
        }

        function isArray(node) {
            return isType(node, 'ArrayExpression');
        }

        function isCondition(node) {
            return isType(node, 'ConditionalExpression');
        }

        function isCall(node) {
            return isType(node, 'CallExpression');
        }

        function isLiteral(node) {
            return isType(node, 'Literal');
        }

        function isFunctionDeclaration(node) {
            return isType(node, 'FunctionExpression');
        }

        // Проверка наличия условия (правило уже применило фикс)
        function hasCheck(node) {
            const conditionalExpression = (node.parent || {}).parent;
            if (conditionalExpression && isCondition(conditionalExpression)) {
                // Текст проверки совпал
                return getCheckText(node) === getText(conditionalExpression.test);
            }
            return false;
        }

        // Обернуть в iife
        function wrapWithIIFE(node, params, body) {
            const [indent, size] = getNodeIndent(node);

            const iifeStart = `(function (${params.map(item => item.name).join(', ')}) {\n${indent.repeat(size + 1)}`;
            const iifeEnd = `;\n${indent.repeat(size)}})(${params.map(item => item.value).join(', ')})`;

            return `${iifeStart}${body}${iifeEnd}`;
        }

        // Получение строки для фикса
        function fix(node) {
            const [iterable, func] = getArguments(node);
            const iterableText = getText(iterable);
            const funcText = getText(func);

            // Далее параметр name указан для вызова из iife
            // Генерация вызова _.map
            function getInitialText(name, funcName) {
                return `_.map(${name || iterableText}, ${funcName || getText(func)})`;
            }

            // Генерация нативного вызова
            function getNativeText(name, funcName) {
                return `${name || iterableText}.map(${funcName || getText(func)})`;
            }

            function getTextWithCheck(name, funcName) {
                const nativeText = getNativeText(name, funcName);
                if (isArray(iterable)) {
                    return nativeText;
                }

                return `${getCheckText(node, name)} ? ${nativeText} : ${getInitialText(name, funcName)}`;
            }

            // Параметры iife, name - имя параметра, value - аргумент
            const params = [];
            // Именна переменных с которыми формируется условие проверки на массив
            const checkParams = [];

            // В случае передачи функции первым аргументом map - добавить параметр в iife
            if (isCall(iterable)) {
                const parameterName = "collection";

                params.push({
                    name: parameterName,
                    value: iterableText,
                });
                checkParams.push(parameterName)
            } else {
                checkParams.push(undefined);
            }
            // В случае передачи декларации вторым аргументом map - добавить параметр в iife
            if (isFunctionDeclaration(func)) {
                const parameterName = "fn";
                params.push({
                    name: parameterName,
                    value: funcText,
                });
                checkParams.push(parameterName);
            }
            if (params.length > 0) {
                const body = getTextWithCheck(...checkParams);
                return wrapWithIIFE(
                    node,
                    params,
                    body);
            }

            return getTextWithCheck();
        }

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {
            BlockStatement: function () {
                enterScope();
            },
            "BlockStatement:exit": function () {
                exitScope();
            },
            FunctionExpression: function (node) {
                enterScope();
                node.params.map(item => {
                    if (item.name === '_') {
                        scopesOverrides[currentScope] = true;
                    }
                })
            },
            "FunctionExpression:exit": function () {
                exitScope();
            },
            [`VariableDeclarator[id.name=${LODASH}]`]: function (node) {
                scopesOverrides[currentScope] = true;
            },
            [`MemberExpression[object.name=${LODASH}][property.name=${MAP}][parent.arguments.length=2]`]:
                function (node) {
                    if (scopesOverrides.find(item => item)) {
                        return;
                    }
                    const args = getArguments(node);
                    const [iterable, callback] = args;

                    if (!isObject(iterable) && !isLiteral(callback) && !hasCheck(node)) {
                        context.report({
                            node,
                            messageId: "avoidLodashMap",
                            fix: function (fixer) {
                                const fixedText = fix(node);
                                return fixer.replaceText(node.parent, fixedText);
                            }
                        });
                    }
                }
        };
    }
};
