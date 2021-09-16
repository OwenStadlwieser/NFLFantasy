import puppeteer from 'puppeteer-extra'
import excel4node from 'excel4node'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs, { stat } from 'fs'
import AdblockerPlugin  from 'puppeteer-extra-plugin-adblocker'

(async () => {
    // let rawdata = fs.readFileSync('json/nflWeek1BearsVsRams.json');
    // let players = JSON.parse(rawdata);
    // console.log(players);
    let players = {}
    puppeteer.use(StealthPlugin())
    puppeteer.use(AdblockerPlugin())
    const browser = await puppeteer.launch({headless: false});
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://chercher.tech/practice/geo-location", ['geolocation'])
    const page = await browser.newPage()
    await page.setGeolocation({latitude: 53.544388, longitude: -113.490929});
    await page.goto('https://www.fantasypros.com/nfl/projections/dst.php');
    let defenses = {}
    for(let i =1; i< 33; i++) {
        try {
            let findElement =  await page.$x(`//tbody[1]/tr[${i}]/td[1]`)
            let points = await page.$x(`//tbody[1]/tr[${i}]/td[10]`)
            let textContent = await (await findElement[0].getProperty('textContent')).jsonValue()
            let stringValue = new String(textContent)
            stringValue = stringValue.toString()
            stringValue = stringValue.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
            let textContent2 = await (await points[0].getProperty('textContent')).jsonValue()
            let stringValue2 = new String(textContent2)
            stringValue2 = stringValue2.toString()
            defenses[stringValue] = { points: parseFloat(stringValue2) }
        } catch(err) {
            console.log(err)
        }
    }
    fs.writeFile("json/nflWeek2Defenses.json", JSON.stringify(defenses), function(err) {
        if (err) {
            console.log(err);
        }
      });
      console.log('done writing')
})();