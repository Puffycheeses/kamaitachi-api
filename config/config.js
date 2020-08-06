// always lowercase. list of supported games.
const supportedGames = ["iidx","museca","maimai","jubeat","popn","sdvx","ddr","bms"];

const serviceSupportedGames = {
  PLI: ["iidx"],
  ARC: ["iidx","jubeat","sdvx","ddr"],  // PERFECT!
  FLO: ["iidx"],
  "e-amusement": ["iidx"],
  LR2: ["bms"],
  beatoraja: ["bms"]
}

const gameColours = {
  iidx: "#E7BDB3",
  museca: "#C9A4A0",
  maimai: "#AE8094",
  sdvx: "#D6B7B1",
  ddr: "#CC5079",
  gitadora: "#CA9CA9",
  gfdm: "#DA836E",
  jubeat: "#129A7D",
  popn: "#F39CA4",
  bms:"#B5DCCD",
}

const gameRelevantScoreBucket = {
    iidx: "lamp",
    museca: "grade",
    maimai: "grade",
    sdvx: "lamp",
    ddr: "lamp",
    gitadora: "grade",
    gfdm: "grade",
    jubeat: "grade",
    popn: "grade",
    bms: "lamp",
}

// human readable stuff for games
const gameHuman = {
  iidx: "beatmania IIDX",
  museca: "MÚSECA",
  maimai: "maimai",
  sdvx: "SOUND VOLTEX",
  ddr: "Dance Dance Revolution",
  gitadora: "GITADORA",
  gfdm: "GuitarFreaks & DrumMania",
  jubeat: "jubeat",
  popn: "pop'n music",
  bms: "BMS"
}

// human readable stuff for versions
const versionHuman = {
  iidx: {
    "0": "1st Style",
    "1": "substream",
    "2": "2nd Style",
    "3": "3rd Style",
    "4": "4th Style",
    "5": "5th Style",
    "6": "6th Style",
    "7": "7th Style",
    "8": "8th Style",
    "9": "9th Style",
    "10": "10th Style",
    "11": "IIDX RED",
    "12": "HAPPY SKY",
    "13": "DISTORTED",
    "14": "GOLD",
    "15": "DJ TROOPERS",
    "16": "EMPRESS",
    "17": "SIRIUS",
    "18": "Resort Anthem",
    "19": "Lincle",
    "20": "tricoro",
    "21": "SPADA",
    "22": "PENDUAL",
    "23": "copula",
    "24": "SINOBUZ",
    "25": "CANNON BALLERS",
    "26": "ROOTAGE",
    "27": "HEROIC VERSE",
    "3CS": "3rd Style CS",
    "4CS": "4th Style CS",
    "5CS": "5th Style CS",
    "6CS": "6th Style CS",
    "7CS": "7th Style CS",
    "8CS": "8th Style CS",
    "9CS": "9th Style CS",
    "10CS": "10th Style CS",
    "11CS": "IIDX RED CS",
    "12CS": "HAPPY SKY CS",
    "13CS": "DISTORTED CS",
    "14CS": "GOLD CS",
    "15CS": "DJ TROOPERS CS",
    "16CS": "EMPRESS + PREMIUM BEST CS",
  },
  museca: {
    "1": "",
    "1.5": "1+1/2"
  },
  maimai:{
    maimai: "",
    maimaiplus: "PLUS",
    green: "GReeN",
    greenplus: "GReeN PLUS",
    orange: "ORANGE",
    orangeplus: "ORANGE PLUS",
    pink: "PiNK",
    pinkplus: "PiNK PLUS",
    murasaki: "MURASAKi",
    murasakiplus: "MURASAKi PLUS",
    milk: "MiLK",
    milkplus: "MiLK PLUS",
    finale: "FiNALE"
  },
  jubeat:{
    jubeat: "",
    ripples: "ripples",
    knit: "knit",
    copious: "copious",
    saucer: "saucer",
    saucerfulfill: "saucer fulfill",
    prop: "prop",
    qubell: "Qubell",
    clan: "clan",
    festo: "festo"
  },
  popn:{
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "11",
    12: "12 Iroha",
    13: "13 CARNIVAL",
    14: "14 FEVER!",
    15: "15 ADVENTURE",
    16: "16 PARTY♪",
    17: "17 THE MOVIE",
    18: "18 Sengoku",
    19: "19 TUNE STREET",
    20: "20 fantasia",
    "park": "Sunny Park",
    "lapis": "Lapistoria",
    "eclale": "éclale",
    "usaneko": "Usaneko",
    "peace": "peace"
  },
  sdvx:{
    booth: "BOOTH",
    inf: "II -infinite infection-",
    gw: "III GRAVITY WARS",
    heaven: "IV HEAVENLY HAVEN",
    vivid: "V VIVID WAVE"
  },
  ddr:{
    "1": "1st Mix",
    "2": "2nd Mix",
    "3": "3rd Mix",
    "4": "4th Mix",
    "5": "5th Mix",
    "max": "MAX",
    "max2": "MAX2",
    "extreme": "EXTREME",
    "snova": "SuperNOVA",
    "snova2": "SuperNOVA 2",
    "x": "X",
    "x2": "X2",
    "x3": "X3 vs. 2nd Mix",
    "2013": "(2013)",
    "2014": "(2014)",
    "a": "Ace",
    "a20": "A20"
  }
}

