#!/usr/bin/env python3
"""Bad staging must produce specific, repairable errors instead of a traceback."""
import copy,unittest
from validate_staging import validate
SCRIPT={'episode':34,'beats':[{'id':'s01','lines':[{'who':'riot','say':'One line.'},{'who':'pip','say':'Another line.'}]}]}
GOOD={'episode':34,'beats':{'s01':{'set':'apartment','camera':{'pos':[0,2,6],'target':[0,1,0]},'actors':{'riot':{'at':[0,0,0]},'pip':{'at':[1,0,0]}}}}}
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
if __name__=='__main__':unittest.main()
