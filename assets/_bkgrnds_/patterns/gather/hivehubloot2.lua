SetName("hivehubloot2")

-- SetYaw(4)
Walk(Backward, 35)
Walk(Left, 46)

for i = 1, 3 do 
    Walk(Backward, 100)
    Walk(Right, 10)
    Walk(Forward, 100)
    if i ~= 3 then
        Walk(Right, 10)
    else
        Walk(Forward, 40)
        WalkAsync(Forward, 15)
        Walk(Left, 25)
    end
end