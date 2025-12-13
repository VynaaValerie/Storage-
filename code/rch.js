import fetch from 'node-fetch'

// ====== (apikey di sini) ======
const RCH_BASE = 'https://vynaa.web.id/tools/rch/rch'
const RCH_APIKEY = 'ISI_APIKEY_MU' // AMBIL FI vynaa.web.id
// ==========================================

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(
      m.chat,
      `Contoh: ${usedPrefix + command} https://whatsapp.com/channel/xxxx 😂,😮,👍\n` +
      `Atau: ${usedPrefix + command} https://whatsapp.com/channel/xxxx | 😂,😮,👍`,
      m
    )
  }

  // parsing link + emoji (support "link|emoji" atau "link emoji")
  let link, emoji
  if (text.includes('|')) {
    ;[link, emoji] = text.split('|')
  } else {
    ;[link, emoji] = text.split(' ')
  }

  if (!link || !emoji) {
    return conn.reply(
      m.chat,
      `Format salah!\nContoh:\n${usedPrefix + command} https://whatsapp.com/channel/xxxx 😂,😮,👍\n` +
      `Atau:\n${usedPrefix + command} https://whatsapp.com/channel/xxxx | 😂,😮,👍`,
      m
    )
  }

  link = link.trim()
  emoji = emoji.trim()

  try {
    // endpoint baru: ?apikey=...&link=... (opsional: &emoji=... kalau API kamu butuh)
    const url =
      `${RCH_BASE}?apikey=${encodeURIComponent(RCH_APIKEY)}` +
      `&link=${encodeURIComponent(link)}` +
      `&emoji=${encodeURIComponent(emoji)}`

    const res = await fetch(url, { method: 'GET' })
    const raw = await res.text()

    let json
    try { json = JSON.parse(raw) } catch { json = null }

    if (!res.ok) {
      return conn.reply(m.chat, `Request gagal (${res.status}).\n${raw}`, m)
    }

    if (!json?.status) {
      return conn.reply(m.chat, `Gagal: ${json?.message || raw}`, m)
    }

    const channelId = json.channelId || link.split('/channel/')[1]?.split('/')[0]?.trim() || '-'

    return conn.reply(
      m.chat,
      `reaksi terkirim.\n` +
      `• message: ${json.message || 'OK'}\n` +
      `• link: ${json?.result?.link || link}\n` +
      `• emoji: ${json?.result?.emojis || emoji}\n` +
      `• channelId: ${channelId}\n` +
      `• creator: ${json?.result?.creator || '-'}`,
      m
    )
  } catch (e) {
    return conn.reply(m.chat, `error: ${e}`, m)
  }
}

handler.help = ['rch <link> <emoji>']
handler.tags = ['main']
handler.command = ['rch']
handler.register = true

export default handler
/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/