// release orders of the games.
const gameOrders = {
  iidx: ["0","1","2","3","4","3CS","5","4CS","5CS","6","7","6CS","8","9","10","7CS","11","8CS","9CS","12","10CS","13","11CS","12CS","14","13CS","15","14CS","15CS","16","16CS","17","18","19","20","21","22","23","24","25","26","27"],
  museca: ["1","1.5"],
  maimai: ["maimai","maimaiplus","green","greenplus","orange","orangeplus","pink","pinkplus","murasaki","murasakiplus","milk","milkplus","finale"],
  jubeat: ["jubeat","ripples","knit","copious","saucer","saucerfulfill","prop","qubell","clan","festo"],
  popn: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","park","lapis","eclale","usaneko","peace"],
  sdvx: ["booth","inf","gw","heaven","vivid"],
  ddr: ["1","2","3","4","5","max","max2","extreme","snova","snova2","x","x2","x3","2013","2014","a","a20"],
  bms: ["0"],
}

const defaultPlaytype = {
  iidx: "SP",
  museca: "Single",
  maimai: "Single",
  jubeat: "Single",
  popn: "9B",
  sdvx: "Single",
  ddr: "SP",
  bms: "7K",
}

// difficulty orders of games.
const diffOrders = {
  iidx: ["SP BEGINNER", "SP NORMAL","SP HYPER", "SP ANOTHER","SP LEGGENDARIA", "DP NORMAL", "DP HYPER","DP ANOTHER", "DP LEGGENDARIA"],
  museca: ["Single Green","Single Yellow","Single Red"],
  maimai: ["Single Easy","Single Basic","Single Advanced","Single Expert","Single Master","Single Re:Master"],
  jubeat: ["Single BSC","Single ADV","Single EXT"],
  popn: ["9B Easy","9B Normal","9B Hyper","9B EX"],
  sdvx: ["Single NOV","Single ADV","Single EXH","Single MXM","Single INF","Single GRV","Single HVN","Single VVD"],
  ddr: ["SP BEGINNER","SP BASIC","SP DIFFICULT","SP EXPERT","SP CHALLENGE","DP BASIC","DP DIFFICULT", "DP EXPERT","DP CHALLENGE"],
  bms: [], // BMS does have difficulties, it just doesn't matter because root songs aren't properly defined.
}

