import puppeteer from 'puppeteer-extra'
import excel4node from 'excel4node'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs, { stat } from 'fs'

import AdblockerPlugin  from 'puppeteer-extra-plugin-adblocker'


(async () => {
    let rawdata = fs.readFileSync('nflWeek1WithSalariesAndPoints.json');
    let players = JSON.parse(rawdata);
    puppeteer.use(AdblockerPlugin())
    puppeteer.use(StealthPlugin())
    const browser = await puppeteer.launch({headless: false});
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://chercher.tech/practice/geo-location", ['geolocation'])
    const page = await browser.newPage()
    await page.setGeolocation({latitude: 53.544388, longitude: -113.490929});
    const positions = ['Quarterbacks', 'Running Backs', 'Wide Receivers', 'Tight Ends']
    await page.goto('https://dknation.draftkings.com/2021/8/3/22605865/fantasy-football-dfs-salaries-week-1-nfl-patrick-mahomes-christian-mccaffrey-quarterbacks')
    await page.waitForTimeout(5000)
    const dataTable = await page.$x(`//parent::*/div/div/div/table`, { timeout: 10000 }) 
    console.log(dataTable.length)
    for(let i = 0; i < dataTable.length; i++) {
        const playersData = await page.$x(`//parent::*/div/div/div/table/tbody/tr`, { timeout: 10000 }) 
        for (let i = 0; i < playersData.length; i++) {
            const names = await page.$x(`//parent::*/div/div/div/table/tbody/tr[${i}]/td[1]`, { timeout: 10000 }) 
            const salaries = await page.$x(`//parent::*/div/div/div/table/tbody/tr[${i}]/td[4]`, { timeout: 10000 }) 
            for (let j = 0; j < names.length; j++) {
                let textContent = await (await names[j].getProperty('textContent')).jsonValue()
                let stringValue = new String(textContent)
                stringValue = stringValue.toString()
                stringValue = stringValue.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
                let textContent2 = await (await salaries[j].getProperty('textContent')).jsonValue()
                let stringValue2 = new String(textContent2)
                stringValue2 = stringValue2.toString()
                stringValue2 = stringValue2.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
                stringValue2 = parseInt(stringValue2)
                if(players[stringValue]) {
                    console.log(stringValue2)
                    players[stringValue].salary = stringValue2
                }
            } 
        }
    }   
    fs.writeFile("nflWeek1WithCorrectSalariesAndPoints.json", JSON.stringify(players), function(err) {
        if (err) {
            console.log(err);
        }
      });
      console.log('done writing')
}
)()
