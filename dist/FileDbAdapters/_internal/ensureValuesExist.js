"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureValuesExist = void 0;
function ensureValuesExist(obj, context, propertyKeys) {
    if (obj == null) {
        throw new Error(`Missing object in '${context}'`);
    }
    propertyKeys.forEach((propertyKey) => {
        if (obj[propertyKey] == null) {
            throw new Error(`Missing '${propertyKey}' in ${context}`);
        }
    });
}
exports.ensureValuesExist = ensureValuesExist;
//# sourceMappingURL=ensureValuesExist.js.map