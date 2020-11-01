import { ObservableBase } from "@anderjason/observable";

export function asyncGivenObservable<T>({
  observable,
  filter,
}: {
  observable: ObservableBase<T>;
  filter?: (value: T) => boolean;
}): Promise<T> {
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
