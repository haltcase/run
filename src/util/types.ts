export type Merge<T, K> = Omit<T, keyof K> & K;

export type Defined<TObject> = {
	[TKey in keyof TObject]-?: NonNullable<TObject[TKey]>;
};