// valid folders for each game
const folders = {
  iidx: {
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9","10","11","12"],
    versions: gameOrders["iidx"]
  },
  museca: {
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"],
    versions: gameOrders["museca"]
  },
  maimai: {
    type: "static",
    levels: ["1","2","3","4","5","6","7","7+","8","8+","9","9+","10","10+","11","11+","12","12+","13","13+","14"],
    versions: gameOrders["maimai"]
  },
  jubeat:{
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9.0","9.1","9.2","9.3","9.4","9.5","9.6","9.7","9.8","9.9","10.0","10.1","10.2","10.3","10.4","10.5","10.6","10.7","10.8","10.9"],
    versions: gameOrders["jubeat"]
  },
  popn:{
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50"],
    versions: gameOrders["popn"]
  },
  ddr: {
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19"],
    versions: gameOrders["ddr"]
  },
  sdvx:{
    type: "static",
    levels: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20"],
    versions: gameOrders["sdvx"]
  },
  bms: {
    type: "tierlist",
    reasonableLevelMax: 30,
    levels: [],
    versions: []
  },
}

const validPlaytypes ={
  iidx: ["SP","DP"],
  popn: ["9B"],
  sdvx: ["Single"],
  ddr: ["SP","DP"],
  maimai: ["Single"],
  jubeat: ["Single"],
  museca: ["Single"],
  bms: ["7K","14K","5K","10K"]
}

const validTierlistTiers = {
  iidx: ["clear","hardclear","exhardclear"],
  museca: ["clear"],
  maimai: [],
  jubeat: [],
  popn: [],
  sdvx: [],
  ddr: ["clear","perfectfullcombo"],
  bms: ["easyclear","clear","hardclear","fullcombo"],
}

const judgements = {
  iidx: ["MISS","BAD","GOOD","GREAT","PGREAT"],
  bms: ["POOR","BAD","GOOD","GREAT","PGREAT"],
  museca: ["MISS","NEAR","CRITICAL"],
  maimai: ["MISS","GOOD","GREAT","PERFECT"],
  jubeat: ["MISS","POOR","GOOD","GREAT","PERFECT"],
  popn: ["BAD","GOOD","GREAT","COOL"],
  sdvx: ["MISS","NEAR","CRITICAL"],
  ddr: ["MISS","BOO","GOOD","GREAT","PERFECT","MARVELOUS"]
}

// correct order for grades
const grades = {
  iidx: ["F","E","D","C","B","A","AA","AAA","MAX-","MAX"],
  bms: ["F","E","D","C","B","A","AA","AAA","MAX-","MAX"],
  museca: ["没","拙","凡","佳","良","優","秀","傑","傑G"],
  maimai: ["F","E","D","C","B","A","AA","AAA","S","S+","SS","SS+","SSS","SSS+"],
  jubeat: ["E","D","C","B","A","S","SS","SSS","EXC"],
  popn: ["E","D","C","B","A","AA","AAA","S"],
  sdvx: ["D","C","B","A","A+","AA","AA+","AAA","AAA+","S"],
  ddr: ["D","C","B","A","AA","AAA"],
}


const gradeBoundaries = {
  iidx: [0,22.22,33.33,44.44,55.55,66.66,77.77,88.88,94.44,100.00],
  bms: [0,22.22,33.33,44.44,55.55,66.66,77.77,88.88,94.44,100.00],
  museca: [0,60,70,80,85,90,95,97.5,100],
  // maimai is fidgety with grades - SSS+ is only possible if you get above 100%, but what the limit is depends on the chart
  // this is handled in importhelpers; go figure.
  maimai: [0,10,20,40,60,80,90,94,97,98,99,99.5,100,9999],
  jubeat: [0,50,70,80,85,90,95,98,100],
  popn: [0,50,62,72,82,90,95,98],
  // popn is fidgety with grades - A is the limit of grades if you fail. this NEEDS TO BE HANDLED in importhelpers. - 28/04/2020 isnt done yet lol
  sdvx: [0,70,80,87,90,93,95,97,98,99],
  ddr: [0,59,69,79,89,99,100],
}

