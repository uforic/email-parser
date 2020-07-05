import { AssertionError } from 'assert';
export function assertDefined(condition: any): asserts condition {
    if (condition == null) {
        throw new AssertionError();
    }
}

export function isDefined<K>(n: K | null | undefined): n is K {
    return n != null;
}
