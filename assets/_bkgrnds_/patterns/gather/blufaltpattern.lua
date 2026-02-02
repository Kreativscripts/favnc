SetName("BlueFlowerAlt")

for i = 1, 2 do
    for i = 1, 2 do
        Walk(Forward, 6)
        Walk(Left, 60)
        Walk(Forward, 6)
        Walk(Right, 60)
    end

    Walk(Right, 28 + Pattern.Alignment)
    Walk(Backward, 80 + Pattern.Alignment)

    if Pattern.Interrupt then
        WalkAsync(Left, 55)
        WalkAlign(Forward, 55)
        Sleep(30)
        break
    end

end