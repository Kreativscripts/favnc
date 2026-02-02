SetName("hivehubloot")

SetYaw(0)
Walk(Left, 115)
Walk(Backward, 12)
Walk(Left, 10)
Walk(Right, 80)
Walk(Backward, 12)
Walk(Left, 90)

for i = 1, 2 do
    Walk(Backward, 12)
    Walk(Right, 100)
    Walk(Backward, 12)
    Walk(Left, 100)
end

Walk(Right, 8)
Walk(Backward, 13)
Walk(Right, 80)
Walk(Left, 15)
Walk(Backward, 13)
Walk(Left, 45)

-- Align
Walk({Forward, Right}, 140)
Sleep(30)
WalkAlign(Right, 15)
Sleep(30)
WalkAsync(Forward, 30)
Walk(Right, 35)