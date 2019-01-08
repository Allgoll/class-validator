import {ValidationMetadata} from "../metadata/ValidationMetadata";
import {ValidationTypes} from "./ValidationTypes";
import {ValidationError} from "./ValidationError";
import {IsNumberOptions} from "./ValidationTypeOptions";
import {ValidatorOptions} from "./ValidatorOptions";
import {ValidationExecutor} from "./ValidationExecutor";
import {ValidationOptions} from "../decorator/ValidationOptions";
/* imports from validator packages */
import * as isDivisibleBy from "validator/lib/isDivisibleBy";
import * as isBoolean from "validator/lib/isBoolean";
import * as isNumeric from "validator/lib/isNumeric";
import * as contains from "validator/lib/contains";
import * as isAlpha from "validator/lib/isAlpha";
import * as isAlphanumeric from "validator/lib/isAlphanumeric";
import * as isAscii from "validator/lib/isAscii";
import * as isBase64 from "validator/lib/isBase64";
import * as isByteLength from "validator/lib/isByteLength";
import * as isCreditCard from "validator/lib/isCreditCard";
import * as isCurrency from "validator/lib/isCurrency";
import * as isEmail from "validator/lib/isEmail";
import * as isFQDN from "validator/lib/isFQDN";
import isFullWidth from "validator/lib/isFullWidth";
import isHalfWidth from "validator/lib/isHalfWidth";
import * as isVariableWidth from "validator/lib/isVariableWidth";
import * as isHexColor from "validator/lib/isHexColor";
import * as isHexadecimal from "validator/lib/isHexadecimal";
import * as isIP from "validator/lib/isIP";
import * as isISBN from "validator/lib/isISBN";
import * as isISIN from "validator/lib/isISIN";
import * as isISO8601 from "validator/lib/isISO8601";
import * as isJSON from "validator/lib/isJSON";
import * as isLowercase from "validator/lib/isLowercase";
import * as isMobilePhone from "validator/lib/isMobilePhone";
import * as isMongoId from "validator/lib/isMongoId";
import * as isMultibyte from "validator/lib/isMultibyte";
import * as isSurrogatePair from "validator/lib/isSurrogatePair";
import * as isURL from "validator/lib/isURL";
import * as isUUID from "validator/lib/isUUID";
import * as isUppercase from "validator/lib/isUppercase";
import * as isLength from "validator/lib/isLength";
import * as matches from "validator/lib/matches";

const root = typeof global === "object" ? global :
    typeof window === "object" ? window :
        typeof this === "object" ? this :
            Function("return this;")();

/**
 * Validator performs validation of the given object based on its metadata.
 */
export class Validator {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private libPhoneNumber = {
        phoneUtil: root.LibPhonenumber.PhoneNumberUtil.getInstance(),
    };

