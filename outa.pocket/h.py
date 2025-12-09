from datetime import datetime,timezone
import re,asyncio,discord
from discord.ext import commands

_ID_RE=re.compile(r'^<@!?(\d{17,20})>$|^(\d{17,20})$')

class FakeDualhookModal(discord.ui.Modal,title="Fake Dualhook"):
    victim=discord.ui.TextInput(label="Enter victim",placeholder="User ID",required=True,max_length=20)
    owner=discord.ui.TextInput(label="Enter dualhook owner",placeholder="User ID",required=True,max_length=20)
    async def on_submit(self,interaction:discord.Interaction):
        try:
            vid=int(self.victim.value.strip())
            oid=int(self.owner.value.strip())
        except:
            await interaction.response.send_message("Invalid IDs. Use raw user IDs only.",ephemeral=True)
            return
        client=interaction.client
        v=client.get_user(vid)
        if v is None:
            try:v=await client.fetch_user(vid)
            except:pass
        o=client.get_user(oid)
        if o is None:
            try:o=await client.fetch_user(oid)
            except:pass
        victim_mention=f"<@{vid}>"
        owner_mention=o.mention if o else f"<@{oid}>"
        author_name=str(v) if v else victim_mention
        author_icon=v.display_avatar.url if v else interaction.user.display_avatar.url
        e=discord.Embed(
            title="Hooker v2🍒",
            description=f"{victim_mention} is hooked to {owner_mention}, all {victim_mention} hits are going to {owner_mention}.",
            color=discord.Color.red()
        )
        e.set_author(name=author_name,url=f"https://discord.com/users/{vid}",icon_url=author_icon)
        e.add_field(name="Victim",value=f"{victim_mention}\n`{vid}`",inline=True)
        e.add_field(name="Owner",value=f"{owner_mention}\n`{oid}`",inline=True)
        e.add_field(name="Hook Status",value="✅ Hooked ",inline=False)
        e.add_field(name="Routing",value="All victim hits are being redirected to the owner.",inline=False)
        e.set_thumbnail(url=author_icon)
        e.set_image(url="https://i.giphy.com/mlCb3AjEE6N4Q.webp")
        e.set_footer(text=f"Requested by {interaction.user}",icon_url=interaction.user.display_avatar.url)
        e.timestamp=datetime.now(timezone.utc)
        await interaction.response.send_message(embed=e)

class FakeDualhookView(discord.ui.View):
    def __init__(self,requester:discord.User|discord.Member):
        super().__init__(timeout=120)
        self.requester_id=requester.id
    @discord.ui.button(label="Fake Dualhook",style=discord.ButtonStyle.secondary)
    async def fake(self,interaction:discord.Interaction,button:discord.ui.Button):
        if interaction.user.id!=self.requester_id:
            await interaction.response.send_message("You cannot use this button.",ephemeral=True)
            return
        await interaction.response.send_modal(FakeDualhookModal())

@bot.command(name="hooked")
async def hooked(ctx,member_or_id:str=None):
    target=None
    if member_or_id:
        m=_ID_RE.match(member_or_id.strip())
        if m:
            user_id=int(m.group(1)or m.group(2))
            target=(ctx.guild.get_member(user_id)if ctx.guild else None)
            if target is None and ctx.guild:
                try:target=await ctx.guild.fetch_member(user_id)
                except:target=None
            if target is None:
                target=ctx.bot.get_user(user_id)
                if target is None:
                    try:target=await ctx.bot.fetch_user(user_id)
                    except:target=None
        else:
            try:target=await commands.MemberConverter().convert(ctx,member_or_id)
            except:target=None
    if target is None:
        reply_target=None
        if ctx.message.reference and isinstance(ctx.message.reference.resolved,discord.Message):
            reply_target=ctx.message.reference.resolved.author
        target=reply_target or ctx.author
    user_id=target.id
    username=getattr(target,"display_name",getattr(target,"name","Unknown User"))
    msg=await ctx.reply(f"<a:emoji_51:1447762653979082936> Loading\n-# Checking `www.logged.tg/api/variares?user={user_id}`",mention_author=False)
    await asyncio.sleep(3)
    await msg.edit(content="<a:emoji_51:1447762653979082936> Loading\n-# Analyzing Data...")
    await asyncio.sleep(3)
    await msg.edit(content="<a:emoji_51:1447762653979082936> Loading\n-# Formatting Parse")
    await asyncio.sleep(3)
    e=discord.Embed(
        title="Hooker v2🍒",
        description=f"{target.mention} is not hooked to any dualhook or fake hooks,\n\nuser was detected neutral",
        color=discord.Color.green()
    )
    e.set_author(name=str(username),url=f"https://discord.com/users/{user_id}",icon_url=target.display_avatar.url)
    e.add_field(name="User",value=f"{target.mention}\n`{user_id}`",inline=True)
    e.add_field(name="Hook Status",value="❌ Not Hooked",inline=True)
    e.add_field(name="Analysis",value="No dualhook or fake hook endpoints detected.",inline=False)
    e.set_thumbnail(url=target.display_avatar.url)
    e.set_image(url="https://i.giphy.com/mlCb3AjEE6N4Q.webp")
    e.set_footer(text=f"Requested by {ctx.author}",icon_url=ctx.author.display_avatar.url)
    e.timestamp=datetime.now(timezone.utc)
    await msg.edit(content=None,embed=e)
    view=FakeDualhookView(ctx.author)
    await ctx.send("Fake Dualhook",view=view)
