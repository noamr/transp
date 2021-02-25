import {testURL} from './helper'
describe('Imperative "compile" functionality', () => {
    it('should compile files to a blob and eval', async () => {
        expect(await testURL('compile.html')).toEqual('Hello World')
    })    
})