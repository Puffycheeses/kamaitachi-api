// always lowercase. list of supported games.
const supportedGames = ["iidx","museca","maimai","jubeat","popn","sdvx","ddr","osumania","bms","etterna"];

const serviceSupportedGames = {
  PLI: ["iidx"],
  ARC: ["iidx","jubeat","sdvx","ddr"],  // PERFECT!
  FLO: ["iidx"],
  "e-amusement": ["iidx"],
  "osu (MANUAL)": ["osumania"],
  LR2: ["bms"],
  beatoraja: ["bms"],
  Etterna: ["etterna"]
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
  osumania: "#DC7684",
  bms:"#B5DCCD",
}

const rivalGroupDefaultCellShading = {
    iidx: "lamp",
    museca: "grade",
    maimai: "grade",
    sdvx: "lamp",
    ddr: "lamp",
    gitadora: "grade",
    gfdm: "grade",
    jubeat: "grade",
    popn: "grade",
    osumania: "lamp",
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
  osumania: "osu!mania",
  bms: "BMS",
  etterna: "Etterna"
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
  osumania: ["0"],
  bms: ["0"],
  etterna: ["0"]
}

const defaultPlaytype = {
  iidx: "SP",
  museca: "Single",
  maimai: "Single",
  jubeat: "Single",
  popn: "9B",
  sdvx: "Single",
  osumania: "4K",
  ddr: "SP",
  bms: "7K",
  etterna: "4K"
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
  osumania: [],
  bms: [], // BMS does have difficulties, it just doesn't matter because root songs aren't properly defined.
  etterna: ["4K BEGINNER","4K EASY","4K MEDIUM","4K HARD","4K CHALLENGE"]
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
  osumania:{
    type: "dynamic", // dynamic mode will not utilse folders. they are left as empty to avoid crashing stuff
    reasonableLevelMax: 10,
    levels: [],
    versions: []
  },
  bms: {
    type: "tierlist",
    reasonableLevelMax: 30,
    levels: [],
    versions: []
  },
  etterna: {
    type: "dynamic",
    reasonableLevelMax: 0,
    levels: [],
    versions: []
  }
}

const invalidatingMods = {
  osumania: ["EZ","NF","SO","AP","RD"/*,"ScoreV2"*/,"CM","TP","RX","AT","AP"], // not actually sure if half of these are possible 
  etterna: ["NoMines"]
}
const difficultyChangingMods = {
  osumania: ["DT","HT"],
  // oh boy
  etterna: ["0.7xMusic","0.75xMusic","0.8xMusic","0.85xMusic","0.9xMusic","0.95xMusic","1.05xMusic","1.1xMusic","1.15xMusic","1.2xMusic","1.25xMusic","1.3xMusic","1.35xMusic","1.4xMusic","1.45xMusic","1.5xMusic","1.55xMusic","1.6xMusic","1.65xMusic","1.7xMusic","1.75xMusic","1.8xMusic","1.85xMusic","1.9xMusic","1.95xMusic","2.0xMusic","2.05xMusic","2.1xMusic","2.15xMusic","2.2xMusic","2.25xMusic","2.3xMusic","2.35xMusic","2.4xMusic","2.45xMusic","2.5xMusic","2.55xMusic","2.6xMusic","2.65xMusic","2.7xMusic","2.75xMusic","2.8xMusic","2.85xMusic","2.9xMusic","2.95xMusic","3.0xMusic"]
}

const validPlaytypes ={
  iidx: ["SP","DP"],
  popn: ["9B"],
  sdvx: ["Single"],
  ddr: ["SP","DP"],
  maimai: ["Single"],
  jubeat: ["Single"],
  museca: ["Single"],
  osustd: ["Single"],
  osutaiko: ["Single"],
  osuctb: ["Single"],
  osumania: ["4K","5K","6K","7K","8K","9K"],
  bms: ["7K","14K","5K","10K"],
  etterna: ["4K"]
}

const validTierlistTiers = {
  iidx: ["clear","hardclear","exhardclear"],
  museca: ["clear"],
  maimai: [],
  jubeat: [],
  popn: [],
  sdvx: [],
  ddr: ["clear","perfectfullcombo"],
  osumania: [],
  bms: ["easyclear","clear","hardclear","fullcombo"],
  etterna: []
}

