import {join} from 'lodash'
export function hello(): string {
    return join(['Hello', 'World'], ' ')
}