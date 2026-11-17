// Production coordinates preserve the existing episode stage, rather than rescaling the town atlas.
// These connections follow the painting/bible/atlas; their exact metric positions are inferred.
export const LAKE_OUTLINE=[[-42,-15],[-37,-22],[-27,-26],[-17,-25],[-6,-23],[2,-21.7],[12,-20.5],[24,-20.8],[35,-20],[42,-14],[37,-8],[27,-4.5],[16,-2.8],[6,-2],[-5,-2],[-15,-3.6],[-26,-7],[-36,-10]];
export const COVERAGE={terrain:[-320,320,-320,320],finishedCameraArea:[-90,110,-95,70],waterLevel:-.015,stageGround:-.05,forestSeed:4917};
export const SITES=[
 {id:'lake_church',name:'Lake church',position:[4.8,-24.3],source:'art/gemini/sets/lake_day_v2.jpg'},
 {id:'snack_shack',name:'Lake snack shack',position:[17,11],source:'maple hollow tree.js/plan.json'},
 {id:'park',name:'Lakeside park',position:[27,15],source:'BIBLE.md'},
 {id:'brook_house',name:'Mrs. Brook’s house',position:[-52,-19],source:'maple hollow tree.js/PLAN.md'},
 {id:'apartment',name:'Riot and Rocco’s apartment',position:[58,-16],source:'maple hollow tree.js/PLAN.md'},
 {id:'forest',name:'West woods',position:[-64,-1],source:'BIBLE.md'},
 {id:'main_street',name:'Town connection',position:[76,-40],source:'maple hollow tree.js/PLAN.md'},
];
export const SHOTS=[
 {id:'wide',label:'Beach wide',position:[3,4.8,16],target:[0,2,-10]},
 {id:'detail',label:'Lookout',position:[-1,4.5,8],target:[-5,2,-1]},
 {id:'reverse',label:'Reverse beach',position:[1,4,-11],target:[3,1.7,15]},
 {id:'parkward',label:'Park & access',position:[5,4,2],target:[26,1.7,14]},
 {id:'west',label:'Wooded bank',position:[-19,4,-6],target:[-48,2,-17]},
 {id:'townward',label:'Toward town',position:[22,5,-10],target:[57,3,-26]},
 {id:'farshore',label:'Far shore',position:[12,4,-13],target:[14,4,-29]},
 {id:'overhead',label:'Whole lake',position:[12,94,30],target:[0,0,-12]},
];
export const TOUR=[
 {id:'beach',title:'The swimming beach',duration:4,from:[4,5.2,18],to:[1,4.8,15],target:[-2,2,-10]},
 {id:'reverse',title:'Behind the camera',duration:4,from:[0,4,-12],to:[3,4.3,-10],target:[5,1.9,16]},
 {id:'park',title:'Park, paths & beach access',duration:4,from:[5,4,4],to:[9,4.3,3],target:[25,2,14]},
 {id:'woods',title:'The wooded west bank',duration:4,from:[-20,4,-6],to:[-23,4.5,-8],target:[-49,2.4,-18]},
 {id:'town',title:'The eastern approach to town',duration:4,from:[23,5,-10],to:[27,5.5,-12],target:[57,3.5,-26]},
 {id:'hall',title:'Far shore & old hall',duration:4,from:[12,7,-12],to:[15,7.7,-13],target:[15,5.8,-30]},
 {id:'aerial',title:'A continuous environment',duration:6,from:[42,67,56],to:[28,76,40],target:[0,0,-13]},
];