const judgements = {
  iidx: ["MISS","BAD","GOOD","GREAT","PGREAT"],
  bms: ["POOR","BAD","GOOD","GREAT","PGREAT"],
  museca: ["MISS","NEAR","CRITICAL"],
  maimai: ["MISS","GOOD","GREAT","PERFECT"],
  jubeat: ["MISS","POOR","GOOD","GREAT","PERFECT"],
  popn: ["BAD","GOOD","GREAT","COOL"],
  sdvx: ["MISS","NEAR","CRITICAL"],
  ddr: ["MISS","BOO","GOOD","GREAT","PERFECT","MARVELOUS"],
  osumania: ["MISS","50","100","200","300","300M"], // not using 320 as it's a misnomer
  etterna: ["MISS","BAD","GOOD","GREAT","PERFECT","MARVELOUS"]
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
  osumania: ["D","C","B","A","S","SS"],
  etterna: ["F","D","C","B","A","AA","AAA","AAAA"],
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
  osumania: [0,50,80,90,95,100],
  etterna: [0,50,60,70,80,93,99.75,99.97]
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
  osumania: ["CLEAR","SDCB","FULL COMBO","SDG","PERFECT FULL COMBO","RAINBOW FULL COMBO"],
  etterna: ["FAILED","CLEAR","SDCB","MISSFLAG","FULL COMBO","SDG","BLACKFLAG","PERFECT FULL COMBO","SDP","WHITEFLAG","MARVELOUS FULL COMBO"]
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
  ddr: "CLEAR",
  osumania: "CLEAR",
  etterna: "CLEAR"
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
  osumania: [..._rootChartTags],
  maimai: [..._rootChartTags],
  etterna: [..._rootChartTags],
}

const adviceNoteTags = {
  iidx: ["SCRATCHING","JACKS","SOFLAN","CHARGE NOTES","SCALES","CHORD SCALES","DENIM","TRILLS", "STREAMS","ROLLS","CHORDS","SPEED","STAMINA","TECHNICAL"],
  bms: ["SCRATCHING","JACKS","SOFLAN","CHARGE NOTES","SCALES","CHORD SCALES","DENIM","TRILLS", "STREAMS","ROLLS","CHORDS","SPEED","STAMINA","TECHNICAL"],
  ddr: ["CROSSOVERS","GALLOPS","JUMPS","SOFLAN","STOPS","TURNS","FREEZE NOTES","SHOCK ARROWS","DRILLS","JACKS","STEP-JUMPS","CANDLES","STAMINA","TECHNICAL"],
  museca: ["STREAMS","TRILLS","SPINS","PEDAL","STAMINA","TECHNICAL"],
  sdvx: ["STREAMS","JACKS","LASERS","SPEED","TRILLS","ONE-HANDING","STAMINA","TECHNICAL"],
  popn: [],
  jubeat: [],
  osumania: ["STREAMS","TECHNICAL","JACKS","CHORDJACKS","VIBRO","JUMPSTREAMS","HANDSTREAMS","QUADSTREAMS","DUMP"],
  etterna: ["STREAMS","TECHNICAL","JACKS","CHORDJACKS","VIBRO","JUMPSTREAMS","HANDSTREAMS","QUADSTREAMS","DUMP"],
  maimai: []
}

// hi, outline colours are the same as the fill colours but with the opacities changed
// you might say this is inefficient - it is
// but writing any sort of fix for it would take longer than the time it takes for me to update a value twice.