// correct order for lamps
const lamps = {
  iidx: ["NO PLAY","FAILED","ASSIST CLEAR","EASY CLEAR","CLEAR","HARD CLEAR","EX HARD CLEAR","FULL COMBO"],
  bms: ["NO PLAY","FAILED","ASSIST CLEAR","EASY CLEAR","CLEAR","HARD CLEAR","EX HARD CLEAR","FULL COMBO"],
  museca: ["FAILED","CLEAR","CONNECT ALL","PERFECT CONNECT ALL"],
  maimai: ["FAILED","CLEAR","FULL COMBO","ALL PERFECT","ALL PERFECT+"],
  jubeat: ["FAILED","CLEAR","FULL COMBO","EXCELLENT"],
  popn: ["FAILED","CLEAR","FULL COMBO","PERFECT"],
  sdvx: ["FAILED","CLEAR","EXCESSIVE CLEAR","ULTIMATE CHAIN","PERFECT ULTIMATE CHAIN"],
  ddr: ["FAILED","CLEAR","LIFE4","FULL COMBO","GREAT FULL COMBO","PERFECT FULL COMBO","MARVELOUS FULL COMBO"],
}

// first lamp that is considered a "true clear" by the game.
const clearLamp = {
  iidx: "CLEAR",
  bms: "CLEAR",
  museca: "CLEAR",
  maimai: "CLEAR",
  jubeat: "CLEAR",
  popn: "CLEAR",
  sdvx: "CLEAR",
  ddr: "CLEAR"
}

const validModifiers = {
  iidx: {
    note: ["NONRAN","MIRROR","RANDOM","R-RANDOM","S-RANDOM"],
    gauge: ["NORMAL","HARD"]
  },
  bms: {
    note: ["NONRAN","MIRROR","RANDOM","R-RANDOM","S-RANDOM"],
    gauge: ["NORMAL","HARD"]
  },
  ddr:{
    speed: ["0.25x","0.5x","0.75x","1x","1.25x","1.5x","1.75x","2.0x","2.25x","2.5x", "2.75x","3.0x","3.25x","3.5x","3.75x","4.0x","4.5x","5.0x","5.5x","6.0x","6.5x","7.0x","7.5x","8.0x"]
  }
}

const _rootChartTags = ["INDIVIDUAL DIFFERENCE","DIFFICULT INTRO","DIFFICULT MIDDLE","DIFFICULT END"]

const adviceChartTags = {
  iidx: [..._rootChartTags,"GENOCLEAR","RANDOM DEPENDENT"],
  bms: [..._rootChartTags,"GENOCLEAR","RANDOM DEPENDENT"],
  ddr: [..._rootChartTags],
  museca: [..._rootChartTags],
  sdvx: [..._rootChartTags],
  popn: [..._rootChartTags],
  jubeat: [..._rootChartTags],
  maimai: [..._rootChartTags],
}

const adviceNoteTags = {
  iidx: ["SCRATCHING","JACKS","SOFLAN","CHARGE NOTES","SCALES","CHORD SCALES","DENIM","TRILLS", "STREAMS","ROLLS","CHORDS","SPEED","STAMINA","TECHNICAL"],
  bms: ["SCRATCHING","JACKS","SOFLAN","CHARGE NOTES","SCALES","CHORD SCALES","DENIM","TRILLS", "STREAMS","ROLLS","CHORDS","SPEED","STAMINA","TECHNICAL"],
  ddr: ["CROSSOVERS","GALLOPS","JUMPS","SOFLAN","STOPS","TURNS","FREEZE NOTES","SHOCK ARROWS","DRILLS","JACKS","STEP-JUMPS","CANDLES","STAMINA","TECHNICAL"],
  museca: ["STREAMS","TRILLS","SPINS","PEDAL","STAMINA","TECHNICAL"],
  sdvx: ["STREAMS","JACKS","LASERS","SPEED","TRILLS","ONE-HANDING","STAMINA","TECHNICAL"],
  popn: [],
  jubeat: [],
  maimai: []
}

const COLOUR_SET = {
    gray: "rgba(105, 105, 105, 1)",
    maroon: "rgba(85, 17, 17, 1)",
    red: "rgba(170, 85, 85, 1)",
    paleGreen: "rgba(142,174,79, 1)",
    paleBlue: "rgba(92, 97, 153, 1)",
    green: "rgba(50, 205, 50, 1)",
    blue: "rgba(70, 130, 180, 1)",
    gold: "rgba(255, 215, 0, 1)",
    vibrantYellow: "rgba(245, 229, 27, 1)",
    teal: "rgba(127, 255, 212, 1)",
    white: "rgba(192, 192, 192, 1)",
    purple: "rgba(153, 50, 204, 1)",
    paleOrange: "rgba(235, 151, 78, 1)",
    orange: "rgba(248, 148, 6, 1)"
}

