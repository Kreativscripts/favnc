SetName("CornerXSnake")

SetLength(6)
SetWidth(6)
SetRepetitions(4)
SetAlignment(15)

if Pattern.Iteration == 1 then
    Walk(Forward, Pattern.Alignment * 2)
    Walk(Left, Pattern.Alignment * 2)
end

Walk(Right, Pattern.Alignment)
Walk(Backward, Pattern.Alignment)

for i = 1, Pattern.Repetitions do
    KeyUp(Key.Forward)
    Walk(Right, 10*Pattern.Width*0.5)
    Walk(Backward, 2.5*Pattern.Length*0.5)
    Walk(Left, 10*Pattern.Width*0.5)
    Walk(Backward, 2.5*Pattern.Length*0.5)
    Walk(Right, 10*Pattern.Width*0.5)
    Walk(Backward, 2.5*Pattern.Length*0.5)
    Walk(Left, 10*Pattern.Width*0.5)
    Walk(Backward, 2.5*Pattern.Length*0.5)
    Walk(Right, 10*Pattern.Width*0.5)
    KeyDown(Key.Forward)
    lengthDist, widthDist = 14.14213*Pattern.Length*0.5, 14.14213*Pattern.Width*0.5
    WalkAsync(Left, widthDist)
    SleepStuds(lengthDist)
    if lengthDist < widthDist then
        KeyUp(Key.Forward)
        SleepStuds(widthDist-lengthDist)
    end
    if Pattern.Interrupt then
        break
    end
end

SleepStuds(Pattern.Alignment * 2)
KeyUp(Key.Forward)
KeyUp(Key.Left)
Walk(Left, Pattern.Alignment * 2)