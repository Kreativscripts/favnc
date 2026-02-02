SetName("BambooAlt")

for i = 1, 4 do
    Walk(Left, 68)
    Walk(Backward, 44 + Pattern.Alignment)
    if Pattern.Interrupt then
        Walk(Right, 40)
        Sleep(30)
        break
    end
    Walk(Forward, 4)
    Walk(Right, 14)
    Walk(Backward, 56)
    Sleep(100)

    for i = 1, 4 + Pattern.Repetitions do
        Walk(Right, 52)
        Walk(Forward, 9)
        Walk(Left, 52)
        Walk(Forward, 9)
    end
end
