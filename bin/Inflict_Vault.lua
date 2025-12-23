local Players=game:GetService("Players")
local RunService=game:GetService("RunService")
local TweenService=game:GetService("TweenService")

local player=Players.LocalPlayer

local VAULT_ANIM_ID="rbxassetid://121957686985379"

local DEBUG=true

local ONLY_NAME_WALL=true
local WALL_NAME="wall"
local ONLY_ANCHORED=false

local DETECT_RADIUS=3.4
local PROBE_DISTANCE=2.3
local LAND_PAST_WALL=2.3

local MIN_WALL_HEIGHT=1.3
local MAX_WALL_HEIGHT=5.6
local CLEARANCE=0.6

local VAULT_DURATION=0.4
local COOLDOWN=0.65

local vaulting=false
local lastVault=0

local function log(...)
	if DEBUG then print("[VAULT]",...) end
end

local function warnlog(...)
	if DEBUG then warn("[VAULT]",...) end
end

local function lower(s) return string.lower(tostring(s or "")) end

local function getChar() return player.Character end
local function getHum(char) return char and char:FindFirstChildOfClass("Humanoid") end
local function getRoot(char) return char and char:FindFirstChild("HumanoidRootPart") end

local function isWallPart(p)
	if not p or not p:IsA("BasePart") then return false end
	if not p.CanCollide then return false end
	if ONLY_ANCHORED and p.Anchored~=true then return false end
	if ONLY_NAME_WALL and lower(p.Name)~=lower(WALL_NAME) then return false end
	return true
end

local function raycast(origin,dir,ignoreList)
	local rp=RaycastParams.new()
	rp.FilterType=Enum.RaycastFilterType.Exclude
	rp.FilterDescendantsInstances=ignoreList
	rp.IgnoreWater=true
	return workspace:Raycast(origin,dir,rp)
end

local function getNearestWall(root,char)
	local params=OverlapParams.new()
	params.FilterType=Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances={char}
	local parts=workspace:GetPartBoundsInRadius(root.Position,DETECT_RADIUS,params)
	local best=nil
	local bestD=nil
	for _,p in ipairs(parts) do
		if isWallPart(p) then
			local d=(p.Position-root.Position).Magnitude
			if not bestD or d<bestD then
				best=p
				bestD=d
			end
		end
	end
	return best,bestD
end

local function bottomY(hum,root)
	return root.Position.Y-(hum.HipHeight+root.Size.Y*0.5)
end

local function wallTopY(wall)
	return wall.Position.Y+wall.Size.Y*0.5
end

local function hasHeadroom(char,topPos)
	local origin=Vector3.new(topPos.X,topPos.Y+CLEARANCE,topPos.Z)
	return raycast(origin,Vector3.new(0,CLEARANCE*2,0),{char})==nil
end

local function landingOK(char,probePos)
	local down=raycast(probePos,Vector3.new(0,-12,0),{char})
	if not down then return nil end
	return down.Position
end

local function getAcrossAndHit(root,char,wall,moveDir)
	local from=root.Position+Vector3.new(0,0.9,0)
	local toward=wall.Position-from
	local flat=Vector3.new(toward.X,0,toward.Z)
	local dir
	if flat.Magnitude<0.05 then
		local f=moveDir.Magnitude>0.1 and moveDir.Unit or root.CFrame.LookVector
		local ff=Vector3.new(f.X,0,f.Z)
		dir=ff.Magnitude>0.05 and ff.Unit or Vector3.new(0,0,-1)
	else
		dir=flat.Unit
	end
	local hit=raycast(from,dir*(PROBE_DISTANCE+3.0),{char})
	if hit and hit.Instance then
		local n=hit.Normal
		local across=Vector3.new(-n.X,0,-n.Z)
		if across.Magnitude>0.05 then
			across=across.Unit
			return across,hit,dir
		end
	end
	return dir,nil,dir
end

local function ensureAnimator(hum)
	local animator=hum:FindFirstChildOfClass("Animator")
	if animator then return animator end
	animator=Instance.new("Animator")
	animator.Parent=hum
	return animator
end

local function loadTrack(hum)
	local animator=ensureAnimator(hum)
	local anim=Instance.new("Animation")
	anim.AnimationId=VAULT_ANIM_ID
	local ok,track=pcall(function() return animator:LoadAnimation(anim) end)
	if not ok or not track then
		warnlog("LoadAnimation failed",ok,track)
		anim:Destroy()
		return nil,nil
	end
	track.Priority=Enum.AnimationPriority.Action
	return track,anim
end

local function waitLength(track)
	local t=os.clock()
	while track.Length==0 and os.clock()-t<2 do
		RunService.Heartbeat:Wait()
	end
	return track.Length>0 and track.Length or 0
end

local function findMotorByParts(char,part0Name,part1Name)
	for _,d in ipairs(char:GetDescendants()) do
		if d:IsA("Motor6D") then
			local p0=d.Part0
			local p1=d.Part1
			if p0 and p1 and p0.Name==part0Name and p1.Name==part1Name then
				return d
			end
		end
	end
	return nil
