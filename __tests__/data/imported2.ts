import {hello} from './imported'

export function data(): string[] {
    return hello().split(' ')
}