SetName("Bowl")

-- Variables in studs
StepSize = 3 * 6.75
rightDrift = 16 + Pattern.Alignment
rightOff = 10 + Pattern.Alignment
downDrift = 8 + Pattern.Alignment
downOff = 15 + Pattern.Alignment
FDCtoHoney = 0.8
FDCtoCorner = 0.6

-- ONE type 1
KeyDown(Key.Backward)
SleepStuds(StepSize + FDCtoHoney)
KeyUp(Key.Backward)

KeyDown(Key.Right)
SleepStuds(StepSize + FDCtoHoney)
KeyUp(Key.Right)

Walk(Direction.Forward, StepSize)

--align to walls
SetYaw(6)
Walk(Direction.Backward, rightDrift + rightOff)
Walk(Direction.Forward, rightOff)

SetYaw(0)
Walk(Direction.Left, StepSize)

-- ONE type 2
SetYaw(6)
Walk(Direction.Left, downDrift + downOff * 2.5)
Walk(Direction.Right, downOff * 2.25)
-- end align

SetYaw(0)
KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(StepSize + FDCtoHoney)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

SetYaw(0)
Walk(Direction.Left, StepSize)
Walk(Direction.Backward, StepSize)
Walk(Direction.Right, StepSize + FDCtoHoney)

SetYaw(7)
KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Left)

SetYaw(0)
Walk(Direction.Forward, 2)
-- TWO type 1
KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(StepSize + FDCtoCorner)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Left)

SetYaw(7)
Walk(Direction.Backward, StepSize + FDCtoCorner)
Walk(Direction.Right, StepSize)
Walk(Direction.Forward, StepSize)

SetYaw(0)
Walk(Direction.Forward, 2)
KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

SetYaw(7)
Walk(Direction.Forward, StepSize)
Walk(Direction.Left, StepSize)
Walk(Direction.Backward, StepSize + FDCtoCorner)

SetYaw(0)
Walk(Direction.Forward, 2)

-- TWO type 2
KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Left)

SetYaw(7)
Walk(Direction.Backward, StepSize + FDCtoCorner)
Walk(Direction.Right, StepSize)
Walk(Direction.Forward, StepSize)

SetYaw(0)
Walk(Direction.Forward, 2)
KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(StepSize)
KeyUp(Key.Forward)
KeyUp(Key.Right)

SetYaw(7)
Walk(Direction.Forward, StepSize)
Walk(Direction.Left, StepSize)
Walk(Direction.Backward, StepSize + FDCtoCorner)

SetYaw(0)
Walk(Direction.Forward, 2)
Sleep(70)