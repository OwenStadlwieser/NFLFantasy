import puppeteer from 'puppeteer-extra'
import excel4node from 'excel4node'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs, { stat } from 'fs'

(async () => {
    let rawdata = fs.readFileSync('json/nflWeek1BearsVsRams.json');
    let players = JSON.parse(rawdata);
    console.log(players);
    puppeteer.use(StealthPlugin())
    const browser = await puppeteer.launch({headless: false});
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://chercher.tech/practice/geo-location", ['geolocation'])
    const page = await browser.newPage()
    await page.setGeolocation({latitude: 53.544388, longitude: -113.490929});
    await page.goto('https://www.fantasypros.com/daily-fantasy/nfl/fanduel-salary-changes.php');

    const positions = ['QB', 'RB', 'WR', 'TE', 'DST']
    for (let position = 0; position < positions.length; position++) {
        await page.waitForXPath(`//tr[contains(@class, "${positions[position]}")]/td[2]/a`, { timeout: 10000 })
        const el = await page.$x(`//tr[contains(@class, "${positions[position]}")]/td[2]/a`)
        for(let i =0; i< el.length; i = i +2) {
            let textContent = await (await el[i].getProperty('textContent')).jsonValue()
            let stringValue = new String(textContent)
            stringValue = stringValue.toString()
            stringValue = stringValue.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
            if(players[stringValue]) players[stringValue].position = positions[position]
            else continue
            const salary = await page.$x(`//tr[contains(@class, "${positions[position]}")]/descendant::td[contains(@class, "salary")]`)
            let textContentSal = await (await salary[i / 2].getProperty('textContent')).jsonValue()
            let stringValueSal = new String(textContentSal)
            stringValueSal = stringValueSal.toString()
            stringValueSal = stringValueSal.replace(/[^a-z0-9]/gmi, "")
            players[stringValue].salary = parseInt(stringValueSal)
            if( parseInt(stringValueSal)===0) console.log(stringValue, 'Salary Error')
            // await el[i].click()
            // const statsArray = []
            // const stats =await page.$x('//table[contains(@class, "table table-bordered all-stats")]//tbody/tr/td')
            // for (let j = 0; j < stats.length; j++) {
            //     let textContent2 = await (await stats[i].getProperty('textContent')).jsonValue()
            //     let stringValue2s = new String(textContent2)
            //     stringValue2 = stringValue2.toString()
            //     statsArray.push(stringValue2)
            // }
            // if(statsArray.length === 10) players[stringValue].fantasyPros = { 
            //     passCmp: statsArray[0],
            //     passAttp: statsArray[1],
            //     passYds: statsArray[2],
            //     passTds: statsArray[3],
            //     passInts: statsArray[4],
            //     rushAtt: statsArray[5],
            //     rushYds: statsArray[6],
            //     rushTds: statsArray[7],
            //     fumbles: statsArray[8],
            //     points: statsArray[9]
            // }
        }
    }
    fs.writeFile("json/nflWeek1WithSalariesChiLa.json", JSON.stringify(players), function(err) {
        if (err) {
            console.log(err);
        }
      });
    let obj
    let teamsAlreadySeen = []
    let allPlayers = {}
    }
)()