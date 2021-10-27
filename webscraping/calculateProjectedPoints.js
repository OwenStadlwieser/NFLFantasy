import fs, { stat } from 'fs'

function calculatePlayerPoints(player) {
    let passingYards = player['PlayerPassing Yds'] ? player['PlayerPassing Yds'] : 0
    let rushingYards = player['PlayerRushing Yds'] ? player['PlayerRushing Yds'] : 0
    let receivingYards = player['PlayerReceiving Yds'] ? player['PlayerReceiving Yds'] : 0
    let touchdown1 = player['AnyTime Touchdown Scorer'] ? player['AnyTime Touchdown Scorer'] : 0
    let touchdown2 = player['ToScore 2+ Touchdowns'] ? player['ToScore 2+ Touchdowns'] : 0
    let passingTds = player['PlayerPassing TDs'] ? player['PlayerPassing TDs'] : 0
    let totalPoints = (passingYards * 0.04 + rushingYards * 0.1 +
        passingTds * 4 + receivingYards * 0.1 + touchdown1 * 6 + touchdown2 * 8)
    if (receivingYards > 100) totalPoints = totalPoints + 3
    if (rushingYards > 100) totalPoints = totalPoints + 3
    if (passingYards > 300) totalPoints = totalPoints + 3
    return totalPoints

}

(async () => {
    let rawdata = fs.readFileSync('json/nflWeek4WithProjectedPoints.json');
    let defenseRawData = fs.readFileSync('json/nflWeek4Defenses.json')
    let players = JSON.parse(rawdata);
    let defenses = JSON.parse(defenseRawData);
    for (let key in defenses) {
        let defense = defenses[key]
        if (defense.salary && defense.salary > 0) {
            defense.ratio = defense.points / defense.salary
        }
    }
    for (let key in players) {
        let player = players[key]
        player.points = player.Points
        if (player.salary && player.salary > 0) {
            player.ratio = player.points / player.salary
        }
    }
    fs.writeFile("json/nflWeek4WithCorrectSalariesAndPoints.json", JSON.stringify(players), function (err) {
        if (err) {
            console.log(err);
        }
    });
    fs.writeFile("json/nflWeek4DefensesWithCorrectSalariesAndPoints.json", JSON.stringify(defenses), function (err) {
        if (err) {
            console.log(err);
        }
    });
    console.log('done')
}
)()