export interface ResultOk<TValue> {
	ok: true;
	value: TValue;
}

export interface ResultError<TError> {
	ok: false;
	error: TError;
}

export type Result<TValue, TError = Error> =
	| ResultOk<TValue>
	| ResultError<TError>;
