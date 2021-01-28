import {testURL} from './helper'
describe('Custom element', () => {
    it('should evaluate inner Typescript', async () => {
        expect(await testURL('element.html')).toEqual('Hello World')
    })
    it('should evaluate external Typescript', async () => {
        expect(await testURL('element-src.html')).toEqual('Hello World')
    })
})