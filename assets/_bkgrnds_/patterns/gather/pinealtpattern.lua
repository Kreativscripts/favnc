SetName("PineAlt")

for i = 1, 2 do
    Walk(Left, 80)
    Walk(Right, 6)
    Walk(Backward, 16)
    Walk(Right, 74)
    Walk(Forward, 128)
    Walk(Backward, 10)
    Walk(Left, 14)
    Walk(Backward, 89)

    if Pattern.Interrupt then
        WalkAsync(Left, 25.5)
        WalkAlign(Forward, 32)
        break
    end
end