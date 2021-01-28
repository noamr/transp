import {testURL} from './helper'
describe('Imperative "import" functionality', () => {
    it('should import files imperatively', async () => {
        expect(await testURL('import.html')).toEqual('Hello World')
    })
    it('Typescript files should import other typescript files', async () => {
        expect(await testURL('import-declarative.html')).toEqual(['Hello', 'World'])
    })
    it('Import external packages', async () => {
        expect(await testURL('import-external.html')).toEqual('Hello World')
    })
})