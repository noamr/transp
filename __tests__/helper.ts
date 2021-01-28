const port = 4444

export async function testURL(file: string) {
    await page.goto(`http://localhost:${port}/__tests__/data/${file}`)
    page.on('console', e => { console.log(e.text())})
    page.on('pageerror', e => { console.error({error: e.message, stack: e.stack}); })
    page.on('error', e => console.error(e))
    return (await page.waitForFunction('window.testResult')).jsonValue()
}