// todo, just put this out of its misery
// it's not even difficult to update it's just taking up too much of my IDE and i don't like it.
const gradeColours = {
  museca: {
    fill: {
      "没": "rgba(105, 105, 105, 0.2)",
      "拙": "rgba(85, 17, 17, 0.2)",
      "凡": "rgba(170, 85, 85, 0.2)",
      "佳": "rgba(142,174,79, 0.2)",
      "良": "rgba(92, 97, 153, 0.2)",
      "優": "rgba(50, 205, 50, 0.2)",
      "秀": "rgba(70, 130, 180, 0.2)",
      "傑": "rgba(255, 215, 0, 0.2)",
      "傑G": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "没": "rgba(105, 105, 105, 1)",
      "拙": "rgba(85, 17, 17, 1)",
      "凡": "rgba(170, 85, 85, 1)",
      "佳": "rgba(142,174,79, 1)",
      "良": "rgba(92, 97, 153, 1)",
      "優": "rgba(50, 205, 50, 1)",
      "秀": "rgba(70, 130, 180, 1)",
      "傑": "rgba(255, 215, 0, 1)",
      "傑G": "rgba(127, 255, 212, 1)"
    }
  },
  ddr: {
    fill: {
      "D": "rgba(105, 105, 105, 0.2)",
      "C": "rgba(85, 17, 17, 0.2)",
      "B": "rgba(170, 85, 85, 0.2)",
      "A": "rgba(142,174,79, 0.2)",
      "AA": "rgba(255, 215, 0, 0.2)",
      "AAA": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "D": "rgba(105, 105, 105, 1)",
      "C": "rgba(85, 17, 17, 1)",
      "B": "rgba(170, 85, 85, 1)",
      "A": "rgba(142,174,79, 1)",
      "AA": "rgba(255, 215, 0, 1)",
      "AAA": "rgba(127, 255, 212, 1)"
    }
  },
  jubeat: {
    fill: {
      "E": "rgba(105, 105, 105, 0.2)",
      "D": "rgba(85, 17, 17, 0.2)",
      "C": "rgba(170, 85, 85, 0.2)",
      "B": "rgba(142,174,79, 0.2)",
      "A": "rgba(92, 97, 153, 0.2)",
      "S": "rgba(50, 205, 50, 0.2)",
      "SS": "rgba(70, 130, 180, 0.2)",
      "SSS": "rgba(255, 215, 0, 0.2)",
      "EXC": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "E": "rgba(105, 105, 105, 1)",
      "D": "rgba(85, 17, 17, 1)",
      "C": "rgba(170, 85, 85, 1)",
      "B": "rgba(142,174,79, 1)",
      "A": "rgba(92, 97, 153, 1)",
      "S": "rgba(50, 205, 50, 1)",
      "SS": "rgba(70, 130, 180, 1)",
      "SSS": "rgba(255, 215, 0, 1)",
      "EXC": "rgba(127, 255, 212, 1)"
    }
  },
  maimai: { // todo make this not repeat values for S, S+, etc.
    fill: {
      "F": "rgba(105, 105, 105, 0.2)",
      "E": "rgba(85, 17, 17, 0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "AA": "rgba(70, 130, 180, 0.2)",
      "AAA": "rgba(255, 215, 0, 0.2)",
      "S": "rgba(127, 255, 212, 0.2)",
      "S+": "rgba(127, 255, 212, 0.2)",
      "SS": "rgba(127, 255, 212, 0.2)",
      "SS+": "rgba(127, 255, 212, 0.2)",
      "SSS": "rgba(127, 255, 212, 0.2)",
      "SSS+": "rgba(127, 255, 212, 0.2)",
    },
    outline:{
      "F": "rgba(105, 105, 105, 1)",
      "E": "rgba(85, 17, 17, 1)",
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "AA": "rgba(70, 130, 180, 1)",
      "AAA": "rgba(255, 215, 0, 1)",
      "S": "rgba(127, 255, 212, 1)",
      "S+": "rgba(127, 255, 212, 1)",
      "SS": "rgba(127, 255, 212, 1)",
      "SS+": "rgba(127, 255, 212, 1)",
      "SSS": "rgba(127, 255, 212,1)",
      "SSS+": "rgba(127, 255, 212, 1)",
    }
  },
  popn: {
    fill: {
      "F": "rgba(105, 105, 105, 0.2)",
      "E": "rgba(85, 17, 17, 0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "AA": "rgba(70, 130, 180, 0.2)",
      "AAA": "rgba(255, 215, 0, 0.2)",
      "S": "rgba(127, 255, 212, 0.2)"
    },
      outline: {
        "F": "rgba(105, 105, 105, 1)",
        "E": "rgba(85, 17, 17, 1)",
        "D": "rgba(170, 85, 85, 1)",
        "C": "rgba(142,174,79, 1)",
        "B": "rgba(92, 97, 153, 1)",
        "A": "rgba(50, 205, 50, 1)",
        "AA": "rgba(70, 130, 180, 1)",
        "AAA": "rgba(255, 215, 0, 1)",
        "S": "rgba(127, 255, 212, 1)"
      }
    },
  iidx: {
    fill: {
      "F": "rgba(105, 105, 105, 0.2)",
      "E": "rgba(85, 17, 17, 0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "AA": "rgba(70, 130, 180, 0.2)",
      "AAA": "rgba(255, 215, 0, 0.2)",
      "MAX-": "rgba(127, 255, 212, 0.2)",
      "MAX": "rgba(192,192,192 ,0.2 )"
    },
    outline:{
      "F": "rgba(105, 105, 105, 1)",
      "E": "rgba(85, 17, 17, 1)",
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "AA": "rgba(70, 130, 180, 1)",
      "AAA": "rgba(255, 215, 0, 1)",
      "MAX-": "rgba(127, 255, 212, 1)",
      "MAX": "rgba(192,192,192 ,1)"
    }
  },
  bms: {
    fill: {
      "F": "rgba(105, 105, 105, 0.2)",
      "E": "rgba(85, 17, 17, 0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "AA": "rgba(70, 130, 180, 0.2)",
      "AAA": "rgba(255, 215, 0, 0.2)",
      "MAX-": "rgba(127, 255, 212, 0.2)",
      "MAX": "rgba(192,192,192 ,0.2 )"
    },
    outline:{
      "F": "rgba(105, 105, 105, 1)",
      "E": "rgba(85, 17, 17, 1)",
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "AA": "rgba(70, 130, 180, 1)",
      "AAA": "rgba(255, 215, 0, 1)",
      "MAX-": "rgba(127, 255, 212, 1)",
      "MAX": "rgba(192,192,192 ,1)"
    }
  },
  etterna: {
    fill: {
      "F": "rgba(105, 105, 105, 0.2)",
      "E": "rgba(85, 17, 17, 0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "AA": "rgba(70, 130, 180, 0.2)",
      "AAA": "rgba(255, 215, 0, 0.2)",
      "AAAA": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "F": "rgba(105, 105, 105, 1)",
      "E": "rgba(85, 17, 17, 1)",
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "AA": "rgba(70, 130, 180, 1)",
      "AAA": "rgba(255, 215, 0, 1)",
      "AAAA": "rgba(127, 255, 212, 1)"
    }
  },
  sdvx:{
    fill: {
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "A+": "rgba(70, 130, 180, 0.2)",
      "AA": "rgba(255, 215, 0, 0.2)",
      "AA+": "rgba(127, 255, 212, 0.2)",
      "AAA": "rgba(127, 255, 212, 0.2)",
      "AAA+": "rgba(127, 255, 212, 0.2)",
      "S": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "A+": "rgba(70, 130, 180, 1)",
      "AA": "rgba(255, 215, 0, 1)",
      "AA+": "rgba(127, 255, 212, 1)",
      "AAA": "rgba(127, 255, 212, 1)",
      "AAA+": "rgba(127, 255, 212, 1)",
      "S": "rgba(127, 255, 212, 1)"
    }
  },
  osumania:{
    fill: {
      "F": "rgba(32,32,32,0.2)",
      "D": "rgba(170, 85, 85, 0.2)",
      "C": "rgba(142,174,79, 0.2)",
      "B": "rgba(92, 97, 153, 0.2)",
      "A": "rgba(50, 205, 50, 0.2)",
      "S": "rgba(127, 255, 212, 0.2)",
      "S+": "rgba(255, 215, 0, 0.2)",
      "SS": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "F": "rgba(32,32,32,1)",
      "D": "rgba(170, 85, 85, 1)",
      "C": "rgba(142,174,79, 1)",
      "B": "rgba(92, 97, 153, 1)",
      "A": "rgba(50, 205, 50, 1)",
      "S": "rgba(127, 255, 212, 1)",
      "S+": "rgba(255, 215, 0, 1)",
      "SS": "rgba(127, 255, 212, 1)"
    }
  },
}

