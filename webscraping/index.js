import puppeteer from 'puppeteer-extra'
import excel4node from 'excel4node'
// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'
// took out cowboys, bucs, raiders ravens
const teams = [
  'Arizona Cardinals',
  'Atlanta Falcons',
  'Buffalo Bills',
  'Carolina Panthers',
  'Chicago Bears',
  'Cincinnati Bengals',
  'Cleveland Browns',
  'Denver Broncos',
  'Detroit Lions',
  'Green Bay Packers',
  'Houston Texans',
  'Indianapolis Colts',
  'Jacksonville Jaguars',
  'Kansas City Chiefs',
  'Los Angeles Chargers',
  'Los Angeles Rams',
  'Miami Dolphins',
  'Minnesota Vikings',
  'New England Patriots',
  'New Orleans Saints',
  'New York Giants',
  'New York Jets',
  'Philadelphia Eagles',
  'Pittsburgh Steelers',
  'San Francisco 49ers',
  'Seattle Seahawks',
  'Tennessee Titans',
  'Washington Football Team'
]

function oddsToProbability(odds) {
  if(odds < 0) {
    let correctedOdds = odds * -1
    return (correctedOdds/(correctedOdds+100))
  } else {
    return (100 / (odds + 100))
  }
}

async function calculateTouchdownScorer(page, selector) {
  const [el2] = await page.$x(`//span[text()="${selector}"]`)
  await el2.click()
  const [selectMore] = await page.$x(`//span[text()="${selector}"]/../../../../descendant::span[text()="Show more"]`)
  if(selectMore) await selectMore.click()
  //span[text()="Any Time Touchdown Scorer"]/../../../../div[3]/div/div/div/div/div/span
  let returnObject = {}
  for (let i = 3; true ;i++) {
    let expectedValues = []
    let qbNamesArray = []
    const qbNames = await page.$x(`//span[text()="${selector}"]/../../../../div[${i}]/div/div/div/div/div/span`)
    const qbPassingTds = await page.$x(`//span[text()="${selector}"]/../../../../div[${i}]/div/div/div/div/div[2]/div/span`)
    if(!qbNames || qbNames.length === 0) { 
      break
    }
    const length = await page.evaluate((xpath) => {
        const tds = document.evaluate(xpath, document)
        var thisHeading = tds.iterateNext()
        return thisHeading.children.length
    }, `//span[text()="${selector}"]/../../../../div[${i}]/div/div/div`)
    for (let j = 0; j < length; j++) {
      try {
        let oddsOfTouchdown = await (await qbPassingTds[j].getProperty('textContent')).jsonValue()
        oddsOfTouchdown = parseFloat(oddsOfTouchdown)
    
        let expectedValue = oddsToProbability(oddsOfTouchdown)
        expectedValues.push(expectedValue)
      } catch(err) {
        break
      }
    }
    for (let j = 0; j < qbNames.length; j++) {
      try {
        const spanName = await (await qbNames[j].getProperty('textContent')).jsonValue();
        qbNamesArray.push(new String(spanName))
      } catch(err) {
        break
      }
    }
    for (let j = 0; j < qbNamesArray.length; j++) {
      try { returnObject[qbNamesArray[j].replace(' ', '')] = {[selector.replace(' ', '')]: expectedValues[j]} } catch { break }
    }
    
  }
  
  return returnObject
}

async function calculateExpectedValues(page, selector) {
  const [el2] = await page.$x(`//span[text()="${selector}"]`)
  await el2.click()
  const length = await page.evaluate((xpath) => {
      const tds = document.evaluate(xpath, document)
      var thisHeading = tds.iterateNext()
      return thisHeading.children.length
  }, `//span[text()="${selector}"]/../../../../div[3]`)
  const qbNames = await page.$x(`//span[text()="${selector}"]/../../../../div[3]/div/div/div/div/span`)
  const qbPassingTds = await page.$x(`//span[text()="${selector}"]/../../../../div[3]/div/div/div/div[2]/div/div/div/span`)
  let expectedValues = []
  let qbNamesArray = []
  for (let i = 0; i < length; i++) {
    let expectedValueOver = await (await qbPassingTds[0 + i * 4].getProperty('textContent')).jsonValue()
    const stringExpected = new String(expectedValueOver)
    expectedValueOver = parseFloat(stringExpected.substring(2))

    let expectedProbabilityOver = await (await qbPassingTds[1 + i * 4].getProperty('textContent')).jsonValue()
    expectedProbabilityOver = parseFloat(new String(expectedProbabilityOver))

    let expectedValueUnder =  await (await qbPassingTds[2 + i * 4].getProperty('textContent')).jsonValue()
    const stringExpectedUnder = new String(expectedValueUnder)
    expectedValueUnder = parseFloat(stringExpectedUnder.substring(2))

    let expectedProbabilityUnder = await (await qbPassingTds[3 + i * 4].getProperty('textContent')).jsonValue()
    expectedProbabilityUnder = parseFloat(new String(expectedProbabilityUnder))

    let expectedValue = oddsToProbability(expectedProbabilityOver) * Math.round(expectedValueOver) + oddsToProbability(expectedProbabilityUnder) * Math.floor(expectedValueUnder)
    expectedValues.push(expectedValue)
  }
  
  for (let i = 0; i < qbNames.length; i++) {
    const spanName = await (await qbNames[i].getProperty('textContent')).jsonValue();
    qbNamesArray.push(new String(spanName))
  }

  let returnObject = {}
  for (let i = 0; i < qbNamesArray.length; i++) returnObject[qbNamesArray[i].replace(' ', '')] = {[selector.replace(' ', '')]: expectedValues[i]}
  
  return returnObject
}