end

local function collectPoseMotors(char)
	local motors={}
	local rigType=nil
	local hum=char:FindFirstChildOfClass("Humanoid")
	if hum then rigType=hum.RigType end

	if rigType==Enum.HumanoidRigType.R15 then
		motors.UpperTorso=findMotorByParts(char,"LowerTorso","UpperTorso") or findMotorByParts(char,"HumanoidRootPart","LowerTorso")
		motors.RShoulder=findMotorByParts(char,"UpperTorso","RightUpperArm")
		motors.RElbow=findMotorByParts(char,"RightUpperArm","RightLowerArm")
		motors.LShoulder=findMotorByParts(char,"UpperTorso","LeftUpperArm")
		motors.LElbow=findMotorByParts(char,"LeftUpperArm","LeftLowerArm")
		motors.RHip=findMotorByParts(char,"LowerTorso","RightUpperLeg")
		motors.LHip=findMotorByParts(char,"LowerTorso","LeftUpperLeg")
	else
		motors.Torso=findMotorByParts(char,"HumanoidRootPart","Torso")
		motors.RShoulder=findMotorByParts(char,"Torso","Right Arm")
		motors.LShoulder=findMotorByParts(char,"Torso","Left Arm")
		motors.RHip=findMotorByParts(char,"Torso","Right Leg")
		motors.LHip=findMotorByParts(char,"Torso","Left Leg")
	end

	return motors,rigType
end

local function setTransform(m,cf)
	if m then m.Transform=cf end
end

local function clearTransforms(motors)
	for _,m in pairs(motors) do
		if typeof(m)=="Instance" and m:IsA("Motor6D") then
			m.Transform=CFrame.new()
		end
	end
end

local function applyProceduralVaultPose(motors,rigType,alpha)
	alpha=math.clamp(alpha,0,1)
	local ease=alpha<0.5 and (2*alpha*alpha) or (1-((-2*alpha+2)^2)/2)

	if rigType==Enum.HumanoidRigType.R15 then
		setTransform(motors.UpperTorso,CFrame.Angles(math.rad(-10*ease),math.rad(12*ease),0))
		setTransform(motors.RShoulder,CFrame.Angles(math.rad(-45*ease),math.rad(25*ease),math.rad(10*ease)))
		setTransform(motors.RElbow,CFrame.Angles(math.rad(-20*ease),0,0))
		setTransform(motors.LShoulder,CFrame.Angles(math.rad(10*ease),math.rad(-10*ease),math.rad(-5*ease)))
		setTransform(motors.LElbow,CFrame.Angles(math.rad(5*ease),0,0))
		setTransform(motors.RHip,CFrame.Angles(math.rad(18*ease),0,0))
		setTransform(motors.LHip,CFrame.Angles(math.rad(18*ease),0,0))
	else
		setTransform(motors.Torso,CFrame.Angles(math.rad(-8*ease),math.rad(10*ease),0))
		setTransform(motors.RShoulder,CFrame.Angles(math.rad(-35*ease),math.rad(15*ease),math.rad(8*ease)))
		setTransform(motors.LShoulder,CFrame.Angles(math.rad(8*ease),math.rad(-8*ease),math.rad(-5*ease)))
		setTransform(motors.RHip,CFrame.Angles(math.rad(12*ease),0,0))
		setTransform(motors.LHip,CFrame.Angles(math.rad(12*ease),0,0))
	end
end

local function playVaultAnim(hum)
	log("Player RigType =",hum.RigType)
	local track,animObj=loadTrack(hum)
	if not track then
		warnlog("Track nil, using procedural pose")
		return nil,nil,VAULT_DURATION,0
	end
	local okPlay,err=pcall(function() track:Play(0.05,1,1) end)
	if not okPlay then warnlog("Track:Play error",err) end
	local len=waitLength(track)
	local speed=1
	if len>0 then
		speed=math.clamp(len/VAULT_DURATION,0.75,2.5)
		pcall(function() track:AdjustSpeed(speed) end)
		pcall(function() track:AdjustWeight(1,0.05) end)
	end
	local dur=(len>0 and (len/speed) or VAULT_DURATION)
	log("Anim loaded. Length=",len," Speed=",speed," Dur=",dur," IsPlaying=",track.IsPlaying," Priority=",track.Priority.Name)
	return track,animObj,dur,len
end

