
import fs, { stat } from 'fs'

function compareRatio(a, b) {
    if (a.ratio > b.ratio) {
        return -1;
    }
    if (a.ratio < b.ratio) {
        return 1;
    }
    return 0;
}

function comparePoints(a, b) {
    if (a.points > b.points) {
        return -1;
    }
    if (a.points < b.points) {
        return 1;
    }
    return 0;
}
function insertLineup(qb, rb1, rb2, wr1, wr2, wr3, te, flex, defense, returnObject) {
    if (flex.name === te.name || flex.name === wr3.name ||
        flex.name === wr3 || flex.name === wr2.name ||
        flex.name === rb1.name || flex.name === rb2.name) return returnObject
    let salary = qb.salary + rb1.salary + rb2.salary +
        wr2.salary + wr1.salary + wr3.salary +
        te.salary + flex.salary + defense.salary
    if (salary < 50000) {
        let score = qb.points + rb1.points + rb2.points +
            wr2.points + wr1.points + wr3.points +
            te.points + flex.points + defense.points
        if (returnObject.length < 50 || returnObject[49].score < score) {
            const lineup = {
                qb: qb,
                rb1: rb1, rb2: rb2, wr2: wr2,
                wr: wr1, wr3: wr3, te: te, flex: flex,
                defense
            }
            for (let i = 0; i < returnObject.length + 1; i++) {
                if (!returnObject[i]) {
                    returnObject.push({ score, lineup, salary })
                    break
                } else if (returnObject[i].score < score) {
                    returnObject.splice(i, 0, { score, lineup, salary })
                    returnObject.pop()
                    break
                }
            }
        }
    }
    return returnObject
}
const knapSack = (quarterBacks, runningBacks, wideRecievers, tightEnds, defenses) => {
    //base case: when we cannot have take more items
    const total = 46700
    let returnObject = []
    let flex = [...runningBacks, ...wideRecievers, ...tightEnds]
    console.log(quarterBacks.length)
    console.log(runningBacks.length)
    let count = 0
    let rbCount = 0
    for (let i = 0; i < quarterBacks.length; i++) {
        console.log(count)
        count++
        for (let j = 0; j < runningBacks.length; j++) {
            console.log(rbCount)
            rbCount++
            for (let k = j; k < runningBacks.length; k++) {
                if (k === j) {
                    continue
                }
                for (let l = 0; l < wideRecievers.length; l++) {
                    for (let m = l; m < wideRecievers.length; m++) {
                        if (l === m) continue
                        for (let q = m; q < wideRecievers.length; q++) {
                            if (q === l || m === q) continue
                            for (let r = 0; r < tightEnds.length; r++) {
                                for (let s = 0; s < flex.length; s++) {
                                    for (let t = 0; t < defenses.length; t++) {
                                        returnObject = insertLineup(quarterBacks[i], runningBacks[j], runningBacks[k],
                                            wideRecievers[l], wideRecievers[m], wideRecievers[q], tightEnds[r],
                                            flex[s], defenses[t], returnObject)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return returnObject
}

(async () => {
    let rawdata = fs.readFileSync('json/nflWeek2WithCorrectSalariesAndPoints.json');
    let players = JSON.parse(rawdata);
    let rawdataDefenses = fs.readFileSync('json/nflWeek2DefensesWithCorrectSalariesAndPoints.json');
    let defensesObject = JSON.parse(rawdataDefenses);
    let quarterBacks = []
    let runningBacks = []
    let wideRecievers = []
    let tightEnds = []
    let defenses = []
    for (let key in defensesObject) {
        let defense = defensesObject[key]
        defense.team = key
        defenses.push(defense)
    }
    for (let key in players) {
        let player = players[key]
        player.name = key
        switch (player.position) {
            case 'RB':
                runningBacks.push(player)
                break
            case 'QB':
                quarterBacks.push(player)
                break
            case 'WR':
                wideRecievers.push(player)
                break
            case 'TE':
                tightEnds.push(player)
                break
        }
    }

    quarterBacks.sort(comparePoints)
    quarterBacks = quarterBacks.slice(0, 32)
    quarterBacks.sort(compareRatio)

    runningBacks.sort(comparePoints)
    runningBacks = runningBacks.slice(0, 114)
    runningBacks.sort(compareRatio)

    wideRecievers.sort(comparePoints)
    wideRecievers = wideRecievers.slice(0, 50)
    wideRecievers.sort(compareRatio)

    tightEnds.sort(comparePoints)
    tightEnds = tightEnds.slice(0, 30)
    tightEnds.sort(compareRatio)

    defenses.sort(compareRatio)

    defenses = defenses.slice(0, 15)
    quarterBacks = quarterBacks.slice(0, 20)
    runningBacks = runningBacks.slice(0, 25)
    wideRecievers = wideRecievers.slice(0, 30)
    tightEnds = tightEnds.slice(0, 15)
    fs.writeFileSync("json/Week2RBS.json", JSON.stringify(runningBacks), function (err) {
        console.log('here')
        if (err) {
            console.log(err);
        }
    });
    fs.writeFileSync("json/Week2QBS.json", JSON.stringify(quarterBacks), function (err) {
        if (err) {
            console.log(err);
        }
    });
    fs.writeFileSync("json/Week2TES.json", JSON.stringify(tightEnds), function (err) {
        if (err) {
            console.log(err);
        }
    });
    fs.writeFileSync("json/Week2WRS.json", JSON.stringify(wideRecievers), function (err) {
        if (err) {
            console.log(err);
        }
    });
    console.log('done')
    let prefferedLineups = knapSack(quarterBacks, runningBacks, wideRecievers, tightEnds, defenses)
    fs.writeFileSync("json/allQbsOptimized.json", JSON.stringify(prefferedLineups), function (err) {
        if (err) {
            console.log(err);
        }
    });
}
)()