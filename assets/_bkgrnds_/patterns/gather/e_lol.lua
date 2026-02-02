SetName("e_lol")

SetDriftComp(true)
SetWidth(2)
SetLength(8)

Walk(Direction.Left, 5*Pattern.Width)

for i = 1, Pattern.Width do
    Walk(Direction.Backward, 5*Pattern.Length*0.5)
    Walk(Direction.Right, 2.5*Pattern.Width)
    Walk(Direction.Forward, 5*Pattern.Length*0.5)
    Walk(Direction.Right, 2.5*Pattern.Width)
end

for i = 1, Pattern.Width do
    Walk(Direction.Backward, 5*Pattern.Length*0.5)
    Walk(Direction.Left, 2.5*Pattern.Width)
    Walk(Direction.Forward, 5*Pattern.Length*0.5)
    Walk(Direction.Left, 2.5*Pattern.Width)
end

Walk(Direction.Right, 5*Pattern.Width)