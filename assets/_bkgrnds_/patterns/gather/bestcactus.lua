SetName("BestCactus")

for i = 1, Pattern.Repetitions do
    Walk(Backward, 16)
    Walk(Right, 4)
    Walk(Backward, 24)
    Walk(Left, 36)
    WalkAsync(Backward, 4)
    Walk(Left, 4)

    Walk(Forward, 20) -- basic
    Walk(Left, 20)
    Walk(Forward, 8)
    Walk(Right, 32)
    Walk(Forward, 8)
    Walk(Left, 24)
    Walk(Forward, 8)
    Walk(Right, 32)

    Walk(Backward, 8 + Pattern.Alignment) -- back
    Walk(Left, 24)
    Walk(Backward, 8 + Pattern.Alignment)
    Walk(Right, 24)
end