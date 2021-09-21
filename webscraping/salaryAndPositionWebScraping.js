import puppeteer from 'puppeteer-extra'
import excel4node from 'excel4node'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs, { stat } from 'fs'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

(async () => {
    // let rawdata = fs.readFileSync('json/nflWeek1BearsVsRams.json');
    // let players = JSON.parse(rawdata);
    // console.log(players);
    let players = {}
    puppeteer.use(StealthPlugin())
    puppeteer.use(AdblockerPlugin())
    const browser = await puppeteer.launch({ headless: true });
    const context = browser.defaultBrowserContext()
    await context.overridePermissions("https://chercher.tech/practice/geo-location", ['geolocation'])
    const page = await browser.newPage()
    await page.setGeolocation({ latitude: 53.544388, longitude: -113.490929 });
    await page.goto('https://www.fantasypros.com/daily-fantasy/nfl/fanduel-salary-changes.php');
    await page.select('.site-select', '/daily-fantasy/nfl/draftkings-salary-changes.php')
    const positions = ['QB', 'RB', 'WR', 'TE']
    for (let position = 0; position < positions.length; position++) {
        await page.waitForXPath(`//tr[contains(@class, "${positions[position]}")]/td[2]/a`, { timeout: 1000 })
        const el = await page.$x(`//tr[contains(@class, "${positions[position]}")]/td[2]/a[1]`)
        for (let i = 0; i < el.length; i++) {
            try {
                let findElement = await page.$x(`//tr[contains(@class, "${positions[position]}")][${i}]/td[2]/a[1]`)
                let textContent = await (await findElement[0].getProperty('textContent')).jsonValue()
                let stringValue = new String(textContent)
                stringValue = stringValue.toString()
                stringValue = stringValue.replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
                const team = await page.$x(`//tr[contains(@class, "${positions[position]}")][${i}]/td[2]/small`)
                const teamTextContent = await (await team[0].getProperty('textContent')).jsonValue()
                let stringValueTeam = new String(teamTextContent)
                stringValueTeam = stringValueTeam.toString()
                stringValueTeam = stringValueTeam.split(" ", 1)
                stringValueTeam = stringValueTeam[0].replace(/[^a-z0-9]/gmi, "").replace(/\s+/g, "");
                if (!players[stringValue]) players[stringValue] = {}
                players[stringValue].position = positions[position]
                players[stringValue].team = stringValueTeam
                console.log(stringValueTeam)
                const salary = await page.$x(`//tr[contains(@class, "${positions[position]}")][${i}]/descendant::td[contains(@class, "salary")]`)
                let textContentSal = await (await salary[0].getProperty('textContent')).jsonValue()
                let stringValueSal = new String(textContentSal)
                stringValueSal = stringValueSal.toString()
                stringValueSal = stringValueSal.replace(/[^a-z0-9]/gmi, "")
                console.log(stringValue)
                console.log(stringValueSal)
                players[stringValue].salary = parseInt(stringValueSal)
                if (parseInt(stringValueSal) === 0) console.log(stringValue, 'Salary Error')

                let href = await (await findElement[0].getProperty('href')).jsonValue()
                let hrefString = new String(href)
                hrefString = hrefString.toString()
                const playerPage = await browser.newPage()
                await playerPage.goto(hrefString);
                // await el[i].click()
                // const statsArray = []
                const statsObject = {}
                try {
                    await playerPage.waitForXPath('//table[contains(@class, "table table-bordered all-stats")]//tbody/tr[1]/td', { timeout: 1000 })
                    const stats = await playerPage.$x('//table[contains(@class, "table table-bordered all-stats")]//tbody/tr[1]/td')
                    const statsTitles = await playerPage.$x('//table[contains(@class, "table table-bordered all-stats")]//thead/tr/th')
                    for (let j = 0; j < stats.length; j++) {
                        let statContent = await (await stats[j].getProperty('textContent')).jsonValue()
                        let statContentString = new String(statContent)
                        statContentString = statContentString.toString()
                        let titleContent = await (await statsTitles[j].getProperty('textContent')).jsonValue()
                        let title = new String(titleContent)
                        title = title.toString()
                        statsObject[title] = parseFloat(statContentString)
                    }
                } catch (err) { console.log('Stats Error', stringValue, err) }
                players[stringValue] = { ...players[stringValue], ...statsObject }
                await playerPage.close()
            }
            catch (err) {
                console.log(i)
                console.log(el.length)
                console.log(err)
            }
        }
    }
    fs.writeFile("json/nflWeek3WithProjectedPoints.json", JSON.stringify(players), function (err) {
        if (err) {
            console.log(err);
        }
    });
    console.log('ALL DONE')
    let obj
    let teamsAlreadySeen = []
    let allPlayers = {}
}
)()