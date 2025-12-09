import os
import asyncio
import aiohttp
import discord
from discord import app_commands
from discord.ext import commands

BASE_DIR = r"F:\About me Github\Pages\_30embed"
PUBLIC_BASE_URL = "https://favnc.pages.dev/_30embed"

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="$", intents=intents)

def sanitize_name(name: str) -> str:
    base = name.split(".")[0]
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in base)
    return safe or "file"

def get_ext_from_filename(filename: str, default=".png") -> str:
    _, ext = os.path.splitext(filename)
    if not ext:
        ext = default
    return ext.lower()

@bot.event
async def on_ready():
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} commands")
    except Exception as e:
        print(f"Sync error: {e}")
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")

@bot.tree.command(name="favhost", description="Host an image/file to favnc.pages.dev")
@app_commands.describe(
    name="Name for the hosted file (no extension needed)",
    file="Attachment to host (optional if using URL)",
    url="Direct file URL to host (optional if using attachment)",
)
async def favhost(
    interaction: discord.Interaction,
    name: str,
    file: discord.Attachment | None = None,
    url: str | None = None,
):
    if not file and not url:
        await interaction.response.send_message(
            "You must provide either an attachment or a direct URL.",
            ephemeral=True,
        )
        return

    if file and url:
        await interaction.response.send_message(
            "Choose **either** an attachment **or** a URL, not both.",
            ephemeral=True,
        )
        return

    await interaction.response.defer(thinking=True)

    os.makedirs(BASE_DIR, exist_ok=True)
    safe_name = sanitize_name(name)

    if file:
        ext = get_ext_from_filename(file.filename)
        final_path = os.path.join(BASE_DIR, safe_name + ext)
        await file.save(final_path)

    else:
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        await interaction.followup.send(
                            f"Failed to download from URL (HTTP {resp.status})."
                        )
                        return
                    raw = await resp.read()
            except Exception as e:
                await interaction.followup.send(f"Error downloading file: `{e}`")
                return

        ext = get_ext_from_filename(url.split("/")[-1])
        final_path = os.path.join(BASE_DIR, safe_name + ext)
        with open(final_path, "wb") as f:
            f.write(raw)

    public_url = f"{PUBLIC_BASE_URL}/{safe_name}{ext}"

    msg = (
        "Your attachment has now started to host:\n"
        f"{public_url}\n\n"
        "Please wait around 10-20 seconds for it to be uploaded from:\n"
        "Pat PC -> Github Repo -> GitPages -> CloudFare Host -> ://favnc.pages.dev"
    )

    await interaction.followup.send(msg)

bot.run("")
