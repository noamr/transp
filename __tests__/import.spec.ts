import puppeteer from 'puppeteer'
import express from 'express'
import path from 'path'
import getPort from 'get-port'
describe('Imperative "import" functionality', () => {
    it('should import files imperatively', async () => {
        const app = express()
        const port = await getPort()
        app.use(express.static(path.join(__dirname, '..')))
        await new Promise(r => app.listen(port, () => r({})))
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(`http://localhost:${port}/__tests__/data/import.html`)
        const handle = await page.waitForFunction('window.result')
        const result = await page.evaluate('window.result')
        expect(result).toEqual('Hello World')
    })
    
})