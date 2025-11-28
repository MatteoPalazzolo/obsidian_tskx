interface Set<T> {
	intersection(other: Set<T>): Set<T>;
	union(other: Set<T>): Set<T>;
	difference(other: Set<T>): Set<T>;
	symmetricDifference(other: Set<T>): Set<T>;
	isSubsetOf(other: Set<T>): boolean;
	isSupersetOf(other: Set<T>): boolean;
}
