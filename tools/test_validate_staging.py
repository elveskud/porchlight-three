#!/usr/bin/env python3
"""Bad staging must produce specific, repairable errors instead of a traceback."""
import copy,unittest
from validate_staging import validate
from init_staging import make_staging
SCRIPT={'episode':34,'beats':[{'id':'s01','location':'apartment','lines':[{'who':'riot','say':'One line.'},{'who':'pip','say':'Another line.'}]}]}
GOOD={'episode':34,'ending':{'camera':{'pos':[0,2,6],'target':[0,1,0]}},'beats':{'s01':{'set':'apartment','camera':{'pos':[0,2,6],'target':[0,1,0]},'actors':{'riot':{'at':[0,0,0]},'pip':{'at':[1,0,0]}}}}}
class ValidatorTests(unittest.TestCase):
 def check_bad(self,edit,text):
  data=copy.deepcopy(GOOD);edit(data['beats']['s01']);errors=validate(data,SCRIPT,spots={'apartment':{'sofa_left':{'pos':[0,.38,0]}}},hook_names=set());self.assertTrue(any(text in e for e in errors),errors)
 def test_unknown_seat(self):self.check_bad(lambda b:b['actors']['riot'].update(seat='no_such_seat'),'replace \'no_such_seat\' with a named seat')
 def test_missing_line(self):self.check_bad(lambda b:b.update(closeUps=[{'line':'s01_99','who':'riot'}]),'replace \'s01_99\' with a line id')
 def test_entrance_side(self):self.check_bad(lambda b:b.update(enter=[{'who':'riot','arriveBeforeLine':'s01_00'}]),'add side: "left" or side: "right"')
 def test_crosses_next_speaker(self):self.check_bad(lambda b:b.update(closeUps=[{'line':'s01_00','to':'s01_01','who':'riot'}]),'end the close-up before the next speaker')
 def test_seated_without_seat(self):self.check_bad(lambda b:b['actors']['riot'].update(seated=True),'seated actors must name a seat')
 def test_good(self):self.assertEqual([],validate(GOOD,SCRIPT,spots={},hook_names=set()))
 def test_short_closeup(self):self.check_bad(lambda b:b.update(closeUps=[{'line':'s01_00','who':'riot','duration':.5}]),'at least 1.1 seconds')
 def test_unknown_hook(self):self.check_bad(lambda b:b.update(hooks=['props.missing']),'export hook \'props.missing\'')
 def test_wrong_script_location(self):self.check_bad(lambda b:b.update(set='park'),'match the script location')
 def test_identical_positions(self):self.check_bad(lambda b:b['actors']['pip'].update(at=[0,0,0]),'overlaps riot exactly')
 def test_dialogue_beyond_beat(self):
  timeline={'beats':[{'id':'s01','start':0,'end':1}], 'events':[{'id':'s01_00','beat':'s01','start':.6,'end':3,'who':'riot'}]}
  errors=validate(GOOD,SCRIPT,spots={},hook_names=set(),timeline=timeline)
  self.assertTrue(any('line s01_00 finishes before the beat ends' in e for e in errors),errors)
 def test_missing_ending(self):
  data=copy.deepcopy(GOOD);data.pop('ending');errors=validate(data,SCRIPT,spots={},hook_names=set())
  self.assertTrue(any('copy ending.camera from the example' in e for e in errors),errors)
 def test_starter_preserves_script_structure(self):
  data=make_staging(SCRIPT,{})
  self.assertEqual({'s01'},set(data['beats']));self.assertEqual('apartment',data['beats']['s01']['set'])
  self.assertNotIn('duration',data['beats']['s01']);self.assertEqual([],validate(data,SCRIPT,spots={},hook_names=set()))
if __name__=='__main__':unittest.main()
