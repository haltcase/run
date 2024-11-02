export interface ResultOk<T> {
	ok: true;
	value: T;
}

export interface ResultError<E> {
	ok: false;
	error: E;
}

export type Result<T, E = Error> = ResultOk<T> | ResultError<E>;