// hi, outline colours are the same as the fill colours but with the opacities changed
// you might say this is inefficient - it is
// but writing any sort of fix for it would take longer than the time it takes for me to update a value twice.

// todo, just put this out of its misery
// it's not even difficult to update it's just taking up too much of my IDE and i don't like it.
const gradeColours = {
    museca: {
        outline:{
        "没": COLOUR_SET.gray,
        "拙": COLOUR_SET.maroon,
        "凡": COLOUR_SET.red,
        "佳": COLOUR_SET.paleGreen,
        "良": COLOUR_SET.paleBlue,
        "優": COLOUR_SET.green,
        "秀": COLOUR_SET.blue,
        "傑": COLOUR_SET.teal,
        "傑G": COLOUR_SET.gold
        }
    },
    ddr: {
        outline:{
        "D": COLOUR_SET.maroon,
        "C": COLOUR_SET.purple,
        "B": COLOUR_SET.paleBlue,
        "A": COLOUR_SET.paleGreen,
        "AA": COLOUR_SET.blue,
        "AAA": COLOUR_SET.gold
        }
    },
    jubeat: {
        outline:{
        "E": COLOUR_SET.gray,
        "D": COLOUR_SET.maroon,
        "C": COLOUR_SET.purple,
        "B": COLOUR_SET.paleBlue,
        "A": COLOUR_SET.paleGreen,
        "S": COLOUR_SET.blue,
        "SS": COLOUR_SET.gold,
        "SSS": COLOUR_SET.teal,
        "EXC": COLOUR_SET.white
        }
    },
    maimai: { // todo make this not repeat values for S, S+, etc.
        outline:{
            "F": COLOUR_SET.gray,
            "E": COLOUR_SET.red,
            "D": COLOUR_SET.maroon,
            "C": COLOUR_SET.purple,
            "B": COLOUR_SET.paleGreen,
            "A": COLOUR_SET.green,
            "AA": COLOUR_SET.paleBlue,
            "AAA": COLOUR_SET.blue,
            "S": COLOUR_SET.gold,
            "S+": COLOUR_SET.vibrantYellow,
            "SS": COLOUR_SET.paleOrange,
            "SS+": COLOUR_SET.orange,
            "SSS": COLOUR_SET.teal,
            "SSS+": COLOUR_SET.white,
        }
    },
    popn: {
      outline: {
        "F": COLOUR_SET.gray,
        "E": COLOUR_SET.red,
        "D": COLOUR_SET.maroon,
        "C": COLOUR_SET.purple,
        "B": COLOUR_SET.paleBlue,
        "A": COLOUR_SET.green,
        "AA": COLOUR_SET.paleOrange,
        "AAA": COLOUR_SET.gold,
        "S": COLOUR_SET.teal,
      }
    },
    iidx: {
        outline: {
            "F": COLOUR_SET.gray,
            "E": COLOUR_SET.red,
            "D": COLOUR_SET.maroon,
            "C": COLOUR_SET.purple,
            "B": COLOUR_SET.paleBlue,
            "A": COLOUR_SET.green,
            "AA": COLOUR_SET.blue,
            "AAA": COLOUR_SET.gold,
            "MAX-": COLOUR_SET.teal,
            "MAX": COLOUR_SET.white
        }
    },
    bms: {
        outline: {
            "F": COLOUR_SET.gray,
            "E": COLOUR_SET.red,
            "D": COLOUR_SET.maroon,
            "C": COLOUR_SET.purple,
            "B": COLOUR_SET.paleBlue,
            "A": COLOUR_SET.green,
            "AA": COLOUR_SET.blue,
            "AAA": COLOUR_SET.gold,
            "MAX-": COLOUR_SET.teal,
            "MAX": COLOUR_SET.white
        }
    },
    sdvx:{
        outline: {
            "D": COLOUR_SET.gray,
            "C": COLOUR_SET.red,
            "B": COLOUR_SET.maroon,
            "A": COLOUR_SET.paleBlue,
            "A+": COLOUR_SET.blue,
            "AA": COLOUR_SET.paleGreen,
            "AA+": COLOUR_SET.green,
            "AAA": COLOUR_SET.gold,
            "AAA+": COLOUR_SET.vibrantYellow,
            "S": COLOUR_SET.teal
        }
    }
}

