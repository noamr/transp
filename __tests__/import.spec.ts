const port = 4444

describe('Imperative "import" functionality', () => {
    it('should import files imperatively', async () => {
        await page.goto(`http://localhost:${port}/__tests__/data/import.html`)
        const handle = await page.waitForFunction('window.result')
        const result = await page.evaluate('window.result')
        expect(result).toEqual('Hello World')
    })
    
})