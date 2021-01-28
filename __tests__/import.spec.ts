const port = 4444

const testURL = async (file: string) => {
    await page.goto(`http://localhost:${port}/__tests__/data/${file}`)
    page.on('console', e => { console.log(e.text())})
    page.on('pageerror', e => { console.error({error: e.message, stack: e.stack}); })
    page.on('error', e => console.error(e))
    return (await page.waitForFunction('window.testResult')).jsonValue()
}

describe('Imperative "import" functionality', () => {
    it('should import files imperatively', async () => {
        expect(await testURL('import.html')).toEqual('Hello World')
    })
    it('Typescript files should import other typescript files', async () => {
        expect(await testURL('import-declarative.html')).toEqual(['Hello', 'World'])
    }, 9999999)
    
})