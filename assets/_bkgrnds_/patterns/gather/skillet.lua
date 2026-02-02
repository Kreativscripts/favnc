SetName("Skillet")

local dwFDC = 0.2 * 4
local hwFDC = 0.3 * 4
local crFDC = 0.3 * 4
local dwAlign = 1.5 * 4
local hwAlign = 1.5 * 4

Walk(Direction.Right, (3 + hwFDC / 4) * 4)
Walk(Direction.Forward, 1.5 * 4)
Walk(Direction.Left, 6 * 4)
Walk(Direction.Forward, 1.5 * 4)
Walk(Direction.Right, (6 + hwFDC / 4 + hwAlign / 4) * 4)

SetYaw(7)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds((6 + dwFDC / 4) * 4)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(6 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds((3 + dwFDC / 4) * 4)
KeyUp(Key.Backward)
KeyUp(Key.Left)

SetYaw(0)

Walk(Direction.Backward, (3 + dwFDC / 4) * 4)
Walk(Direction.Left, 1.5 * 4)
Walk(Direction.Forward, 6 * 4)
Walk(Direction.Left, 1.5 * 4)
Walk(Direction.Backward, (6 + dwFDC / 4) * 4)

if dwAlign > 0 then
    Walk(Direction.Backward, (dwAlign / 4 + 2) * 4)
    Walk(Direction.Forward, (dwAlign / 4) * 4)
end

SetYaw(6)

Walk(Direction.Backward, (6 + hwFDC / 4) * 4)
Walk(Direction.Right, 1.5 * 4)
Walk(Direction.Forward, 6 * 4)
Walk(Direction.Right, 1.5 * 4)
Walk(Direction.Backward, (3 + hwFDC / 4) * 4)

SetYaw(0)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(3 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(6 * 4)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(6 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Right)

SetYaw(7)

Walk(Direction.Backward, (6 + crFDC / 4) * 4)
Walk(Direction.Left, 1.5 * 4)
Walk(Direction.Forward, 6 * 4)
Walk(Direction.Left, 1.5 * 4)
Walk(Direction.Backward, (3 + crFDC / 4) * 4)

SetYaw(0)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds((3 + crFDC / 4) * 4)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(6 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Left)
SleepStuds(1.5 * 4)
KeyUp(Key.Backward)
KeyUp(Key.Left)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds((6 + crFDC / 4) * 4)
KeyUp(Key.Backward)
KeyUp(Key.Right)

SetYaw(6)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(6 * 4)
KeyUp(Key.Backward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Forward)
KeyDown(Key.Left)
SleepStuds(6 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Left)

KeyDown(Key.Forward)
KeyDown(Key.Right)
SleepStuds(1.5 * 4)
KeyUp(Key.Forward)
KeyUp(Key.Right)

KeyDown(Key.Backward)
KeyDown(Key.Right)
SleepStuds(3 * 4)
KeyUp(Key.Backward)
KeyUp(Key.Right)

SetYaw(0)
