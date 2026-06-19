export function requireFound<TValue>(value: TValue | undefined, message: string): TValue {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}