const lampColours = {
    ddr:{
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.paleGreen,
            "FULL COMBO": COLOUR_SET.paleBlue,
            "GREAT FULL COMBO": COLOUR_SET.green,
            "PERFECT FULL COMBO": COLOUR_SET.gold,
            "MARVELOUS FULL COMBO": COLOUR_SET.teal
        }
    },
    iidx: {
        outline:{
            "NO PLAY": COLOUR_SET.gray,
            "FAILED": COLOUR_SET.red,
            "ASSIST CLEAR": COLOUR_SET.purple,
            "EASY CLEAR": COLOUR_SET.green,
            "CLEAR": COLOUR_SET.blue,
            "HARD CLEAR": COLOUR_SET.orange,
            "EX HARD CLEAR": COLOUR_SET.gold,
            "FULL COMBO": COLOUR_SET.teal
        }
    },
    bms: {
        outline:{
            "NO PLAY": COLOUR_SET.gray,
            "FAILED": COLOUR_SET.red,
            "ASSIST CLEAR": COLOUR_SET.purple,
            "EASY CLEAR": COLOUR_SET.green,
            "CLEAR": COLOUR_SET.blue,
            "HARD CLEAR": COLOUR_SET.orange,
            "EX HARD CLEAR": COLOUR_SET.gold,
            "FULL COMBO": COLOUR_SET.teal
        }
    },
    museca: {
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.green,
            "CONNECT ALL": COLOUR_SET.teal,
            "PERFECT CONNECT ALL": COLOUR_SET.gold
        }
    },
    sdvx: {
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.green,
            "EXCESSIVE CLEAR": COLOUR_SET.orange,
            "ULTIMATE CHAIN": COLOUR_SET.teal,
            "PERFECT ULTIMATE CHAIN": COLOUR_SET.gold
        }
    },
    popn: {
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.green,
            "FULL COMBO": COLOUR_SET.teal,
            "PERFECT": COLOUR_SET.gold
        }
    },
    maimai: {
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.green,
            "FULL COMBO": COLOUR_SET.blue,
            "ALL PERFECT": COLOUR_SET.gold,
            "ALL PERFECT+": COLOUR_SET.teal
        }
    },
    jubeat: {
        outline:{
            "FAILED": COLOUR_SET.red,
            "CLEAR": COLOUR_SET.paleBlue,
            "FULL COMBO": COLOUR_SET.teal,
            "EXCELLENT": COLOUR_SET.gold
        }
    }
}

// ok

for (const colourConfig of [lampColours, gradeColours]) {
    for (const game in colourConfig) {
        if (colourConfig.hasOwnProperty(game)) {
            colourConfig[game].fill = {};
            for (const key in colourConfig[game].outline) {
                if (colourConfig[game].outline.hasOwnProperty(key)) {
                    const element = colourConfig[game].outline[key];
                    let fadedEl = element.split(",");
                    fadedEl[fadedEl.length - 1] = "0.2)";

                    colourConfig[game].fill[key] = fadedEl.join(",");
                }
            }

        }
    }
}


