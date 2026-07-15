export type Result<TValue, TError = Error> =
  { success: true; value: TValue } | { success: false; error: TError };

export function ok<TValue, TError = Error>(value: TValue): Result<TValue, TError> {
  return { success: true, value };
}

export function fail<TValue, TError = Error>(error: TError): Result<TValue, TError> {
  return { success: false, error };
}