const lampColours = {
  ddr:{
    fill: {
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "CLEAR": "rgba(70, 130, 180, 0.2)",
      "FULL COMBO": "rgba(153, 50, 204, 0.2)",
      "GREAT FULL COMBO": "rgba(127, 255, 212, 0.2)",
      "PERFECT FULL COMBO": "rgba(50, 205, 50, 0.2)",
      "MARVELOUS FULL COMBO": "rgba(255, 215, 0, 0.2)"
    },
    outline:{
      "FAILED": "rgba(85, 17, 17, 1)",
      "CLEAR": "rgba(70, 130, 180, 1)",
      "FULL COMBO": "rgba(153, 50, 204, 1)",
      "GREAT FULL COMBO": "rgba(127, 255, 212, 1)",
      "PERFECT FULL COMBO": "rgba(50, 205, 50, 1)",
      "MARVELOUS FULL COMBO": "rgba(255, 215, 0, 1)"
    }
  },
  osumania: {
    fill: {
      "CLEAR": "rgba(70, 130, 180, 0.2)",
      "SDCB": "rgba(153, 50, 204, 0.2)",
      "FULL COMBO": "rgba(127, 255, 212, 0.2)",
      "SDG": "rgba(50, 205, 50, 0.2)",
      "PERFECT FULL COMBO": "rgba(255, 215, 0, 0.2)",
      "RAINBOW FULL COMBO": "rgba(255,105,180,0.2)"
    },
    outline:{
      "CLEAR": "rgba(70, 130, 180, 1)",
      "SDCB": "rgba(153, 50, 204, 1)",
      "FULL COMBO": "rgba(127, 255, 212, 1)",
      "SDG": "rgba(50, 205, 50, 1)",
      "PERFECT FULL COMBO": "rgba(255, 215, 0, 1)",
      "RAINBOW FULL COMBO": "rgba(255,105,180,1)",
    }
  },
  etterna: {
    fill: {
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "CLEAR": "rgba(70, 130, 180, 0.2)",
      "SDCB": "rgba(153, 50, 204, 0.2)",
      "MISSFLAG": "rgba(105, 105, 105, 0.2)",
      "FULL COMBO": "rgba(127, 255, 212, 0.2)",
      "SDG": "rgba(35, 203, 167, 0.2)",
      "BLACKFLAG": "rgba(3, 166, 120, 0.2)",
      "PERFECT FULL COMBO": "rgba(255, 215, 0, 0.2)",
      "SDP": "rgba(247, 202, 24, 0.2)",
      "WHITEFLAG": "rgba(232, 236, 241, 0.2)",
      "MARVELOUS FULL COMBO": "rgba(192,192,192 ,0.2 )"
    },
    outline:{
      "FAILED": "rgba(85, 17, 17, 1)",
      "CLEAR": "rgba(70, 130, 180, 1)",
      "SDCB": "rgba(153, 50, 204, 1)",
      "MISSFLAG": "rgba(105, 105, 105, 1)",
      "FULL COMBO": "rgba(127, 255, 212, 1)",
      "SDG": "rgba(35, 203, 167, 1)",
      "BLACKFLAG": "rgba(3, 166, 120, 1)",
      "PERFECT FULL COMBO": "rgba(255, 215, 0, 1)",
      "SDP": "rgba(247, 202, 24, 1)",
      "WHITEFLAG": "rgba(232, 236, 241, 1)",
      "MARVELOUS FULL COMBO": "rgba(192,192,192 ,1)"
    }
  },
  iidx: {
    fill: {
      "NO PLAY": "rgba(105, 105, 105, 0.2)", // lol
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "ASSIST CLEAR": "rgba(153, 50, 204, 0.2)",
      "EASY CLEAR": "rgba(50, 205, 50, 0.2)",
      "CLEAR": "rgba(70, 130, 180, 0.2)",
      "HARD CLEAR": "rgba(255, 127, 80,0.2)",
      "EX HARD CLEAR": "rgba(255, 215, 0, 0.2)",
      "FULL COMBO": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "NO PLAY": "rgba(105, 105, 105, 1)",
      "FAILED": "rgba(85, 17, 17, 1)",
      "ASSIST CLEAR": "rgba(153, 50, 204, 1)",
      "EASY CLEAR": "rgba(50, 205, 50, 1)",
      "CLEAR": "rgba(70, 130, 180, 1)",
      "HARD CLEAR": "rgba(255, 127, 80,1)",
      "EX HARD CLEAR": "rgba(255, 215, 0, 1)",
      "FULL COMBO": "rgba(127, 255, 212, 1)"
    }
  },
  bms: {
    fill: {
      "NO PLAY": "rgba(105, 105, 105, 0.2)", // lol
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "ASSIST CLEAR": "rgba(153, 50, 204, 0.2)",
      "EASY CLEAR": "rgba(50, 205, 50, 0.2)",
      "CLEAR": "rgba(70, 130, 180, 0.2)",
      "HARD CLEAR": "rgba(255, 127, 80,0.2)",
      "EX HARD CLEAR": "rgba(255, 215, 0, 0.2)",
      "FULL COMBO": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "NO PLAY": "rgba(105, 105, 105, 1)",
      "FAILED": "rgba(85, 17, 17, 1)",
      "ASSIST CLEAR": "rgba(153, 50, 204, 1)",
      "EASY CLEAR": "rgba(50, 205, 50, 1)",
      "CLEAR": "rgba(70, 130, 180, 1)",
      "HARD CLEAR": "rgba(255, 127, 80,1)",
      "EX HARD CLEAR": "rgba(255, 215, 0, 1)",
      "FULL COMBO": "rgba(127, 255, 212, 1)"
    }
  },
  museca: {
    fill: {
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "CLEAR": "rgba(50, 205, 50, 0.2)",
      "CONNECT ALL": "rgba(70, 130, 180, 0.2)",
      "PERFECT CONNECT ALL": "rgba(255, 215, 0, 0.2)"
    },
    outline:{
      "FAILED": "rgba(85, 17, 17, 1)",
      "CLEAR": "rgba(50, 205, 50, 1)",
      "CONNECT ALL": "rgba(70, 130, 180, 1)",
      "PERFECT CONNECT ALL": "rgba(255, 215, 0, 1)"
    }
  },
  sdvx: {
    fill: {
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "CLEAR": "rgba(50, 205, 50, 0.2)",
      "EXCESSIVE CLEAR": "rgba(153, 50, 204, 0.2)",
      "ULTIMATE CHAIN": "rgba(70, 130, 180, 0.2)",
      "PERFECT ULTIMATE CHAIN": "rgba(255, 215, 0, 0.2)"
    },
    outline:{
      "FAILED": "rgba(85, 17, 17, 1)",
      "CLEAR": "rgba(50, 205, 50, 1)",
      "EXCESSIVE CLEAR": "rgba(153, 50, 204, 1)",
      "ULTIMATE CHAIN": "rgba(70, 130, 180, 1)",
      "PERFECT ULTIMATE CHAIN": "rgba(255, 215, 0, 1)"
    }
  },
  popn: {
    fill: {
      "FAILED": "rgba(85, 17, 17, 0.2)",
      "CLEAR": "rgba(50, 205, 50, 0.2)",
      "FULL COMBO": "rgba(70, 130, 180, 0.2)",
      "PERFECT": "rgba(255, 215, 0, 0.2)"
    },
    outline:{
      "FAILED": "rgba(85, 17, 17, 1)",
      "CLEAR": "rgba(50, 205, 50, 1)",
      "FULL COMBO": "rgba(70, 130, 180, 1)",
      "PERFECT": "rgba(255, 215, 0, 1)"
    }
  },
  maimai: {
    fill: {
      "FAILED": "rgba(70, 130, 180, 0.2)",
      "CLEAR": "rgba(255, 255, 255, 0.2)",
      "FULL COMBO": "rgba(255, 215, 0, 0.2)",
      "ALL PERFECT": "rgba(127, 255, 212, 0.2)",
      "ALL PERFECT+": "rgba(192,192,192,0.2)"
    },
    outline:{
      "FAILED": "rgba(70, 130, 180, 1)",
      "CLEAR": "rgba(255, 255, 255, 1)",
      "FULL COMBO": "rgba(255, 215, 0, 1)",
      "ALL PERFECT": "rgba(127, 255, 212, 1)",
      "ALL PERFECT+": "rgba(192,192,192 ,1)"
    }
  },
  jubeat: {
    fill: {
      "FAILED": "rgba(70, 130, 180, 0.2)",
      "CLEAR": "rgba(255, 255, 255, 0.2)",
      "FULL COMBO": "rgba(255, 215, 0, 0.2)",
      "EXCELLENT": "rgba(127, 255, 212, 0.2)"
    },
    outline:{
      "FAILED": "rgba(70, 130, 180, 1)",
      "CLEAR": "rgba(255, 255, 255, 1)",
      "FULL COMBO": "rgba(255, 215, 0, 1)",
      "EXCELLENT": "rgba(127, 255, 212, 1)"
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
  osumania: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "50": "rgba(165, 38, 211, 0.2)",
      "100": "rgba(39, 190, 117,0.2)",
      "200": "rgba(38, 211, 78, 0.2)",
      "300": "rgba(241, 245, 24, 0.2)",
      "300M": "rgba(158, 248, 255, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "50": "rgba(165, 38, 211, 1)",
      "100": "rgba(39, 190, 117, 1)",
      "200": "rgba(38, 211, 78, 1)",
      "300": "rgba(241, 245, 24, 1)",
      "300M": "rgba(158, 248, 255, 1)"
    }
  },
  etterna: {
    fill: {
      "MISS": "rgba(211, 38, 38, 0.2)",
      "BAD": "rgba(165, 38, 211, 0.2)",
      "GOOD": "rgba(39, 190, 117,0.2)",
      "GREAT": "rgba(38, 211, 78, 0.2)",
      "PERFECT": "rgba(241, 245, 24, 0.2)",
      "MARVELOUS": "rgba(158, 248, 255, 0.2)"
    },
    outline:{
      "MISS": "rgba(211, 38, 38, 1)",
      "BAD": "rgba(165, 38, 211, 1)",
      "GOOD": "rgba(39, 190, 117, 1)",
      "GREAT": "rgba(38, 211, 78, 1)",
      "PERFECT": "rgba(241, 245, 24, 1)",
      "MARVELOUS": "rgba(158, 248, 255, 1)"
    }
  }
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
  osumania: [],
  etterna: []
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
  // THIS FOR LOOP IS ITERATING DOWNWARDS
  // JUST INCASE YOU DON'T ACTUALLY READ IT PROPERLY
  for (let i = grades[game].length; i >= 0; i--) {
    var gradeName = grades[game][i]
    var gradeBound = gradeBoundaries[game][i]
    
    if (percent >= gradeBound){
      return gradeName;
    }
  }

  // if we get all this way they've got a negative score
  // idk what to write in this case so ur gonna get the worst grade and throw an error in my logs
  console.error("Negative score parsed?",percent)
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
  },
  osumania: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.93, // grade: A
    clearExpMultiplier: 1.35 // no real reason
  },
  etterna: {
    failHarshnessMultiplier: 1,
    pivotPercent: 0.93, // grade: AA
    clearExpMultiplier: 1.35 // no real reason
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
  else if (game === "osumania"){
    // mania percent calc
    // add slight punishment for 300s, essentially reuse scorev1
    // score v2 is ms based but due to CLT we can use mean values
    percent = hitData["300M"] * 1 + hitData["300"] * 0.995 + hitData["200"] * (2/3) + hitData["100"] * (1/3) + hitData["50"] * (1/6);

    percent = (percent * 100) / (Object.values(hitData).reduce((a,b) => a+b,0));
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



if (typeof window === 'undefined'){
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
    difficultyChangingMods,
    invalidatingMods,
    CalculatePercent,
    clearLamp,
    validModifiers,
    adviceChartTags,
    adviceNoteTags,
    GetGradeWithScore,
    rivalGroupDefaultCellShading
  };
}