    /**
     * Performs validation of the given object based on decorators or validation schema.
     * Common method for `validateOrReject` and `validate` methods.
     */
    private coreValidate(objectOrSchemaName: Object|string, objectOrValidationOptions: Object|ValidationOptions, maybeValidatorOptions?: ValidatorOptions): Promise<ValidationError[]> {
        const object = typeof objectOrSchemaName === "string" ? objectOrValidationOptions as Object : objectOrSchemaName as Object;
        const options = typeof objectOrSchemaName === "string" ? maybeValidatorOptions : objectOrValidationOptions as ValidationOptions;
        const schema = typeof objectOrSchemaName === "string" ? objectOrSchemaName as string : undefined;

        const executor = new ValidationExecutor(this, options);
        const validationErrors: ValidationError[] = [];
        executor.execute(object, schema, validationErrors);

        return Promise.all(executor.awaitingPromises).then(() => {
            return executor.stripEmptyErrors(validationErrors);
        });
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs validation of the given object based on decorators used in given object class.
     */
    validate(object: Object, options?: ValidatorOptions): Promise<ValidationError[]>;

    /**
     * Performs validation of the given object based on validation schema.
     */
    validate(schemaName: string, object: Object, options?: ValidatorOptions): Promise<ValidationError[]>;

    /**
     * Performs validation of the given object based on decorators or validation schema.
     */
    validate(objectOrSchemaName: Object|string, objectOrValidationOptions: Object|ValidationOptions, maybeValidatorOptions?: ValidatorOptions): Promise<ValidationError[]> {
        return this.coreValidate(objectOrSchemaName, objectOrValidationOptions, maybeValidatorOptions);
    }

    /**
     * Performs validation of the given object based on decorators used in given object class and reject on error.
     */
    validateOrReject(object: Object, options?: ValidatorOptions): Promise<void>;

    /**
     * Performs validation of the given object based on validation schema and reject on error.
     */
    validateOrReject(schemaName: string, object: Object, options?: ValidatorOptions): Promise<void>;

    /**
     * Performs validation of the given object based on decorators or validation schema and reject on error.
     */
    async validateOrReject(objectOrSchemaName: Object|string, objectOrValidationOptions: Object|ValidationOptions, maybeValidatorOptions?: ValidatorOptions): Promise<void> {
        const errors = await this.coreValidate(objectOrSchemaName, objectOrValidationOptions, maybeValidatorOptions);
        if (errors.length)
            return Promise.reject(errors);
    }

    /**
     * Performs validation of the given object based on decorators used in given object class.
     * NOTE: This method completely ignores all async validations.
     */
    validateSync(object: Object, options?: ValidatorOptions): ValidationError[];

    /**
     * Performs validation of the given object based on validation schema.
     */
    validateSync(schemaName: string, object: Object, options?: ValidatorOptions): ValidationError[];

    /**
     * Performs validation of the given object based on decorators or validation schema.
     */
    validateSync(objectOrSchemaName: Object|string, objectOrValidationOptions: Object|ValidationOptions, maybeValidatorOptions?: ValidatorOptions): ValidationError[] {
        const object = typeof objectOrSchemaName === "string" ? objectOrValidationOptions as Object : objectOrSchemaName as Object;
        const options = typeof objectOrSchemaName === "string" ? maybeValidatorOptions : objectOrValidationOptions as ValidationOptions;
        const schema = typeof objectOrSchemaName === "string" ? objectOrSchemaName as string : undefined;

        const executor = new ValidationExecutor(this, options);
        executor.ignoreAsyncValidations = true;
        const validationErrors: ValidationError[] = [];
        executor.execute(object, schema, validationErrors);
        return executor.stripEmptyErrors(validationErrors);
    }

    /**
     * Performs validation of the given object based on the given ValidationMetadata object.
     */
    validateValueByMetadata(value: any, metadata: ValidationMetadata): boolean {
        switch (metadata.type) {
            /* common checkers */
            case ValidationTypes.IS_DEFINED:
                return this.isDefined(value);
            case ValidationTypes.EQUALS:
                return this.equals(value, metadata.constraints[0]);
            case ValidationTypes.NOT_EQUALS:
                return this.notEquals(value, metadata.constraints[0]);
            case ValidationTypes.IS_EMPTY:
                return this.isEmpty(value);
            case ValidationTypes.IS_NOT_EMPTY:
                return this.isNotEmpty(value);
            case ValidationTypes.IS_IN:
                return this.isIn(value, metadata.constraints[0]);
            case ValidationTypes.IS_NOT_IN:
                return this.isNotIn(value, metadata.constraints[0]);

            /* type checkers */
            case ValidationTypes.IS_BOOLEAN:
                return this.isBoolean(value);
            case ValidationTypes.IS_DATE:
                return this.isDate(value);
            case ValidationTypes.IS_STRING:
                return this.isString(value);
            case ValidationTypes.IS_DATE_STRING:
                return this.isDateString(value);
            case ValidationTypes.IS_ARRAY:
                return this.isArray(value);
            case ValidationTypes.IS_NUMBER:
                return this.isNumber(value, metadata.constraints[0]);
            case ValidationTypes.IS_INT:
                return this.isInt(value);
            case ValidationTypes.IS_ENUM:
                return this.isEnum(value, metadata.constraints[0]);

            /* number checkers */
            case ValidationTypes.IS_DIVISIBLE_BY:
                return this.isDivisibleBy(value, metadata.constraints[0]);
            case ValidationTypes.IS_POSITIVE:
                return this.isPositive(value);
            case ValidationTypes.IS_NEGATIVE:
                return this.isNegative(value);
            case ValidationTypes.MIN:
                return this.min(value, metadata.constraints[0]);
            case ValidationTypes.MAX:
                return this.max(value, metadata.constraints[0]);

            /* date checkers */
            case ValidationTypes.MIN_DATE:
                return this.minDate(value, metadata.constraints[0]);
            case ValidationTypes.MAX_DATE:
                return this.maxDate(value, metadata.constraints[0]);

            /* string-as-type checkers */
            case ValidationTypes.IS_BOOLEAN_STRING:
                return this.isBooleanString(value);
            case ValidationTypes.IS_NUMBER_STRING:
                return this.isNumberString(value);

            /* string checkers */
            case ValidationTypes.CONTAINS:
                return this.contains(value, metadata.constraints[0]);
            case ValidationTypes.NOT_CONTAINS:
                return this.notContains(value, metadata.constraints[0]);
            case ValidationTypes.IS_ALPHA:
                return this.isAlpha(value);
            case ValidationTypes.IS_ALPHANUMERIC:
                return this.isAlphanumeric(value);
            case ValidationTypes.IS_ASCII:
                return this.isAscii(value);
            case ValidationTypes.IS_BASE64:
                return this.isBase64(value);
            case ValidationTypes.IS_BYTE_LENGTH:
                return this.isByteLength(value, metadata.constraints[0], metadata.constraints[1]);
            case ValidationTypes.IS_CREDIT_CARD:
                return this.isCreditCard(value);
            case ValidationTypes.IS_CURRENCY:
                return this.isCurrency(value, metadata.constraints[0]);
            case ValidationTypes.IS_EMAIL:
                return this.isEmail(value, metadata.constraints[0]);
            case ValidationTypes.IS_FQDN:
                return this.isFQDN(value, metadata.constraints[0]);
            case ValidationTypes.IS_FULL_WIDTH:
                return this.isFullWidth(value);
            case ValidationTypes.IS_HALF_WIDTH:
                return this.isHalfWidth(value);
            case ValidationTypes.IS_VARIABLE_WIDTH:
                return this.isVariableWidth(value);
            case ValidationTypes.IS_HEX_COLOR:
                return this.isHexColor(value);
            case ValidationTypes.IS_HEXADECIMAL:
                return this.isHexadecimal(value);
            case ValidationTypes.IS_IP:
                return this.isIP(value, metadata.constraints[0]);
            case ValidationTypes.IS_ISBN:
                return this.isISBN(value, metadata.constraints[0]);
            case ValidationTypes.IS_ISIN:
                return this.isISIN(value);
            case ValidationTypes.IS_ISO8601:
                return this.isISO8601(value);
            case ValidationTypes.IS_JSON:
                return this.isJSON(value);
            case ValidationTypes.IS_LOWERCASE:
                return this.isLowercase(value);
            case ValidationTypes.IS_MOBILE_PHONE:
                return this.isMobilePhone(value, metadata.constraints[0]);
            case ValidationTypes.IS_PHONE_NUMBER:
                return this.isPhoneNumber(value, metadata.constraints[0]);
            case ValidationTypes.IS_MONGO_ID:
                return this.isMongoId(value);
            case ValidationTypes.IS_MULTIBYTE:
                return this.isMultibyte(value);
            case ValidationTypes.IS_SURROGATE_PAIR:
                return this.isSurrogatePair(value);
            case ValidationTypes.IS_URL:
                return this.isURL(value, metadata.constraints[0]);
            case ValidationTypes.IS_UUID:
                return this.isUUID(value, metadata.constraints[0]);
            case ValidationTypes.IS_UPPERCASE:
                return this.isUppercase(value);
            case ValidationTypes.LENGTH:
                return this.length(value, metadata.constraints[0], metadata.constraints[1]);
            case ValidationTypes.MIN_LENGTH:
                return this.minLength(value, metadata.constraints[0]);
            case ValidationTypes.MAX_LENGTH:
                return this.maxLength(value, metadata.constraints[0]);
            case ValidationTypes.MATCHES:
                return this.matches(value, metadata.constraints[0], metadata.constraints[1]);
            case ValidationTypes.IS_MILITARY_TIME:
                return this.isMilitaryTime(value);

            /* array checkers */
            case ValidationTypes.ARRAY_CONTAINS:
                return this.arrayContains(value, metadata.constraints[0]);
            case ValidationTypes.ARRAY_NOT_CONTAINS:
                return this.arrayNotContains(value, metadata.constraints[0]);
            case ValidationTypes.ARRAY_NOT_EMPTY:
                return this.arrayNotEmpty(value);
            case ValidationTypes.ARRAY_MIN_SIZE:
                return this.arrayMinSize(value, metadata.constraints[0]);
            case ValidationTypes.ARRAY_MAX_SIZE:
                return this.arrayMaxSize(value, metadata.constraints[0]);
            case ValidationTypes.ARRAY_UNIQUE:
                return this.arrayUnique(value);

            case ValidationTypes.IS_INSTANCE:
                return this.isInstance(value, metadata.constraints[0]);
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Validation Methods: common checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if value is defined (!== undefined, !== null).
     */
    isDefined(value: any): boolean {
        return value !== undefined && value !== null;
    }

    /**
     * Checks if value matches ("===") the comparison.
     */
    equals(value: any, comparison: any): boolean {
        return value === comparison;
    }

    /**
     * Checks if value does not match ("!==") the comparison.
     */
    notEquals(value: any, comparison: any): boolean {
        return value !== comparison;
    }

    /**
     * Checks if given value is empty (=== '', === null, === undefined).
     */
    isEmpty(value: any): boolean {
        return value === "" || value === null || value === undefined;
    }

    /**
     * Checks if given value is not empty (!== '', !== null, !== undefined).
     */
    isNotEmpty(value: any): boolean {
        return value !== "" && value !== null && value !== undefined;
    }

    /**
     * Checks if given value is in a array of allowed values.
     */
    isIn(value: any, possibleValues: any[]): boolean {
        return !(possibleValues instanceof Array) || possibleValues.some(possibleValue => possibleValue === value);
    }

    /**
     * Checks if given value not in a array of allowed values.
     */
    isNotIn(value: any, possibleValues: any[]): boolean {
        return !(possibleValues instanceof Array) || !possibleValues.some(possibleValue => possibleValue === value);
    }

    // -------------------------------------------------------------------------
    // Validation Methods: type checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if a given value is a real boolean.
     */
    isBoolean(value: any): boolean {
        return value instanceof Boolean || typeof value === "boolean";
    }

    /**
     * Checks if a given value is a real date.
     */
    isDate(value: any): boolean {
        return value instanceof Date && !isNaN(value.getTime());
    }

    /**
     * Checks if a given value is a real string.
     */
    isString(value: any): boolean {
        return value instanceof String || typeof value === "string";
    }

    /**
     * Checks if a given value is a ISOString date.
     */
    isDateString(value: any): boolean {
        const regex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|\+[0-2]\d(?:\:[0-5]\d)?)?$/g;
        return this.isString(value) && regex.test(value);
    }

    /**
     * Checks if a given value is an array
     */
    isArray(value: any): boolean {
        return value instanceof Array;
    }

    /**
     * Checks if a given value is an enum
     */
    isEnum(value: any, entity: any): boolean {
        const enumValues = Object.keys(entity)
            .map(k => entity[k]);
        return enumValues.indexOf(value) >= 0;
    }

    /**
     * Checks if a given value is a number.
     */
    isNumber(value: any, options: IsNumberOptions = {}): boolean {
        if (value === Infinity || value === -Infinity) {
            return options.allowInfinity;
        }

        if (Number.isNaN(value)) {
            return options.allowNaN;
        }

        return Number.isFinite(value);
    }

    /**
     * Checks if value is an integer.
     */
    isInt(val: number): boolean {
        return Number.isInteger(val);
    }

    // -------------------------------------------------------------------------
    // Validation Methods: number checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if value is a number that's divisible by another.
     */
    isDivisibleBy(value: number, num: number): boolean {
        return  typeof value === "number" &&
            typeof num === "number" &&
            isDivisibleBy(String(value), num);
    }

    /**
     * Checks if the value is a positive number.
     */
    isPositive(value: number): boolean {
        return typeof value === "number" && value > 0;
    }

    /**
     * Checks if the value is a negative number.
     */
    isNegative(value: number): boolean {
        return typeof value === "number" && value < 0;
    }

    /**
     * Checks if the first number is greater than or equal to the second.
     */
    min(num: number, min: number): boolean {
        return typeof num === "number" && typeof min === "number" && num >= min;
    }

    /**
     * Checks if the first number is less than or equal to the second.
     */
    max(num: number, max: number): boolean {
        return typeof num === "number" && typeof max === "number" && num <= max;
    }

    // -------------------------------------------------------------------------
    // Validation Methods: date checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if the value is a date that's after the specified date.
     */
    minDate(date: Date, minDate: Date): boolean {
        return date && date.getTime() >= minDate.getTime();
    }

    /**
     * Checks if the value is a date that's before the specified date.
     */
    maxDate(date: Date, maxDate: Date): boolean {
        return date && date.getTime() <= maxDate.getTime();
    }

    // -------------------------------------------------------------------------
    // Validation Methods: string-as-type checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if a string is a boolean.
     * If given value is not a string, then it returns false.
     */
    isBooleanString(value: string): boolean {
        return typeof value === "string" && isBoolean(value);
    }

    /**
     * Checks if the string is numeric.
     * If given value is not a string, then it returns false.
     */
    isNumberString(value: string, options?: ValidatorJS.IsNumericOptions): boolean {
        return typeof value === "string" && isNumeric(value, options);
    }

    // -------------------------------------------------------------------------
    // Validation Methods: string checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if the string contains the seed.
     * If given value is not a string, then it returns false.
     */
    contains(value: string, seed: string): boolean {
        return typeof value === "string" && contains(value, seed);
    }

    /**
     * Checks if the string does not contain the seed.
     * If given value is not a string, then it returns false.
     */
    notContains(value: string, seed: string): boolean {
        return typeof value === "string" && !contains(value, seed);
    }

    /**
     * Checks if the string contains only letters (a-zA-Z).
     * If given value is not a string, then it returns false.
     */
    isAlpha(value: string): boolean {
        return typeof value === "string" && isAlpha(value);
    }

    /**
     * Checks if the string contains only letters and numbers.
     * If given value is not a string, then it returns false.
     */
    isAlphanumeric(value: string): boolean {
        return typeof value === "string" && isAlphanumeric(value);
    }

    /**
     * Checks if the string contains ASCII chars only.
     * If given value is not a string, then it returns false.
     */
    isAscii(value: string): boolean {
        return typeof value === "string" && isAscii(value);
    }

    /**
     * Checks if a string is base64 encoded.
     * If given value is not a string, then it returns false.
     */
    isBase64(value: string): boolean {
        return typeof value === "string" && isBase64(value);
    }

    /**
     * Checks if the string's length (in bytes) falls in a range.
     * If given value is not a string, then it returns false.
     */
    isByteLength(value: string, min: number, max?: number): boolean {
        return typeof value === "string" && isByteLength(value, min, max);
    }

    /**
     * Checks if the string is a credit card.
     * If given value is not a string, then it returns false.
     */
    isCreditCard(value: string): boolean {
        return typeof value === "string" && isCreditCard(value);
    }

    /**
     * Checks if the string is a valid currency amount.
     * If given value is not a string, then it returns false.
     */
    isCurrency(value: string, options?: ValidatorJS.IsCurrencyOptions): boolean {
        return typeof value === "string" && isCurrency(value, options);
    }

    /**
     * Checks if the string is an email.
     * If given value is not a string, then it returns false.
     */
    isEmail(value: string, options?: ValidatorJS.IsEmailOptions): boolean {
        return typeof value === "string" && isEmail(value, options);
    }

    /**
     * Checks if the string is a fully qualified domain name (e.g. domain.com).
     * If given value is not a string, then it returns false.
     */
    isFQDN(value: string, options?: ValidatorJS.IsFQDNOptions): boolean {
        return typeof value === "string" && isFQDN(value, options);
    }

    /**
     * Checks if the string contains any full-width chars.
     * If given value is not a string, then it returns false.
     */
    isFullWidth(value: string): boolean {
        return typeof value === "string" && isFullWidth(value);
    }

    /**
     * Checks if the string contains any half-width chars.
     * If given value is not a string, then it returns false.
     */
    isHalfWidth(value: string): boolean {
        return typeof value === "string" && isHalfWidth(value);
    }

    /**
     * Checks if the string contains variable-width chars.
     * If given value is not a string, then it returns false.
     */
    isVariableWidth(value: string): boolean {
        return typeof value === "string" && isVariableWidth(value);
    }

    /**
     * Checks if the string is a hexadecimal color.
     * If given value is not a string, then it returns false.
     */
    isHexColor(value: string): boolean {
        return typeof value === "string" && isHexColor(value);
    }

    /**
     * Checks if the string is a hexadecimal number.
     * If given value is not a string, then it returns false.
     */
    isHexadecimal(value: string): boolean {
        return typeof value === "string" && isHexadecimal(value);
    }

    /**
     * Checks if the string is an IP (version 4 or 6).
     * If given value is not a string, then it returns false.
     */
    isIP(value: string, version?: "4"|"6"): boolean {
        return typeof value === "string" && isIP(value, version ? parseInt(version, 10) : undefined);
    }

    /**
     * Checks if the string is an ISBN (version 10 or 13).
     * If given value is not a string, then it returns false.
     */
    isISBN(value: string, version?: "10"|"13"): boolean {
        return typeof value === "string" && isISBN(value, version ? parseInt(version, 10) : undefined);
    }

    /**
     * Checks if the string is an ISIN (stock/security identifier).
     * If given value is not a string, then it returns false.
     */
    isISIN(value: string): boolean {
        return typeof value === "string" && isISIN(value);
    }

    /**
     * Checks if the string is a valid ISO 8601 date.
     * If given value is not a string, then it returns false.
     */
    isISO8601(value: string): boolean {
        return typeof value === "string" && isISO8601(value);
    }

    /**
     * Checks if the string is valid JSON (note: uses JSON.parse).
     * If given value is not a string, then it returns false.
     */
    isJSON(value: string): boolean {
        return typeof value === "string" && isJSON(value);
    }

    /**
     * Checks if the string is lowercase.
     * If given value is not a string, then it returns false.
     */
    isLowercase(value: string): boolean {
        return typeof value === "string" && isLowercase(value);
    }

    /**
     * Checks if the string is a mobile phone number (locale is one of ['zh-CN', 'zh-TW', 'en-ZA', 'en-AU', 'en-HK',
     * 'pt-PT', 'fr-FR', 'el-GR', 'en-GB', 'en-US', 'en-ZM', 'ru-RU', 'nb-NO', 'nn-NO', 'vi-VN', 'en-NZ']).
     * If given value is not a string, then it returns false.
     */
    isMobilePhone(value: string, locale: ValidatorJS.MobilePhoneLocale): boolean {
        return typeof value === "string" && isMobilePhone(value, locale);
    }

    /**
     * Checks if the string is a valid phone number.
     * @param value the potential phone number string to test
     * @param {string} region 2 characters uppercase country code (e.g. DE, US, CH).
     * If users must enter the intl. prefix (e.g. +41), then you may pass "ZZ" or null as region.
     * See [google-libphonenumber, metadata.js:countryCodeToRegionCodeMap on github]{@link https://github.com/ruimarinho/google-libphonenumber/blob/1e46138878cff479aafe2ce62175c6c49cb58720/src/metadata.js#L33}
     */
    isPhoneNumber(value: string, region: string): boolean {
        try {
            const phoneNum = this.libPhoneNumber.phoneUtil.parseAndKeepRawInput(value, region);
            return this.libPhoneNumber.phoneUtil.isValidNumber(phoneNum);
        } catch (error) {
            // logging?
            return false;
        }
    }

    /**
     * Checks if the string is a valid hex-encoded representation of a MongoDB ObjectId.
     * If given value is not a string, then it returns false.
     */
    isMongoId(value: string): boolean {
        return typeof value === "string" && isMongoId(value);
    }

    /**
     * Checks if the string contains one or more multibyte chars.
     * If given value is not a string, then it returns false.
     */
    isMultibyte(value: string): boolean {
        return typeof value === "string" && isMultibyte(value);
    }

    /**
     * Checks if the string contains any surrogate pairs chars.
     * If given value is not a string, then it returns false.
     */
    isSurrogatePair(value: string): boolean {
        return typeof value === "string" && isSurrogatePair(value);
    }

    /**
     * Checks if the string is an url.
     * If given value is not a string, then it returns false.
     */
    isURL(value: string, options?: ValidatorJS.IsURLOptions): boolean {
        return typeof value === "string" && isURL(value, options);
    }

    /**
     * Checks if the string is a UUID (version 3, 4 or 5).
     * If given value is not a string, then it returns false.
     */
    isUUID(value: string, version?: "3"|"4"|"5"): boolean {
        return typeof value === "string" && isUUID(value, version);
    }

    /**
     * Checks if the string is uppercase.
     * If given value is not a string, then it returns false.
     */
    isUppercase(value: string): boolean {
        return typeof value === "string" && isUppercase(value);
    }

    /**
     * Checks if the string's length falls in a range. Note: this function takes into account surrogate pairs.
     * If given value is not a string, then it returns false.
     */
    length(value: string, min: number, max?: number): boolean {
        return typeof value === "string" && isLength(value, min, max);
    }

    /**
     * Checks if the string's length is not less than given number. Note: this function takes into account surrogate pairs.
     * If given value is not a string, then it returns false.
     */
    minLength(value: string, min: number) {
        return typeof value === "string" && this.length(value, min);
    }

    /**
     * Checks if the string's length is not more than given number. Note: this function takes into account surrogate pairs.
     * If given value is not a string, then it returns false.
     */
    maxLength(value: string, max: number) {
        return typeof value === "string" && this.length(value, 0, max);
    }

    /**
     * Checks if string matches the pattern. Either matches('foo', /foo/i) or matches('foo', 'foo', 'i').
     * If given value is not a string, then it returns false.
     */
    matches(value: string, pattern: RegExp, modifiers?: string): boolean {
        return typeof value === "string" && matches(value, pattern, modifiers);
    }

    /**
     * Checks if the string represents a time without a given timezone in the format HH:MM (military)
     * If the given value does not match the pattern HH:MM, then it returns false.
     */
    isMilitaryTime(value: string): boolean {
        return this.matches(value, /^([01]\d|2[0-3]):?([0-5]\d)$/);
    }

    // -------------------------------------------------------------------------
    // Validation Methods: array checkers
    // -------------------------------------------------------------------------

    /**
     * Checks if array contains all values from the given array of values.
     * If null or undefined is given then this function returns false.
     */
    arrayContains(array: any[], values: any[]) {
        if (!(array instanceof Array))
            return false;

        return !array || values.every(value => array.indexOf(value) !== -1);
    }

    /**
     * Checks if array does not contain any of the given values.
     * If null or undefined is given then this function returns false.
     */
    arrayNotContains(array: any[], values: any[]) {
        if (!(array instanceof Array))
            return false;

        return !array || values.every(value => array.indexOf(value) === -1);
    }

    /**
     * Checks if given array is not empty.
     * If null or undefined is given then this function returns false.
     */
    arrayNotEmpty(array: any[]) {
        if (!(array instanceof Array))
            return false;

        return array instanceof Array && array.length > 0;
    }

    /**
     * Checks if array's length is as minimal this number.
     * If null or undefined is given then this function returns false.
     */
    arrayMinSize(array: any[], min: number) {
        if (!(array instanceof Array))
            return false;

        return array instanceof Array && array.length >= min;
    }

    /**
     * Checks if array's length is as maximal this number.
     * If null or undefined is given then this function returns false.
     */
    arrayMaxSize(array: any[], max: number) {
        if (!(array instanceof Array))
            return false;

        return array instanceof Array && array.length <= max;
    }

    /**
     * Checks if all array's values are unique. Comparison for objects is reference-based.
     * If null or undefined is given then this function returns false.
     */
    arrayUnique(array: any[]) {
        if (!(array instanceof Array))
            return false;

        const uniqueItems = array.filter((a, b, c) => c.indexOf(a) === b);
        return array.length === uniqueItems.length;
    }

    /**
     * Checks if the value is an instance of the specified object.
     */
    isInstance(object: any, targetTypeConstructor: new (...args: any[]) => any) {
        return targetTypeConstructor
            && typeof targetTypeConstructor === "function"
            && object instanceof targetTypeConstructor;
    }

}