(async () => {
  puppeteer.use(StealthPlugin())
  const browser = await puppeteer.launch({headless: false});
  const context = browser.defaultBrowserContext()
  await context.overridePermissions("https://chercher.tech/practice/geo-location", ['geolocation'])
  const page = await browser.newPage()

  await page.setGeolocation({latitude: 53.544388, longitude: -113.490929});
  await page.goto('https://sportsbook.fanduel.com/navigation/nfl');
  let teamsAlreadySeen = []
  let allPlayers = {}
  for(let i = 0; i < teams.length; i++) {
    if(teamsAlreadySeen.indexOf(teams[i]) >= 0) continue
    let team = teams[i]
    const otherTeamName = await page.$x(`//span[text()='${team}']/../../../../../../../../div[1]/div/div/div/div/div/descendant::span[1]`)
    let textContent = await (await otherTeamName[1].getProperty('textContent')).jsonValue()
    let team1 = new String(textContent)
    teamsAlreadySeen.push(team1.toString())
    textContent = await (await otherTeamName[0].getProperty('textContent')).jsonValue()
    let team2 = new String(textContent)
    teamsAlreadySeen.push(team2.toString())
    teamsAlreadySeen.push(team)
    let qbs = {}
    let rbs = {}
    let wrs = {}
    let defence = {}
    const [el] = await page.$x(`//span[text()="${team}"]`)
    await el.click()
    await page.waitForTimeout(4000)
    let qbPassingYds, qbPassingTds, playerRushingYds, playerReceivingYds, anyTimeTouchDownScorer, toScore2TouchDowns = {}
    try { qbPassingYds = await calculateExpectedValues(page, 'Player Passing Yds') } catch (err) { console.log(team, 'Player Passing Yds Error')}
    try { qbPassingTds = await calculateExpectedValues(page, 'Player Passing TDs') } catch (err) { console.log(team, 'Player Passing TDs Error')}
    try { playerRushingYds = await calculateExpectedValues(page, 'Player Rushing Yds') } catch (err) { console.log(team, 'Player Rushing Yds Error')}
    try { playerReceivingYds = await calculateExpectedValues(page, 'Player Receiving Yds') } catch (err) { console.log(team, 'Player Receiving Yds Error')}
    try { anyTimeTouchDownScorer = await calculateTouchdownScorer(page, 'Any Time Touchdown Scorer') } catch (err) { console.log(team, 'Any Time Touchdown Score Error')}
    try { toScore2TouchDowns = await calculateTouchdownScorer(page, 'To Score 2+ Touchdowns') } catch (err) { console.log(team, 'To Score 2+ Touchdowns Error')}
    for (let key in anyTimeTouchDownScorer) {
      try{
        if(toScore2TouchDowns[key]) anyTimeTouchDownScorer[key] = { 
          ...anyTimeTouchDownScorer[key], 
          ...toScore2TouchDowns[key]
        }
      } catch(err){}
      try {
        if(playerReceivingYds[key]) anyTimeTouchDownScorer[key] = { 
          ...anyTimeTouchDownScorer[key], 
          ...playerReceivingYds[key], 
        }
      } catch(err){}
      try {
        if(playerRushingYds[key]) anyTimeTouchDownScorer[key] = { 
          ...anyTimeTouchDownScorer[key],  
          ...playerRushingYds[key]
        }
      } catch(err){}
      try {
        if(qbPassingTds[key]) anyTimeTouchDownScorer[key] = { 
          ...anyTimeTouchDownScorer[key],  
          ...qbPassingTds[key]
        }
      } catch(err){}
      try{
        if(qbPassingYds[key]) anyTimeTouchDownScorer[key] = { 
          ...anyTimeTouchDownScorer[key], 
          ...qbPassingYds[key] 
        }
      } catch(err){}
    }
    allPlayers = { ...allPlayers, ...anyTimeTouchDownScorer}
    await page.goto('https://sportsbook.fanduel.com/navigation/nfl');
    await page.waitForTimeout(10000)
  }
  // for (let i = 0; i < games.length; i++) {
  //   await games[i].click()
  // }
  fs.writeFile("nflWeek1.json", JSON.stringify(allPlayers), function(err) {
    if (err) {
        console.log(err);
    }
  });
  await page.screenshot({ path: 'example.png' });

})();