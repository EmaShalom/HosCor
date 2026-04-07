import { Inbox } from 'lucide-react'

interface Props {
  message: string
  icon?: React.ReactNode
}

export default function EmptyState({ message, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="mb-3 text-gray-300">
        {icon ?? <Inbox size={40} />}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}