const judgeColours = {
  iidx: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "BAD": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(38, 211, 78, 0.2)",
      "GREAT": "rgba(241, 245, 24, 0.2)",
      "PGREAT": "rgba(158, 248, 255, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "BAD": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(38, 211, 78, 1)",
      "GREAT": "rgba(241, 245, 24, 1)",
      "PGREAT": "rgba(158, 248, 255, 1)"
    }
  },
  bms: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "BAD": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(38, 211, 78, 0.2)",
      "GREAT": "rgba(241, 245, 24, 0.2)",
      "PGREAT": "rgba(158, 248, 255, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "BAD": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(38, 211, 78, 1)",
      "GREAT": "rgba(241, 245, 24, 1)",
      "PGREAT": "rgba(158, 248, 255, 1)"
    }
  },
  ddr: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "BOO": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(38, 211, 78, 0.2)",
      "GREAT": "rgba(241, 245, 24, 0.2)",
      "PERFECT": "rgba(158, 248, 255, 0.2)",
      "MARVELOUS": "rgba(241, 245, 24, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "BOO": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(38, 211, 78, 1)",
      "GREAT": "rgba(241, 245, 24, 1)",
      "PERFECT": "rgba(158, 248, 255, 1)",
      "MARVELOUS": "rgba(241, 245, 24, 1)"
    }
  },
  museca: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "NEAR": "rgba(20, 210, 223, 0.2)",
      "CRITICAL": "rgba(241, 245, 24, 0.2)" 
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "NEAR": "rgba(20, 210, 223, 1)",
      "CRITICAL": "rgba(241, 245, 24, 1)" 
    }
  },
  sdvx: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "NEAR": "rgba(20, 210, 223, 0.2)",
      "CRITICAL": "rgba(241, 245, 24, 0.2)" 
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "NEAR": "rgba(20, 210, 223, 1)",
      "CRITICAL": "rgba(241, 245, 24, 1)" 
    }
  },
  popn: {
    fill: {
      "BAD": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(239, 84, 81, 0.2)",
      "GREAT": "rgba(241, 245, 24, 0.2)",
      "PGREAT": "rgba(158, 248, 255, 0.2)"
    },
    outline:{
      "BAD": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(239, 84, 81, 1)",
      "GREAT": "rgba(241, 245, 24, 1)",
      "PGREAT": "rgba(158, 248, 255, 1)"
    }
  },
  maimai: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "GOOD": "rgba(38, 211, 78, 0.2)",
      "GREAT": "rgba(228, 62, 225, 0.2)",
      "PERFECT": "rgba(241, 245, 24, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "GOOD": "rgba(38, 211, 78, 1)",
      "GREAT": "rgba(228, 62, 225,1)",
      "PERFECT": "rgba(241, 245, 24, 1)"
    }
  },
  jubeat: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "POOR": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(39, 190, 117,0.2)",
      "GREAT": "rgba(38, 211, 78, 0.2)",
      "PERFECT": "rgba(241, 245, 24, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "POOR": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(39, 190, 117, 1)",
      "GREAT": "rgba(38, 211, 78, 1)",
      "PERFECT": "rgba(241, 245, 24, 1)"
    }
  },
}

const gameChartIndicators = {
  iidx: ["cn","bss","hcn","hbss"],
  popn: ["holds"],
  ddr: ["shocks","freezes"],
  museca: [],
  maimai: [],
  jubeat: ["holds"],
  sdvx: [],
  bms: [],
}

// getter functions
function GameToHuman(game){
  return gameHuman[game];
}

function VersionToHuman(version, game){
  return versionHuman[game][version];
}

function HumanToGame(human){
  return Object.keys(gameHuman).find(key => gameHuman[key] === human);
}
/// XP STUFFS
const LEVEL_INCREASE = 0.1; // exponentiation such that XP(level+1) = XP(level) * 1.25
const MULTIPLIER = 1000; // multiplies all xp values by this so we get nice things like 125 instead of 1.25
const LNELEVENTENTHS = Math.log(1 + LEVEL_INCREASE); // ln(1.1); that's ln(1+b).

function GetLevel(xp){
  // invXP curve: log1b((x/t)+1) where log1b is log to the base 1+b.
  // i did the maths, u can check it urself with algebra
  return Math.floor((Math.log((xp/MULTIPLIER) + 1)/LNELEVENTENTHS));
}

function GetXPForLevel(level){
  // xp curve: https://www.desmos.com/calculator/cpvz7g5sy7
  // (t(1+b)^x) - t
  return Math.ceil((MULTIPLIER * (1+LEVEL_INCREASE) ** level) - MULTIPLIER);
}

