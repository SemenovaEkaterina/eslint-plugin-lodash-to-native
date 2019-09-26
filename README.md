## Домашнее задание

Сделано:
1. добавление проверки при необходимости;
1. учет переопределения _;
1. учет литерала массива;
1. учет литерала объекта;
1. тесты.

# eslint-plugin-lodash-to-native

## Установка

Установить `eslint`:

```
$ npm i eslint --save-dev
```

Установить плагин `eslint-plugin-lodash-to-native`:

```
$ npm install -S https://github.com/SemenovaEkaterina/eslint-plugin-lodash-to-native.git --save-dev
```

## Использование

Добавить `lodash-to-native` в конфиг в секцию `.eslintrc`:

```json
{
    "plugins": [
        "lodash-to-native"
    ]
}
```

Указать правила в конфиге в секции `rules`:

```json
{
    "rules": {
        "lodash-to-native/rule-name": 2
    }
}
```

## Правила

[map](docs/rules/map.md)





