import {hello} from './imported'
Reflect.set(window, 'testResult', hello())
