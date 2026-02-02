SetName("Bamboo")

for i = 1, 2 do
    Walk(Left, 11)
    Sleep(30)
    Walk(Forward, 6.2)
    Sleep(30)
    Walk(Right, 52) -- align
    Walk(Left, 14)
    Sleep(30)
    Walk(Forward, 6)
    Sleep(30)

    for i = 1, 2 do
        Walk(Left, 22)
        Sleep(30)
        Walk(Backward, 6)
        Sleep(30)
        Walk(Right, 22)
        Sleep(30)
        Walk(Backward, 6)
        Sleep(30)
    end

    Walk(Left, 22)
    Sleep(30)
    Walk(Forward, 6)
    Sleep(30)
    Walk(Right, 22)
    Sleep(30)
    Walk(Forward, 6)
    Sleep(30)
    Walk(Left, 11)
    Sleep(30)

    if Pattern.Interrupt then
        WalkAsync(Forward, 2)
        Walk(Left, 8)
        Sleep(30)
        break
    end
end