local function doVault(char,hum,root,wall,across,hitInfo,wallDist,dir)
	vaulting=true
	lastVault=os.clock()

	log("Vault start. Wall=",wall:GetFullName()," Dist=",wallDist," Anchored=",wall.Anchored)

	local topY=wallTopY(wall)
	local wallH=topY-bottomY(hum,root)
	log("WallH=",wallH," TopY=",topY)
	if wallH<MIN_WALL_HEIGHT or wallH>MAX_WALL_HEIGHT then
		log("Rejected: wall height out of range")
		vaulting=false
		return
	end

	local topPos=Vector3.new((hitInfo and hitInfo.Position.X) or wall.Position.X,topY,(hitInfo and hitInfo.Position.Z) or wall.Position.Z)
	if not hasHeadroom(char,topPos) then
		log("Rejected: no headroom")
		vaulting=false
		return
	end

	local oldWS=hum.WalkSpeed
	local oldJP=hum.JumpPower
	local oldJH=hum.JumpHeight
	local oldAR=hum.AutoRotate

	hum.AutoRotate=false
	hum.WalkSpeed=0
	hum.JumpPower=0
	hum.JumpHeight=0
	root.AssemblyLinearVelocity=Vector3.zero
	root.AssemblyAngularVelocity=Vector3.zero

	local motors,rigType=collectPoseMotors(char)
	local track,animObj,dur,len=playVaultAnim(hum)

	local useProcedural=true
	if track and len>0 then
		useProcedural=true
		log("Using animation + procedural assist")
	else
		log("Using procedural only (animation missing/failed)")
	end

	local wallHalf=math.max(wall.Size.X,wall.Size.Z)*0.5
	local rootHalf=math.max(root.Size.X,root.Size.Z)*0.5
	local up=Vector3.new(0,(topY-root.Position.Y)+0.15,0)
	local over=across*(wallHalf+rootHalf+LAND_PAST_WALL)

	local startPos=root.Position
	local midPos=startPos+up+across*(wallHalf+0.35)
	local endProbe=(startPos+over)+Vector3.new(0,3.2,0)
	local land=landingOK(char,endProbe)
	if not land then
		log("Rejected: no landing surface")
		hum.WalkSpeed=oldWS
		hum.JumpPower=oldJP
		hum.JumpHeight=oldJH
		hum.AutoRotate=oldAR
		if track then pcall(function() track:Stop(0.05) end) end
		if animObj then animObj:Destroy() end
		clearTransforms(motors)
		vaulting=false
		return
	end

	local endPos=Vector3.new(land.X,land.Y+root.Size.Y*0.5+0.05,land.Z)
	local startCF=CFrame.new(startPos,startPos+across)
	local midCF=CFrame.new(midPos,midPos+across)
	local endCF=CFrame.new(endPos,endPos+across)

	log("Move start->mid->end Dur=",dur," start=",startPos," mid=",midPos," end=",endPos)

	root.CFrame=startCF

	local t1=TweenService:Create(root,TweenInfo.new(dur*0.55,Enum.EasingStyle.Quad,Enum.EasingDirection.Out),{CFrame=midCF})
	local t2=TweenService:Create(root,TweenInfo.new(dur*0.45,Enum.EasingStyle.Quad,Enum.EasingDirection.In),{CFrame=endCF})

	local poseConn=nil
	if useProcedural then
		local t0=os.clock()
		poseConn=RunService.RenderStepped:Connect(function()
			local a=(os.clock()-t0)/dur
			if a>=1 then a=1 end
			applyProceduralVaultPose(motors,rigType,a)
			if a>=1 and poseConn then
				poseConn:Disconnect()
				poseConn=nil
			end
		end)
	end

	t1:Play()
	t1.Completed:Wait()
	t2:Play()
	t2.Completed:Wait()

	if poseConn then poseConn:Disconnect() end
	clearTransforms(motors)

	hum.WalkSpeed=oldWS
	hum.JumpPower=oldJP
	hum.JumpHeight=oldJH
	hum.AutoRotate=oldAR
	hum:ChangeState(Enum.HumanoidStateType.Running)

	if track then
		log("Anim end. IsPlaying(before stop)=",track.IsPlaying," Len=",len)
		pcall(function() track:Stop(0.08) end)
	end
	if animObj then animObj:Destroy() end

	log("Vault done.")
	task.wait(COOLDOWN)
	vaulting=false
end

log("Vault boot. ID=",VAULT_ANIM_ID," OnlyNameWall=",ONLY_NAME_WALL," OnlyAnchored=",ONLY_ANCHORED," VaultDuration=",VAULT_DURATION)

RunService.Heartbeat:Connect(function()
	local char=getChar()
	local hum=getHum(char)
	local root=getRoot(char)
	if not char or not hum or not root then return end
	if vaulting then return end
	if os.clock()-lastVault<COOLDOWN then return end
	if hum.FloorMaterial==Enum.Material.Air then return end
	if hum.MoveDirection.Magnitude<0.12 then return end

	local wall,dist=getNearestWall(root,char)
	if not wall then return end

	local across,hitInfo,dir=getAcrossAndHit(root,char,wall,hum.MoveDirection)
	local towardDot=hum.MoveDirection.Unit:Dot(dir)
	if towardDot<0.55 then return end

	log("Candidate wall",wall.Name," Dist=",dist," towardDot=",towardDot)

	task.spawn(function()
		doVault(char,hum,root,wall,across,hitInfo,dist,dir)
	end)
end)
