import { useSearchParams } from 'react-router-dom'
import ChatPanel from '../chat/ChatPanel'

// Admin "Messages": loan chats with borrowers, internal groups and direct messages.
// ?chat=<id> opens that chat (e.g. "Loan chat" on a loan's page).
export default function NotesSection() {
  const [searchParams] = useSearchParams()
  const chatId = Number(searchParams.get('chat')) || null
  return <ChatPanel key={chatId ?? 'inbox'} initialChatId={chatId} />
}
