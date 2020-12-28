export function ensureValuesExist(
  obj: any,
  context: string,
  propertyKeys: string[]
): void {
  if (obj == null) {
    throw new Error(`Missing object in '${context}'`);
  }

  propertyKeys.forEach((propertyKey) => {
    if (obj[propertyKey] == null) {
      throw new Error(`Missing '${propertyKey}' in ${context}`);
    }
  });
}
