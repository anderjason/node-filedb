"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncGivenObservable = void 0;
function asyncGivenObservable(observable, filter) {
    if (observable.value != null) {
        return Promise.resolve(observable.value);
    }
    return new Promise((resolve) => {
        const receipt = observable.didChange.subscribe((value) => {
            if (value == null) {
                return;
            }
            if (filter != null && !filter(value)) {
                return;
            }
            receipt.cancel();
            resolve(value);
        });
    });
}
exports.asyncGivenObservable = asyncGivenObservable;
//# sourceMappingURL=asyncGivenObservable.js.map