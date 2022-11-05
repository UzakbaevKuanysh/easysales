"use strict";

(function(document) {
    var foreach = function(obj, callback) {
        for (var index in obj) {
            callback(index, obj[index]);
        }
    }
    var create_field = function(name, type, options) {
        type = type || 'text';
        options = options || {};
        return {
            name: name,
            sysname: name,
            type: type,
            options: options
        };
    };
    var getSourceType = function() {
        if (document.sourceFields) {
            return 'multilist';
        }
        return 'text';
    };
    var getSourceListValues = function() {
        if (document.sourceFields) {
            var options = {};
            options['list_values'] = [];
            foreach(document.sourceFields, function(index, value) {
                options['list_values'].push(value);
            })
            return options;
        }
        return false;
    };
    var getCurrencyType = function() {
        if (document.currencyB24) {
            return 'multilist';
        }
        return 'text';
    };
    var getCurrencyListValues = function() {
        if (document.currencyB24) {
            var options = {};
            options['list_values'] = [];
            foreach(document.currencyB24, function(index, value) {
                options['list_values'].push(value);
            })
            return options;
        }
        return false;
    };

    document.crm_fields = {
        amoCRM: {
            name: 'amoCRM',
            fields: [{
                    name: 'lead',
                    fields: [
                        create_field('Название сделки'), create_field('Бюджет'),
                        create_field('responsible_user_id', null, {
                            readonly: true
                        })

                    ]
                },
                {
                    name: 'contact',
                    fields: [
                        create_field('name'), create_field('Должность'), create_field('phone'),
                        create_field('email'), create_field('company'),
                        create_field('responsible_user_id', null, {
                            readonly: true
                        })
                    ]
                },
                {
                    name: 'company',
                    fields: [
                        create_field('company'), create_field('phone'), create_field('email'),
                        create_field('responsible_user_id', null, {
                            readonly: true
                        })
                    ]
                },
            ]
        },
        bitrix24: {
            name: 'bitrix24',
            fields: [{
                    name: 'lead',
                    fields: [
                        create_field('TITLE'), create_field('CURRENCY_ID', getCurrencyType(), getCurrencyListValues()), create_field('OPPORTUNITY'),
                        create_field('SOURCE_ID', getSourceType(), getSourceListValues()), create_field('SOURCE_DESCRIPTION'), create_field('HONORIFIC'),
                        create_field('phone'), create_field('email'), create_field('messenger'), create_field('web'),
                        create_field('LAST_NAME'), create_field('NAME'), create_field('SECOND_NAME'),
                        create_field('BIRTHDATE', 'date'), create_field('COMPANY_TITLE'), create_field('POST'),
                        create_field('ADDRESS'), create_field('ADDRESS_2'), create_field('ADDRESS_CITY'),
                        create_field('ADDRESS_REGION'), create_field('ADDRESS_PROVINCE'), create_field('ADDRESS_POSTAL_CODE'),
                        create_field('ADDRESS_COUNTRY'), create_field('COMMENTS'),
                        create_field('ASSIGNED_BY_ID'),
                    ]
                },
                {
                    name: 'deal',
                    fields: [
                        create_field('TITLE'),
                        create_field('CURRENCY_ID', getCurrencyType(), getCurrencyListValues()),
                        create_field('OPPORTUNITY'),
                        create_field('COMMENTS'),
                        create_field('ASSIGNED_BY_ID'),
                    ]
                },
                {
                    name: 'contact',
                    fields: [
                        create_field('SOURCE_ID', getSourceType(), getSourceListValues()), create_field('SOURCE_DESCRIPTION'), create_field('HONORIFIC'),
                        create_field('phone'), create_field('email'), create_field('messenger'), create_field('web'),
                        create_field('LAST_NAME'), create_field('NAME'), create_field('SECOND_NAME'),
                        create_field('BIRTHDATE', 'date'), create_field('POST'), create_field('COMMENTS'),
                        create_field('company'), create_field('COMPANY_BANKING_DETAILS'),
                        create_field('ASSIGNED_BY_ID'),
                    ]
                },
                {
                    name: 'company',
                    fields: [
                        create_field('TITLE'), create_field('COMPANY_BANKING_DETAILS'), create_field('COMPANY_TYPE'),
                        create_field('INDUSTRY'), create_field('COMPANY_EMPLOYEES'), create_field('COMPANY_REVENUE'),
                        create_field('CURRENCY_ID', getCurrencyType(), getCurrencyListValues()), create_field('phone'), create_field('email'),
                        create_field('messenger'), create_field('web'), create_field('COMMENTS'),
                        create_field('ASSIGNED_BY_ID'),
                    ]
                },
            ]
        },
        zendesk: {
            name: 'zendesk',
            fields: [{
                    name: 'ticket',
                    fields: [
                        create_field('subject'), create_field('description'),
                    ]
                },
                {
                    name: 'user',
                    fields: [
                        create_field('name'), create_field('email'),
                    ]
                },
            ]
        }
    };
})(document);