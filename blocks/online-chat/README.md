# online-chat

Floating Línea Madrid chat bubble ("LINEA MADRID / CHAT ONLINE / ASISTENTE VIRTUAL"), fixed in the lower-right corner of the viewport as on www.madrid.es. It takes no space in the page flow.

## Authoring

| online-chat |
| --- |
| [Abrir el chat de Línea Madrid en madrid.es](https://www.madrid.es/portal/site/munimadrid) |

- **Link:** where clicking the bubble goes, opened in a new tab. Its text is read to screen readers after the bubble's own words.
- **Image (optional):** a bubble image to use instead of the block's copy of Madrid's graphic (`images/linea-madrid-chat.webp`).
- **No link:** the bubble is informational only.

Put the block in its own section, at the end of the page.

## Behaviour

- **Close button:** the orange cross dismisses the bubble for the rest of the browser session (`sessionStorage`). It doesn't open the chat.
- **Mobile menu:** the bubble is hidden while the mobile menu is open, and in print.
- **Sizes:** measured on madrid.es (bubble size / distance from the right and bottom edges):

  | Width | Size | Right | Bottom |
  |---|---|---|---|
  | Phone | 120px | 59px | 125px |
  | 600px and up | 150px | 66px | 124px |
  | 900px and up | 180px | 88px | 113px |

## Why it links out

The real assistant on www.madrid.es is a script bundle that talks to Madrid's Azure gateway and Microsoft Bot Framework. The gateway only accepts requests from `https://www.madrid.es`, so the chat can't run on this site. Until Madrid enables this domain or publishes a standalone chat URL, the bubble opens madrid.es, where the assistant runs. To point it somewhere else, change the authored link; no code change is needed.