function GetGrade(game, percent){
    for (let i = grades[game].length; i >= 0; i--) {
        var gradeName = grades[game][i]
        var gradeBound = gradeBoundaries[game][i]
        
        if (percent >= gradeBound){
        return gradeName;
        }
    }

    return grades[game][0];
}

function GetGradeWithScore(score){
  // if (score.game === "ddr"){
  //   return GetGrade(score.game, score.scoreData.score / 1000000);
  // }
  // else {
    return GetGrade(score.game, score.scoreData.percent);
  // }
}

const ratingParameters = {
  iidx: {
      failHarshnessMultiplier: 0.3,
      pivotPercent: 0.7777, // Grade: AA
      clearExpMultiplier: 1 
  },
  bms: {
    failHarshnessMultiplier: 0.5,
    pivotPercent: 0.7777, // Grade: AA
    clearExpMultiplier: 0.75
  },
  museca: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.8, // grade: not fail
    clearExpMultiplier: 1 // no real reason
  },
  popn: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.8, // grade: A
    clearExpMultiplier: 0.4 // no real reason
  },
  maimai: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.8,
    clearExpMultiplier: 1
  },
  jubeat: {
    failHarshnessMultiplier: 0.9,
    pivotPercent: 0.7, // grade: A (clear)
    clearExpMultiplier: 1
  },
  sdvx: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.92,
    clearExpMultiplier: 1.45 // testing
  },
  ddr: {
    failHarshnessMultiplier: 0.9,
    pivotPercent: 0.9,
    clearExpMultiplier: 1.45
  }
}

function CalculatePercent(game, score, chartData,hitData){
  var percent;
  if (game === "iidx" || game === "bms"){
    // IIDX Percent Calculator
    // total score possible on a chart is notecount * 2;
    // ergo, return score/notecount*2 as percent
    percent = (parseFloat(score) / (parseFloat(chartData.notedata.notecount) * 2.0)) * 100
  }
  else if (game === "ddr"){
    // DDR Percent Calculator
    // total score possible on a chart is notecount * 3 + shock arrows * 3;
    percent = (parseFloat(score) / (parseFloat(chartData.notedata.notecount) * 3.0 + parseFloat(chartData.notedata.shocks) * 3.0)) * 100
  }
  else if (game === "museca" || game === "jubeat"){
    // MUSECA & jubeat Percent Calculator
    // Max score on every chart is 1,000,000.
    // ergo, return score/1,000,000 as percent.
    percent = (score / 1000000) * 100;
  }
  else if (game === "popn"){
    // popn Percent Calculator
    // Max score on every chart is 100,000.
    // ergo, return score/100,000 as percent.
    percent = (score / 100000) * 100;
  }
  else if (game === "sdvx"){
    // sdvx percent calc
    // max score on every chart is 10,000,000
    // blah blah blah
    percent = (score / 10000000) * 100;
  }

  if (percent > 100){
    console.error("WARNING: PERCENT CALCULATED FOR SCORE WAS GREATER THAN 100%. INVESTIGATE")
    console.error(score);
  }

  if (!percent){
    percent = 0; // sanity check
  }

  return percent;
}



if (typeof module !== 'undefined'){
    module.exports = {
        supportedGames,
        gameOrders,
        diffOrders,
        GameToHuman,
        HumanToGame,
        folders,
        VersionToHuman,
        versionHuman,
        grades,
        lamps,
        lampColours,
        gradeColours,
        GetLevel,
        GetXPForLevel,
        serviceSupportedGames,
        defaultPlaytype,
        gameChartIndicators,
        GetGrade,
        gradeBoundaries,
        gameHuman,
        ratingParameters,
        validPlaytypes,
        judgements,
        judgeColours,
        gameColours,
        validTierlistTiers,
        CalculatePercent,
        clearLamp,
        validModifiers,
        adviceChartTags,
        adviceNoteTags,
        GetGradeWithScore,
        gameRelevantScoreBucket
    };
}