--[[
 *  @Description Kettle - A simple pattern for Pine.
 *  @author Dully176
 *  @modifier sev3482
 *  @version 0.1.0 --> 0.1.1 - > 0.1.1A
 *  @date 10/8/2025 --> 11/20/2025 -> 12/28/2025
 *  Tweaked for compatibility (sev)
 *  @Settings {"position":"bottom-right","length":1,"width":1,"distance":3,"repetitions":2,"pitch":3,"backpackPercent":95,"seconds":600,"shiftLock":true,"walkReturn":true,"gatherPattern":"Kettle","field":"pinetree"}
]]

SetName("Kettle")

-- ===== User Settings ===== -- (4 * is just flower studs)
cornerFDC = 0.3 * 4 + Pattern.Alignment
diaMaskOffset = 1.5 * 4 + Pattern.Alignment
diaMaskDriftComp = 2 * 4 + Pattern.Alignment
honeyBeeOffset = 1.5 * 4 + Pattern.Alignment
honeyBeeDriftComp = 2 * 4 + Pattern.Alignment

-- ===== ADVANCED ===== --
l = 6.25 * 4
s = l / 4
h = l / 2

-- ===== PATTERN ===== --
Walk(Left, h)
Sleep(20)
Walk(Forward, s)
Sleep(20)
Walk(Right, l)
Sleep(20)
Walk(Forward, s)
Sleep(20)
Walk(Left, l)
Sleep(20)

KeyPress(Key.RotLeft)
Sleep(30)

WalkAsync(Left, l)
Walk(Backward, l)
Sleep(20)

if diaMaskOffset > 0 then
    WalkAsync(Left, diaMaskOffset + diaMaskDriftComp)
    Walk(Backward, diaMaskOffset + diaMaskDriftComp)
    Sleep(20)

    WalkAsync(Right, diaMaskOffset)
    Walk(Forward, diaMaskOffset)
    Sleep(20)
end

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Right, l)
Walk(Forward, l)
Sleep(20)

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Left, h)
Walk(Backward, h)
Sleep(20)

KeyPress(Key.RotRight)
Sleep(30)

Walk(Backward, h)
Sleep(20)
Walk(Right, s)
Sleep(20)
Walk(Forward, l)
Sleep(20)
Walk(Right, s)
Sleep(20)

if honeyBeeOffset > 0 then
    Walk(Right, honeyBeeOffset + honeyBeeDriftComp)
    Sleep(20)
    Walk(Left, honeyBeeOffset)
    Sleep(20)
end

Walk(Backward, l)
Sleep(20)

KeyPress(Key.RotLeft)
Sleep(30)
KeyPress(Key.RotLeft)
Sleep(30)

Walk(Forward, l)
Sleep(20)
Walk(Right, s)
Sleep(20)
Walk(Backward, l)
Sleep(20)
Walk(Right, s)
Sleep(20)
Walk(Forward, h)
Sleep(20)

KeyPress(Key.RotRight)
Sleep(30)
KeyPress(Key.RotRight)
Sleep(30)

-- shape two (diagonal)
WalkAsync(Left, h)
Walk(Forward, h)
Sleep(20)

WalkAsync(Right, s)
Walk(Forward, s)
Sleep(20)

WalkAsync(Right, l)
Walk(Backward, l)
Sleep(20)

WalkAsync(Right, s)
Walk(Forward, s)
Sleep(20)

WalkAsync(Left, l)
Walk(Forward, l)
Sleep(20)

KeyPress(Key.RotLeft)
Sleep(30)

Walk(Left, l)
Sleep(20)
Walk(Backward, s + cornerFDC)
Sleep(20)
Walk(Right, l)
Sleep(20)
Walk(Backward, s + cornerFDC)
Sleep(20)
Walk(Left, h)
Sleep(20)

KeyPress(Key.RotRight)
Sleep(30)

WalkAsync(Left, h)
Walk(Backward, h)
Sleep(20)

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Right, l)
Walk(Forward, l)
Sleep(20)

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Left, l)
Walk(Backward, l)
Sleep(20)

KeyPress(Key.RotLeft)
Sleep(30)
KeyPress(Key.RotLeft)
Sleep(30)

WalkAsync(Right, l)
Walk(Forward, l)
Sleep(20)

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Left, l)
Walk(Backward, l)
Sleep(20)

WalkAsync(Right, s)
Walk(Backward, s)
Sleep(20)

WalkAsync(Right, h)
Walk(Forward, h)
Sleep(20)

KeyPress(Key.RotRight)
Sleep(30)
KeyPress(Key.RotRight)