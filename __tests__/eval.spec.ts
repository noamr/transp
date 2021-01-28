import {testURL} from './helper'
describe('Imperative "eval" functionality', () => {
    it('should eval files imperatively', async () => {
        expect(await testURL('eval.html')).toEqual('Hello World')
    })    
})