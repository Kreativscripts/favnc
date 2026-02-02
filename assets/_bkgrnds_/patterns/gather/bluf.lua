SetName("BlueFlower")

for i = 1, 2 do
    Walk(Left, 11)
    Sleep(30)
    Walk(Forward, 6.2)
    Sleep(30)
    Walk(Right, 52) -- Align
    Sleep(30)
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
    Walk(Forward, 6.2)
    Sleep(30)
    Walk(Right, 22)
    Sleep(30)
    Walk(Forward, 6)
    Sleep(30)
    Walk(Left, 11)
    Sleep(30)

    if Pattern.Interrupt then
        Sleep(30)
        Walk(Left, 9)
        break
    end
end