
import fs, { stat } from 'fs'

function compare( a, b ) {
    if ( a.ratio > b.ratio ){
      return -1;
    }
    if ( a.ratio < b.ratio ){
      return 1;
    }
    return 0;
  }

  const knapSack = (quarterBacks, runningBacks, wideRecievers, tightEnds) => {
    //base case: when we cannot have take more items
    const total = 46700
    let returnObject = []
    let flex = [...runningBacks, ...wideRecievers, ...tightEnds]
    console.log(flex)
    console.log(quarterBacks.length)
    console.log(runningBacks.length)
    let count = 0
    let rbCount = 0
    for (let i = 0; i < quarterBacks.length; i++)  {
        console.log(count)
        count++
        for (let j = 0; j < runningBacks.length; j++)  {
            console.log(rbCount)
            rbCount++
            for (let k = 0; k < runningBacks.length; k++)  {
                if ( k === j ) { 
                    continue
                }
                for (let l = 0; l < wideRecievers.length; l++)  {
                    for (let m = 0; m <wideRecievers.length; m++)  {
                        if(l === m) continue
                        for (let q = 0; q < wideRecievers.length; q++)  {
                            if( q === l || m === q) continue
                            for (let r = 0; r < tightEnds.length; r++)  {
                                for (let s = 0; s < flex.length; s++)  {
                                    if(flex[s].name === tightEnds[r].name || flex[s].name === wideRecievers[l].name || 
                                        flex[s].name === wideRecievers[q].name || flex[s].name === wideRecievers[m].name ||
                                        flex[s].name === runningBacks[j].name || flex[s].name === runningBacks[k].name) continue  
                                    let salary = quarterBacks[i].salary + runningBacks[j].salary + runningBacks[k].salary +
                                        wideRecievers[m].salary + wideRecievers[q].salary + wideRecievers[l].salary  +
                                        tightEnds[r].salary + flex[s].salary
                                    if(salary < total) {
                                        let score = quarterBacks[i].totalPoints + runningBacks[j].totalPoints + runningBacks[k].totalPoints +
                                        wideRecievers[m].totalPoints + wideRecievers[q].totalPoints + wideRecievers[l].totalPoints  +
                                        tightEnds[r].totalPoints + flex[s].totalPoints 
                                        if(returnObject.length < 50 || returnObject[49].score < score) {
                                            if(wideRecievers[m].name === wideRecievers[l].name) {
                                                console.log(m,l)
                                            }
                                            const lineup = { qb: quarterBacks[i],
                                                rb1: runningBacks[j], rb2: runningBacks[k], wr: wideRecievers[m],
                                                wr2: wideRecievers[q], wr3: wideRecievers[l], te: tightEnds[r], flex: flex[s]
                                            }

                                            for(let i = 0; i < returnObject.length + 1; i++) {
                                                if(!returnObject[i]){ 
                                                    returnObject.push({ score, lineup }) 
                                                    break
                                                } else if(returnObject[i].score < score) {
                                                    returnObject.splice(i, 0, {score, lineup})
                                                    returnObject.pop()
                                                    break
                                                }
                                            }
                                        }
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
        let rawdata = fs.readFileSync('nflWeek1WithCorrectSalariesAndPoints.json');
        let players = JSON.parse(rawdata);
        let quarterBacks = []
        let runningBacks = []
        let wideRecievers = []
        let tightEnds = []
        for (let key in players) {
            let player = players[key]
            player.name = key
            switch ( player.position ) {
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
        quarterBacks.sort(compare)
        runningBacks.sort(compare)
        wideRecievers.sort(compare)
        tightEnds.sort(compare)
        quarterBacks = quarterBacks.slice(0, 12)
        runningBacks = runningBacks.slice(0, 15)
        wideRecievers = wideRecievers.slice(0,25)
        tightEnds = tightEnds.slice(0,15)
        let prefferedLineups = knapSack(quarterBacks, runningBacks, wideRecievers, tightEnds)
        fs.writeFile("prefferedLineupsWeek1.json", JSON.stringify(prefferedLineups), function(err) {
            if (err) {
                console.log(err);
            }
        });
    }
)()